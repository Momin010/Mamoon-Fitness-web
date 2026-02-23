
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, Camera, Keyboard, AlertCircle, History } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useOpenFoodFacts, getRecentScans, getCachedProduct } from '../hooks/useOpenFoodFacts';
import BarcodeScanner from '../components/BarcodeScanner';
import PhotoLogScanner from '../components/PhotoLogScanner';
import BarcodeMealPreview from '../components/BarcodeMealPreview';
import { OpenFoodFactsProduct, searchProducts } from '../lib/openFoodFacts';
import { identifyFood } from '../lib/gemini';

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
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    mealType: 'snack' as 'breakfast' | 'lunch' | 'dinner' | 'snack'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load recent scans on mount
  useEffect(() => {
    setRecentScans(getRecentScans());
  }, []);

  // Handle photo capture and analysis
  const handlePhotoCapture = async (base64Image: string) => {
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
  };

  // Handle barcode scan - don't close scanner, let it show loading state
  const handleBarcodeScan = async (barcode: string) => {
    // Don't close scanner - keep it open to show loading state
    const result = await lookupBarcode(barcode);
    if (result.success && result.product) {
      setScannedProduct(result.product);
      setShowScanner(false); // Only close after successful lookup
      setShowPreview(true);
    } else {
      // On error, keep scanner open so user can try again
      // The error toast will show from the hook
    }
  };

  // Handle preview confirm
  const handlePreviewConfirm = (mealData: {
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
      mealType: formData.mealType
    });
    setView('manual');
    // Refresh recent scans
    setRecentScans(getRecentScans());
  };

  // Handle recent scan click
  const handleRecentScan = async (barcode: string) => {
    const cached = getCachedProduct(barcode);
    if (cached) {
      setScannedProduct(cached);
      setShowPreview(true);
    } else {
      const result = await lookupBarcode(barcode);
      if (result.success && result.product) {
        setScannedProduct(result.product);
        setShowPreview(true);
      }
    }
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Meal name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 50) return 'Name must be less than 50 characters';
        return '';
      case 'calories':
        if (!value) return 'Calories are required';
        const cal = parseInt(value);
        if (isNaN(cal) || cal < 0) return 'Must be a positive number';
        if (cal > 5000) return 'That seems too high (max 5000)';
        return '';
      case 'protein':
      case 'carbs':
      case 'fats':
        if (value) {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0) return 'Must be a positive number';
          if (num > 500) return 'That seems too high (max 500g)';
        }
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    newErrors.name = validateField('name', formData.name);
    newErrors.calories = validateField('calories', formData.calories);
    newErrors.protein = validateField('protein', formData.protein);
    newErrors.carbs = validateField('carbs', formData.carbs);
    newErrors.fats = validateField('fats', formData.fats);

    setErrors(newErrors);
    return !Object.values(newErrors).some(e => e);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field as keyof typeof formData] as string) }));
  };

  const handleChange = (field: string, value: string) => {
    // Allow decimal values for macro fields
    if (['protein', 'carbs', 'fats'].includes(field)) {
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, calories: true, protein: true, carbs: true, fats: true });

    if (!validateForm()) return;

    addMeal({
      name: formData.name.trim(),
      calories: parseInt(formData.calories),
      protein: parseFloat(formData.protein) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      fats: parseFloat(formData.fats) || 0,
      mealType: formData.mealType
    });
    navigate('/macros');
  };

  if (view === 'manual') {
    return (
      <div className="flex flex-col min-h-screen p-6 bg-black text-white">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('options')} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Log Meal</h1>
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
                  className={`py-3 rounded-lg text-sm font-medium capitalize transition-colors ${formData.mealType === type
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
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
            />
            {errors.calories && touched.calories && (
              <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={14} /> {errors.calories}
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
                />
                {errors.fats && touched.fats && (
                  <p className="mt-1 text-red-400 text-xs">{errors.fats}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="submit"
              className="w-full bg-green-500 text-black py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-green-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Meal (+50 XP)
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 bg-black text-white">
      <header className="flex items-center gap-4 mb-16">
        <button onClick={() => navigate('/macros')} className="p-2 hover:bg-zinc-900 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Add Meal</h1>
      </header>

      <div className="space-y-6">
        <button
          onClick={() => setView('manual')}
          className="w-full p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Keyboard size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Manual Entry</h3>
              <p className="text-zinc-400 text-sm">Enter nutrition details manually</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowPhotoLog(true)}
          className="w-full p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] text-left border-2 border-transparent hover:border-green-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Camera size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Photo Log</h3>
              <p className="text-zinc-400 text-sm">AI Food & Drink Recognition (Gemini)</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            console.log('Scan Barcode button clicked!');
            setShowScanner(true);
          }}
          className="w-full p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] text-left border-2 border-transparent hover:border-green-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <QrCode size={24} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Scan Barcode</h3>
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
                    className="px-3 py-2 bg-zinc-900 rounded-lg text-sm hover:bg-zinc-800 transition-colors text-left"
                  >
                    <p className="font-medium truncate max-w-[150px]">
                      {cached?.name || barcode}
                    </p>
                    {cached && (
                      <p className="text-xs text-zinc-500">
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
              className="text-zinc-500 hover:text-white"
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
