
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, Camera, Keyboard, AlertCircle, History, Save, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useOpenFoodFacts, getRecentScans, getCachedProduct } from '../hooks/useOpenFoodFacts';
import BarcodeScanner from '../components/BarcodeScanner';
import PhotoLogScanner from '../components/PhotoLogScanner';
import BarcodeMealPreview from '../components/BarcodeMealPreview';
import { OpenFoodFactsProduct, searchProducts } from '../lib/openFoodFacts';
import { identifyFood } from '../lib/gemini';

// Enhanced form data interface
interface MealFormData {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servingSize?: string;
  barcode?: string;
}

// Enhanced error interface
interface FormErrors {
  name?: string;
  calories?: string;
  protein?: string;
  carbs?: string;
  fats?: string;
  servingSize?: string;
}

const AddMealPage: React.FC = () => {
  const navigate = useNavigate();
  const { addMeal } = useApp();
  const { product, isLoading, error, errorType, lookupBarcode, clearError } = useOpenFoodFacts();
  const [view, setView] = useState<'options' | 'manual'>('options');
  const [showScanner, setShowScanner] = useState(false);
  const [showPhotoLog, setShowPhotoLog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveData, setAutoSaveData] = useState<Partial<MealFormData> | null>(null);
  
  // Enhanced form data with auto-save support
  const [formData, setFormData] = useState<MealFormData>({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    mealType: 'snack',
    servingSize: '',
    barcode: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-save form data to prevent loss
  const saveFormData = useCallback(() => {
    const dataToSave = {
      ...formData,
      timestamp: Date.now()
    };
    localStorage.setItem('forge-meal-form', JSON.stringify(dataToSave));
  }, [formData]);

  // Load saved form data
  const loadSavedFormData = useCallback(() => {
    try {
      const saved = localStorage.getItem('forge-meal-form');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only load if data is less than 1 hour old
        if (Date.now() - parsed.timestamp < 3600000) {
          setAutoSaveData(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
  }, []);

  // Load recent scans and saved data on mount
  useEffect(() => {
    setRecentScans(getRecentScans());
    loadSavedFormData();
  }, [loadSavedFormData]);

  // Auto-save form data periodically
  useEffect(() => {
    if (view === 'manual' && formData.name) {
      const timer = setTimeout(saveFormData, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, view, saveFormData]);

  // Handle photo capture and analysis with enhanced error handling
  const handlePhotoCapture = useCallback(async (base64Image: string) => {
    setIsAnalyzing(true);
    setAiError(null);

    try {
      const result = await identifyFood(base64Image);

      if (!result.success || !result.analysis) {
        setAiError(result.error || 'Failed to identify food');
        setIsAnalyzing(false);
        return;
      }

      const { analysis } = result;

      // Try to search OpenFoodFacts for more accurate data using the AI's search query
      const searchResult = await searchProducts(analysis.searchQuery);

      if (searchResult.success && searchResult.products.length > 0) {
        // Use the first result from OFF
        setScannedProduct(searchResult.products[0]);
      } else {
        // Fallback to Gemini's estimates
        // Normalize to per-100g values as the previewer expects this
        const { estimatedMacros } = analysis;
        const ratio = 100 / estimatedMacros.servingSizeGrams;

        setScannedProduct({
          barcode: 'ai-generated',
          name: analysis.name,
          brand: 'AI Estimated',
          calories: Math.round(estimatedMacros.calories * ratio),
          protein: Math.round(estimatedMacros.protein * ratio * 10) / 10,
          carbs: Math.round(estimatedMacros.carbs * ratio * 10) / 10,
          fat: Math.round(estimatedMacros.fats * ratio * 10) / 10,
          servingSize: estimatedMacros.servingSizeGrams,
          hasCompleteData: true,
          missingFields: []
        });
      }

      setShowPhotoLog(false);
      setShowPreview(true);
    } catch (err) {
      console.error('Photo log error:', err);
      setAiError('An unexpected error occurred during AI analysis');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Enhanced barcode scan handler
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    try {
      const result = await lookupBarcode(barcode);
      if (result.success && result.product) {
        setScannedProduct(result.product);
        setShowScanner(false); // Only close after successful lookup
        setShowPreview(true);
      } else {
        // Keep scanner open on error so user can try again
        console.error('Barcode lookup failed:', result.error);
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
    }
  }, [lookupBarcode]);

  // Enhanced preview confirm handler
  const handlePreviewConfirm = useCallback((mealData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    servingSize: number;
    barcode: string;
  }) => {
    setShowPreview(false);
    // Pre-fill form with scanned data
    setFormData({
      name: mealData.name,
      calories: mealData.calories.toString(),
      protein: mealData.protein.toString(),
      carbs: mealData.carbs.toString(),
      fats: mealData.fats.toString(),
      mealType: formData.mealType,
      servingSize: mealData.servingSize.toString(),
      barcode: mealData.barcode
    });
    setView('manual');
    // Refresh recent scans
    setRecentScans(getRecentScans());
  }, [formData.mealType]);

  // Enhanced recent scan handler
  const handleRecentScan = useCallback(async (barcode: string) => {
    try {
      const cached = getCachedProduct(barcode);
      if (cached) {
        setScannedProduct(cached);
        setShowPreview(true);
      } else {
        const result = await lookupBarcode(barcode);
        if (result.success && result.product) {
          setScannedProduct(result.product);
          setShowPreview(true);
        } else {
          console.error('Recent scan lookup failed:', result.error);
        }
      }
    } catch (error) {
      console.error('Recent scan error:', error);
    }
  }, [lookupBarcode]);

  // Enhanced validation functions
  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Meal name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 100) return 'Name must be less than 100 characters';
        return '';
      case 'calories':
        if (!value) return 'Calories are required';
        const cal = parseInt(value);
        if (isNaN(cal) || cal < 0) return 'Must be a positive number';
        if (cal > 10000) return 'Calories seem too high (max 10000)';
        return '';
      case 'protein':
      case 'carbs':
      case 'fats':
        if (value) {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0) return 'Must be a positive number';
          if (num > 1000) return 'Value seems too high (max 1000g)';
        }
        return '';
      case 'servingSize':
        if (value) {
          const num = parseFloat(value);
          if (isNaN(num) || num <= 0) return 'Must be a positive number';
          if (num > 5000) return 'Serving size seems too large (max 5000g)';
        }
        return '';
      default:
        return '';
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    newErrors.name = validateField('name', formData.name);
    newErrors.calories = validateField('calories', formData.calories);
    newErrors.protein = validateField('protein', formData.protein);
    newErrors.carbs = validateField('carbs', formData.carbs);
    newErrors.fats = validateField('fats', formData.fats);
    newErrors.servingSize = formData.servingSize ? validateField('servingSize', formData.servingSize) : undefined;

    setErrors(newErrors);
    return !Object.values(newErrors).some(e => e);
  }, [formData, validateField]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field as keyof MealFormData] as string) }));
  }, [formData, validateField]);

  const handleChange = useCallback((field: string, value: string) => {
    // Allow decimal values for macro fields and serving size
    if (['protein', 'carbs', 'fats', 'servingSize'].includes(field)) {
      // Allow empty, numbers, and one decimal point
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (touched[field]) {
          setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (touched[field]) {
        setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
      }
    }
  }, [touched, validateField]);

  // Enhanced form submission with better error handling
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mark all fields as touched
    setTouched({
      name: true,
      calories: true,
      protein: true,
      carbs: true,
      fats: true,
      servingSize: true
    });

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const mealData = {
        name: formData.name.trim(),
        calories: parseInt(formData.calories),
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fats: parseFloat(formData.fats) || 0,
        mealType: formData.mealType,
        servingSize: formData.servingSize ? parseFloat(formData.servingSize) : undefined,
        barcode: formData.barcode || undefined
      };

      await addMeal(mealData);
      
      // Clear saved form data on successful submission
      localStorage.removeItem('forge-meal-form');
      
      // Navigate to macros page
      navigate('/macros');
    } catch (error) {
      console.error('Failed to add meal:', error);
      setErrors(prev => ({ ...prev, submit: 'Failed to save meal. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, addMeal, navigate]);

  // Load auto-saved data when switching to manual view
  useEffect(() => {
    if (view === 'manual' && autoSaveData) {
      setFormData(prev => ({ ...prev, ...autoSaveData }));
      setAutoSaveData(null);
    }
  }, [view, autoSaveData]);

  // Manual entry view
  if (view === 'manual') {
    return (
      <div className="flex flex-col min-h-screen p-6 bg-black text-white">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView('options')}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Log Meal</h1>
          {autoSaveData && (
            <div className="ml-auto bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">
              Auto-saved data loaded
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-zinc-500 text-sm font-medium mb-2">Meal Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mealType: type }))}
                  disabled={isSubmitting}
                  className={`py-3 rounded-lg text-sm font-medium capitalize transition-colors ${formData.mealType === type
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-500 text-sm font-medium mb-2">Meal Name *</label>
            <input
              type="text"
              placeholder="e.g., Chicken Salad"
              className={`w-full bg-transparent border-b-2 py-3 text-xl outline-none transition-colors ${errors.name && touched.name ? 'border-red-500' : 'border-zinc-800 focus:border-green-500'
                }`}
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              disabled={isSubmitting}
              maxLength={100}
            />
            {errors.name && touched.name && (
              <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={14} /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-zinc-500 text-sm font-medium mb-2">Calories *</label>
            <input
              type="number"
              placeholder="0 kcal"
              className={`w-full bg-transparent border-b-2 py-3 text-xl outline-none transition-colors ${errors.calories && touched.calories ? 'border-red-500' : 'border-zinc-800 focus:border-green-500'
                }`}
              value={formData.calories}
              onChange={e => handleChange('calories', e.target.value)}
              onBlur={() => handleBlur('calories')}
              min="0"
              max="10000"
              disabled={isSubmitting}
            />
            {errors.calories && touched.calories && (
              <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={14} /> {errors.calories}
              </p>
            )}
          </div>

          <div>
            <label className="block text-zinc-500 text-sm font-medium mb-2">Serving Size (g)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 100"
              className={`w-full bg-transparent border-b-2 py-3 text-xl outline-none transition-colors ${errors.servingSize && touched.servingSize ? 'border-red-500' : 'border-zinc-800 focus:border-green-500'
                }`}
              value={formData.servingSize}
              onChange={e => handleChange('servingSize', e.target.value)}
              onBlur={() => handleBlur('servingSize')}
              min="0"
              max="5000"
              disabled={isSubmitting}
            />
            {errors.servingSize && touched.servingSize && (
              <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={14} /> {errors.servingSize}
              </p>
            )}
          </div>

          <div>
            <label className="block text-zinc-500 text-sm font-medium mb-4">Macros (optional)</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-600 text-xs mb-1">Protein (g)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  className={`w-full bg-zinc-900 rounded-lg px-3 py-3 text-lg outline-none transition-colors ${errors.protein && touched.protein ? 'border border-red-500' : 'border border-zinc-800 focus:border-green-500'
                    }`}
                  value={formData.protein}
                  onChange={e => handleChange('protein', e.target.value)}
                  onBlur={() => handleBlur('protein')}
                  min="0"
                  max="1000"
                  disabled={isSubmitting}
                />
                {errors.protein && touched.protein && (
                  <p className="mt-1 text-red-400 text-xs">{errors.protein}</p>
                )}
              </div>
              <div>
                <label className="block text-zinc-600 text-xs mb-1">Carbs (g)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  className={`w-full bg-zinc-900 rounded-lg px-3 py-3 text-lg outline-none transition-colors ${errors.carbs && touched.carbs ? 'border border-red-500' : 'border border-zinc-800 focus:border-green-500'
                    }`}
                  value={formData.carbs}
                  onChange={e => handleChange('carbs', e.target.value)}
                  onBlur={() => handleBlur('carbs')}
                  min="0"
                  max="1000"
                  disabled={isSubmitting}
                />
                {errors.carbs && touched.carbs && (
                  <p className="mt-1 text-red-400 text-xs">{errors.carbs}</p>
                )}
              </div>
              <div>
                <label className="block text-zinc-600 text-xs mb-1">Fats (g)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  className={`w-full bg-zinc-900 rounded-lg px-3 py-3 text-lg outline-none transition-colors ${errors.fats && touched.fats ? 'border border-red-500' : 'border border-zinc-800 focus:border-green-500'
                    }`}
                  value={formData.fats}
                  onChange={e => handleChange('fats', e.target.value)}
                  onBlur={() => handleBlur('fats')}
                  min="0"
                  max="1000"
                  disabled={isSubmitting}
                />
                {errors.fats && touched.fats && (
                  <p className="mt-1 text-red-400 text-xs">{errors.fats}</p>
                )}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-500 text-black py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-green-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Meal (+50 XP)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Main options view
  return (
    <div className="flex flex-col min-h-screen p-6 bg-black text-white">
      <header className="flex items-center gap-4 mb-16">
        <button
          onClick={() => navigate('/macros')}
          className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Add Meal</h1>
      </header>

      <div className="space-y-6">
        <button
          onClick={() => setView('manual')}
          className="w-full p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
              <Keyboard size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg group-hover:text-green-400 transition-colors">Manual Entry</h3>
              <p className="text-zinc-400 text-sm">Enter nutrition details manually</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowPhotoLog(true)}
          className="w-full p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] text-left group border-2 border-transparent hover:border-green-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
              <Camera size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg group-hover:text-green-400 transition-colors">Photo Log</h3>
              <p className="text-zinc-400 text-sm">AI Food & Drink Recognition (Gemini)</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            console.log('Scan Barcode button clicked!');
            setShowScanner(true);
          }}
          className="w-full p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] text-left group border-2 border-transparent hover:border-green-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
              <QrCode size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors">Scan Barcode</h3>
              <p className="text-zinc-400 text-sm">Scan or type product barcode</p>
            </div>
          </div>
        </button>

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
              <History size={14} />
              Recent Scans
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentScans.slice(0, 5).map(barcode => {
                const cached = getCachedProduct(barcode);
                return (
                  <button
                    key={barcode}
                    onClick={() => handleRecentScan(barcode)}
                    className="px-3 py-2 bg-zinc-900 rounded-lg text-sm hover:bg-zinc-800 transition-colors text-left group"
                  >
                    <p className="font-medium truncate max-w-[150px] group-hover:text-green-400 transition-colors">
                      {cached?.name || barcode}
                    </p>
                    {cached && (
                      <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        {cached.calories} kcal / 100g
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
        isLookupLoading={isLoading}
      />

      {/* Photo Log Scanner Modal */}
      <PhotoLogScanner
        isOpen={showPhotoLog}
        onClose={() => setShowPhotoLog(false)}
        onCapture={handlePhotoCapture}
        isAnalyzing={isAnalyzing}
      />

      {/* Product Preview Modal */}
      {showPreview && scannedProduct && (
        <BarcodeMealPreview
          product={scannedProduct}
          onConfirm={handlePreviewConfirm}
          onCancel={() => {
            setShowPreview(false);
            setScannedProduct(null);
          }}
        />
      )}

      {/* Error Toast */}
      {(error || aiError) && (
        <div className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-red-400 font-medium">{error || aiError}</p>
              {errorType === 'not_found' && (
                <p className="text-zinc-500 text-sm mt-1">
                  Try manual entry or check the barcode.
                </p>
              )}
              {errorType === 'api_error' && !aiError && (
                <p className="text-zinc-500 text-sm mt-1">
                  OFF database connection error.
                </p>
              )}
            </div>
            <button
              onClick={() => {
                clearError();
                setAiError(null);
              }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMealPage;
