/**
 * OpenFoodFacts API Service
 * Handles fetching and normalizing product data from OpenFoodFacts
 */

export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  brand: string;
  imageUrl?: string;
  servingSize: number; // in grams
  calories: number; // per 100g
  protein: number; // per 100g
  carbs: number; // per 100g
  fat: number; // per 100g
  hasCompleteData: boolean;
  missingFields: string[];
  rawData?: any; // Full OFF response for caching
}

export interface OFFLookupResult {
  success: boolean;
  product?: OpenFoodFactsProduct;
  error?: 'not_found' | 'no_nutrition_data' | 'api_error';
  message?: string;
}

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product';

/**
 * Convert kJ to kcal
 */
const kjToKcal = (kj: number): number => Math.round(kj / 4.184);

/**
 * Extract numeric value from quantity string (e.g., "30g" → 30)
 */
const parseQuantity = (quantity?: string): number => {
  if (!quantity) return 100;
  const match = quantity.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 100;
};

/**
 * Normalize macros from OFF nutriments data
 * Priority: 100g values → serving values → kJ conversion
 */
const normalizeMacros = (nutriments: any): Partial<OpenFoodFactsProduct> => {
  const missingFields: string[] = [];
  
  // Calories - check multiple possible fields
  let calories: number | null = null;
  if (nutriments['energy-kcal_100g'] !== undefined) {
    calories = nutriments['energy-kcal_100g'];
  } else if (nutriments['energy-kcal'] !== undefined) {
    calories = nutriments['energy-kcal'];
  } else if (nutriments['energy_100g'] !== undefined) {
    // energy_100g is in kJ
    calories = kjToKcal(nutriments['energy_100g']);
  } else if (nutriments['energy'] !== undefined) {
    calories = kjToKcal(nutriments['energy']);
  }
  
  if (calories === null || isNaN(calories)) {
    missingFields.push('calories');
    calories = 0;
  }

  // Protein
  let protein: number | null = null;
  if (nutriments['proteins_100g'] !== undefined) {
    protein = nutriments['proteins_100g'];
  } else if (nutriments['proteins'] !== undefined) {
    protein = nutriments['proteins'];
  }
  
  if (protein === null || isNaN(protein)) {
    missingFields.push('protein');
    protein = 0;
  }

  // Carbs
  let carbs: number | null = null;
  if (nutriments['carbohydrates_100g'] !== undefined) {
    carbs = nutriments['carbohydrates_100g'];
  } else if (nutriments['carbohydrates'] !== undefined) {
    carbs = nutriments['carbohydrates'];
  }
  
  if (carbs === null || isNaN(carbs)) {
    missingFields.push('carbs');
    carbs = 0;
  }

  // Fat
  let fat: number | null = null;
  if (nutriments['fat_100g'] !== undefined) {
    fat = nutriments['fat_100g'];
  } else if (nutriments['fat'] !== undefined) {
    fat = nutriments['fat'];
  }
  
  if (fat === null || isNaN(fat)) {
    missingFields.push('fat');
    fat = 0;
  }

  return {
    calories,
    protein,
    carbs,
    fat,
    missingFields,
    hasCompleteData: missingFields.length === 0
  };
};

/**
 * Determine serving size from OFF data
 * Priority: serving_quantity → quantity → default 100g
 */
const determineServingSize = (product: any): number => {
  // Check serving_quantity first (most reliable)
  if (product.serving_quantity) {
    const qty = parseFloat(product.serving_quantity);
    if (!isNaN(qty) && qty > 0) return qty;
  }
  
  // Check serving_size string (e.g., "30g")
  if (product.serving_size) {
    const parsed = parseQuantity(product.serving_size);
    if (parsed > 0) return parsed;
  }
  
  // Check quantity (e.g., "500g")
  if (product.quantity) {
    const parsed = parseQuantity(product.quantity);
    if (parsed > 0) return parsed;
  }
  
  // Default to 100g
  return 100;
};

/**
 * Lookup product by barcode
 */
export const lookupBarcode = async (barcode: string): Promise<OFFLookupResult> => {
  try {
    // Validate barcode
    if (!barcode || barcode.trim().length < 8) {
      return {
        success: false,
        error: 'not_found',
        message: 'Invalid barcode format'
      };
    }

    const cleanBarcode = barcode.trim();
    
    // Fetch from OFF API
    const response = await fetch(`${OFF_API_BASE}/${cleanBarcode}.json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'api_error',
        message: `API error: ${response.status}`
      };
    }

    const data = await response.json();

    // Check if product exists
    if (data.status !== 1 || !data.product) {
      return {
        success: false,
        error: 'not_found',
        message: 'Product not found in database'
      };
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    // Check if we have any nutrition data
    const hasNutritionData = Object.keys(nutriments).length > 0 && (
      nutriments['energy-kcal_100g'] !== undefined ||
      nutriments['energy-kcal'] !== undefined ||
      nutriments['energy_100g'] !== undefined ||
      nutriments['energy'] !== undefined
    );

    if (!hasNutritionData) {
      return {
        success: false,
        error: 'no_nutrition_data',
        message: 'No nutrition information available for this product'
      };
    }

    // Normalize macros
    const macros = normalizeMacros(nutriments);
    const servingSize = determineServingSize(product);

    // Build normalized product
    const normalizedProduct: OpenFoodFactsProduct = {
      barcode: cleanBarcode,
      name: product.product_name_en || product.product_name || 'Unknown Product',
      brand: product.brands || product.brand_owner || 'Unknown Brand',
      imageUrl: product.image_url || product.image_small_url,
      servingSize,
      calories: macros.calories || 0,
      protein: macros.protein || 0,
      carbs: macros.carbs || 0,
      fat: macros.fat || 0,
      hasCompleteData: macros.hasCompleteData || false,
      missingFields: macros.missingFields || [],
      rawData: product // Cache full data
    };

    return {
      success: true,
      product: normalizedProduct
    };

  } catch (error) {
    console.error('OpenFoodFacts lookup error:', error);
    return {
      success: false,
      error: 'api_error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Scale macros based on serving size
 * All macros stored per 100g, scale proportionally
 */
export const scaleMacros = (
  product: OpenFoodFactsProduct,
  targetServingSize: number
): { calories: number; protein: number; carbs: number; fat: number } => {
  const ratio = targetServingSize / 100; // All macros are per 100g
  
  return {
    calories: Math.round(product.calories * ratio),
    protein: Math.round(product.protein * ratio * 10) / 10, // Keep 1 decimal
    carbs: Math.round(product.carbs * ratio * 10) / 10,
    fat: Math.round(product.fat * ratio * 10) / 10
  };
};

/**
 * Calculate macros for a specific serving
 */
export const calculateServingMacros = (
  product: OpenFoodFactsProduct,
  servingSize: number
) => {
  const scaled = scaleMacros(product, servingSize);
  
  return {
    ...scaled,
    servingSize,
    originalServingSize: product.servingSize
  };
};
