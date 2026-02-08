
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, Camera, Keyboard, AlertCircle, History, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useOpenFoodFacts, getRecentScans, getCachedProduct } from '../hooks/useOpenFoodFacts';
import BarcodeScanner from '../components/BarcodeScanner';
import BarcodeMealPreview from '../components/BarcodeMealPreview';
import { OpenFoodFactsProduct } from '../lib/openFoodFacts';

const AddMealPage: React.FC = () => {
  const navigate = useNavigate();
  const { addMeal } = useApp();
  const { product, isLoading, error, errorType, lookupBarcode, clearError } = useOpenFoodFacts();
  const [view, setView] = useState<'options' | 'manual'>('options');
  const [showScanner, setShowScanner] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<OpenFoodFactsProduct | null>(null);
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

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    const success = await lookupBarcode(barcode);
    if (success && product) {
      setScannedProduct(product);
      setShowPreview(true);
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
      const success = await lookupBarcode(barcode);
      if (success && product) {
        setScannedProduct(product);
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
          const num = parseInt(value);
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
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, calories: true, protein: true, carbs: true, fats: true });
    
    if (!validateForm()) return;

    addMeal({
      name: formData.name.trim(),
      calories: parseInt(formData.calories),
      protein: parseInt(formData.protein) || 0,
      carbs: parseInt(formData.carbs) || 0,
      fats: parseInt(formData.fats) || 0,
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
                  className={`py-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                    formData.mealType === type 
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
              className={`w-full bg-transparent border-b-2 py-3 text-xl outline-none transition-colors ${
                errors.name && touched.name ? 'border-red-500' : 'border-zinc-800 focus:border-green-500'
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
              className={`w-full bg-transparent border-b-2 py-3 text-xl outline-none transition-colors ${
                errors.calories && touched.calories ? 'border-red-500' : 'border-zinc-800 focus:border-green-500'
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
                  placeholder="0"
                  className={`w-full bg-zinc-900 rounded-lg px-3 py-3 text-lg outline-none transition-colors ${
                    errors.protein && touched.protein ? 'border border-red-500' : 'border border-zinc-800 focus:border-green-500'
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
                  placeholder="0"
                  className={`w-full bg-zinc-900 rounded-lg px-3 py-3 text-lg outline-none transition-colors ${
                    errors.carbs && touched.carbs ? 'border border-red-500' : 'border border-zinc-800 focus:border-green-500'
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
                  placeholder="0"
                  className={`w-full bg-zinc-900 rounded-lg px-3 py-3 text-lg outline-none transition-colors ${
                    errors.fats && touched.fats ? 'border border-red-500' : 'border border-zinc-800 focus:border-green-500'
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
          disabled
          className="w-full p-6 bg-zinc-900/50 rounded-2xl opacity-50 cursor-not-allowed text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-800 rounded-xl">
              <Camera size={24} className="text-zinc-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Photo Log</h3>
              <p className="text-zinc-500 text-sm">Coming soon - AI-powered food recognition</p>
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

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin text-green-500 mx-auto mb-4" size={48} />
            <p className="text-zinc-400">Looking up product...</p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-red-400 font-medium">{error}</p>
              {errorType === 'not_found' && (
                <p className="text-zinc-500 text-sm mt-1">
                  Try manual entry or check the barcode.
                </p>
              )}
              {errorType === 'no_nutrition_data' && (
                <p className="text-zinc-500 text-sm mt-1">
                  Product found but no nutrition info available.
                </p>
              )}
            </div>
            <button 
              onClick={clearError}
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
