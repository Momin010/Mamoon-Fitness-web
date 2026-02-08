import React, { useState, useMemo } from 'react';
import { AlertCircle, Plus, Minus, Check, Package, Info } from 'lucide-react';
import { OpenFoodFactsProduct, calculateServingMacros } from '../lib/openFoodFacts';

interface BarcodeMealPreviewProps {
  product: OpenFoodFactsProduct;
  onConfirm: (mealData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    servingSize: number;
    barcode: string;
  }) => void;
  onCancel: () => void;
}

const BarcodeMealPreview: React.FC<BarcodeMealPreviewProps> = ({ 
  product, 
  onConfirm, 
  onCancel 
}) => {
  const [servingSize, setServingSize] = useState(product.servingSize);
  
  // Calculate scaled macros
  const scaledMacros = useMemo(() => {
    return calculateServingMacros(product, servingSize);
  }, [product, servingSize]);

  // Adjust serving size
  const adjustServing = (delta: number) => {
    setServingSize(prev => {
      const newSize = Math.max(1, Math.round(prev + delta));
      return newSize;
    });
  };

  // Quick preset buttons
  const servingPresets = [30, 50, 100, 150, 200, 250];

  // Handle confirm
  const handleConfirm = () => {
    onConfirm({
      name: product.name,
      calories: scaledMacros.calories,
      protein: scaledMacros.protein,
      carbs: scaledMacros.carbs,
      fats: scaledMacros.fat,
      servingSize,
      barcode: product.barcode
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-zinc-900">
        <h2 className="text-lg font-bold">Product Found</h2>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Product Card */}
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">
          {/* Product Image & Name */}
          <div className="flex gap-4">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-24 h-24 object-contain bg-white rounded-xl"
              />
            ) : (
              <div className="w-24 h-24 bg-zinc-800 rounded-xl flex items-center justify-center">
                <Package size={32} className="text-zinc-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg leading-tight line-clamp-2">
                {product.name}
              </h3>
              <p className="text-zinc-500 text-sm mt-1">{product.brand}</p>
              <p className="text-zinc-600 text-xs mt-2 font-mono">
                {product.barcode}
              </p>
            </div>
          </div>

          {/* Missing Data Warning */}
          {!product.hasCompleteData && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-yellow-400 text-xs">
                  Some nutrition values are missing from the database. 
                  You can edit them after adding.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Serving Size Control */}
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold">Serving Size</h4>
            <span className="text-2xl font-black text-green-500">
              {servingSize}g
            </span>
          </div>

          {/* Adjustment Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => adjustServing(-10)}
              className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all"
            >
              <Minus size={20} />
            </button>
            
            <div className="flex-1 max-w-[120px]">
              <input
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <button
              onClick={() => adjustServing(10)}
              className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            {servingPresets.map(preset => (
              <button
                key={preset}
                onClick={() => setServingSize(preset)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  servingSize === preset
                    ? 'bg-green-500 text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {preset}g
              </button>
            ))}
          </div>

          {product.servingSize !== 100 && (
            <p className="text-xs text-zinc-500 text-center">
              Original serving: {product.servingSize}g
            </p>
          )}
        </div>

        {/* Macros Display */}
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-4">
          <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-500">
            Nutrition Facts
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Calories */}
            <div className="bg-zinc-800 rounded-xl p-3">
              <p className="text-zinc-500 text-xs mb-1">Calories</p>
              <p className="text-2xl font-black text-white">
                {scaledMacros.calories}
                <span className="text-sm font-normal text-zinc-500 ml-1">kcal</span>
              </p>
            </div>

            {/* Protein */}
            <div className={`rounded-xl p-3 ${product.missingFields.includes('protein') ? 'bg-zinc-800/50 border border-zinc-700' : 'bg-zinc-800'}`}>
              <p className="text-zinc-500 text-xs mb-1 flex items-center gap-1">
                Protein
                {product.missingFields.includes('protein') && (
                  <AlertCircle size={12} className="text-yellow-500" />
                )}
              </p>
              <p className={`text-2xl font-black ${product.missingFields.includes('protein') ? 'text-zinc-500' : 'text-blue-400'}`}>
                {scaledMacros.protein}g
              </p>
            </div>

            {/* Carbs */}
            <div className={`rounded-xl p-3 ${product.missingFields.includes('carbs') ? 'bg-zinc-800/50 border border-zinc-700' : 'bg-zinc-800'}`}>
              <p className="text-zinc-500 text-xs mb-1 flex items-center gap-1">
                Carbs
                {product.missingFields.includes('carbs') && (
                  <AlertCircle size={12} className="text-yellow-500" />
                )}
              </p>
              <p className={`text-2xl font-black ${product.missingFields.includes('carbs') ? 'text-zinc-500' : 'text-yellow-400'}`}>
                {scaledMacros.carbs}g
              </p>
            </div>

            {/* Fat */}
            <div className={`rounded-xl p-3 ${product.missingFields.includes('fat') ? 'bg-zinc-800/50 border border-zinc-700' : 'bg-zinc-800'}`}>
              <p className="text-zinc-500 text-xs mb-1 flex items-center gap-1">
                Fat
                {product.missingFields.includes('fat') && (
                  <AlertCircle size={12} className="text-yellow-500" />
                )}
              </p>
              <p className={`text-2xl font-black ${product.missingFields.includes('fat') ? 'text-zinc-500' : 'text-red-400'}`}>
                {scaledMacros.fat}g
              </p>
            </div>
          </div>

          {/* Per 100g Reference */}
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-600 text-center">
              Per 100g: {product.calories} kcal | P: {product.protein}g | C: {product.carbs}g | F: {product.fat}g
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <button
          onClick={handleConfirm}
          className="w-full bg-green-500 text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Check size={20} />
          Add to Meal (+50 XP)
        </button>
      </div>
    </div>
  );
};

export default BarcodeMealPreview;
