
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

/**
 * Identify food from a base64 image string
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
