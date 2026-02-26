/**
 * Gemini AI Service for Food Identification
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite'; // 2.5 Flash-Lite is the latest, most efficient model for vision
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiFoodAnalysis {
  name: string;
  confidence: number;
  estimatedMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    servingSizeGrams: number;
  };
  searchQuery: string; // Used to fallback to OpenFoodFacts search
}

export interface GeminiQuickAnalysis {
  name: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSizeGrams: number;
  servingDescription: string;
}

/**
 * Identify food from a base64 image string (Specific mode - with OFF search)
 */
export const identifyFood = async (base64Image: string): Promise<{ success: boolean; analysis?: GeminiFoodAnalysis; error?: string }> => {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.' };
  }

  try {
    // Remove data:image/jpeg;base64, prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
Identify the food or drink/beverage in this image.
This can include meals, snacks, drinks, beverages, energy drinks, sodas, coffee, tea, protein shakes, smoothies, etc.
Return ONLY a JSON object with the following structure:
{
  "name": "Specific name of the food or drink",
  "confidence": 0.95,
  "estimatedMacros": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number,
    "servingSizeGrams": number (estimated weight/volume in grams or ml)
  },
  "searchQuery": "Simple name to search in a database (e.g., 'apple', 'chicken breast', 'red bull', 'coca cola', 'protein shake')"
}
If there are multiple items, analyze the main one.
For drinks, estimate based on typical can/bottle sizes (e.g., 250ml can, 500ml bottle).
For food, estimate based on typical portion sizes.
DO NOT INCLUDE ANY MARKDOWN OR ADDITIONAL TEXT. JUST THE JSON.
`;


    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `Gemini API error: ${response.status} ${errorData.error?.message || ''}`
      };
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return { success: false, error: 'No response from Gemini' };
    }

    try {
      const analysis = JSON.parse(textResponse) as GeminiFoodAnalysis;
      return { success: true, analysis };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textResponse);
      return { success: false, error: 'Failed to parse AI response' };
    }

  } catch (error) {
    console.error('Gemini identification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown AI error'
    };
  }
};

/**
 * Quick food analysis from a base64 image string (Normal mode - direct AI estimation)
 * This is faster as it skips the OpenFoodFacts database search
 */
export const quickAnalyzeFood = async (base64Image: string): Promise<{ success: boolean; analysis?: GeminiQuickAnalysis; error?: string }> => {
  if (!GEMINI_API_KEY) {
    return { success: false, error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.' };
  }

  try {
    // Remove data:image/jpeg;base64, prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
Analyze this food or drink image and provide nutritional estimates.
Identify what food/drink is shown and estimate its macros based on typical portion sizes.

Return ONLY a JSON object with the following structure:
{
  "name": "Specific name of the food or drink",
  "confidence": 0.95,
  "calories": number (total calories for the portion shown),
  "protein": number (grams of protein),
  "carbs": number (grams of carbohydrates),
  "fats": number (grams of fat),
  "servingSizeGrams": number (estimated weight in grams or ml for drinks),
  "servingDescription": "Description of the portion (e.g., '1 medium apple', '250ml can', '1 bowl (~300g)')"
}

Guidelines:
- For drinks: Estimate based on typical container sizes (can = 250-330ml, bottle = 500ml)
- For food: Estimate based on what's visible (small/medium/large portion)
- Be realistic with portion sizes
- Provide the TOTAL macros for the estimated portion, not per 100g
- Confidence should be 0.0 to 1.0 based on how clear the image is

DO NOT INCLUDE ANY MARKDOWN OR ADDITIONAL TEXT. JUST THE JSON.
`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `Gemini API error: ${response.status} ${errorData.error?.message || ''}`
      };
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return { success: false, error: 'No response from Gemini' };
    }

    try {
      const analysis = JSON.parse(textResponse) as GeminiQuickAnalysis;
      return { success: true, analysis };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textResponse);
      return { success: false, error: 'Failed to parse AI response' };
    }

  } catch (error) {
    console.error('Gemini quick analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown AI error'
    };
  }
};
