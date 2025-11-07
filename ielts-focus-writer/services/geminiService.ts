import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeminiFeedback } from '../types';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
}

// Create a new GoogleGenAI instance
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-if-missing' });

export const fetchIELTSPrompt = async (): Promise<string> => {
  if (!apiKey) {
      // Mock prompt if no API key provided during development environment setup
      return "Some people argue that technological inventions, such as mobile phones, are making people socially less interactive. Others claim that technology brings people closer together. Discuss both views and give your own opinion.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Generate a single, realistic IELTS Writing Task 2 prompt. Return only the prompt text itself, no extra introductions.',
    });
    return response.text.trim();
  } catch (error) {
    console.error("Failed to fetch prompt:", error);
    return "Some believe that governments should spend money on building train and subway lines to reduce traffic congestion. Others think that building more and wider roads is a better solution. Discuss both views and give your opinion.";
  }
};

const feedbackSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        bandScore: { type: Type.STRING, description: "Estimated IELTS Band Score range (e.g., 6.5-7.0)" },
        strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3 key strengths in the essay"
        },
        weaknesses: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3 key weaknesses in the essay"
        },
        improvedVersion: {
            type: Type.STRING,
            description: "A rewritten, improved version of one of the paragraphs that needs the most work."
        },
        suggestedOutline: {
            type: Type.STRING,
            description: "A concise, ideal outline plan for this specific prompt."
        }
    },
    required: ["bandScore", "strengths", "weaknesses", "improvedVersion", "suggestedOutline"],
};


export const getEssayFeedback = async (prompt: string, essay: string): Promise<GeminiFeedback> => {
    if (!apiKey) throw new Error("Missing API Key");
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as an experienced IELTS examiner. Analyze the following Task 2 essay based on the prompt: "${prompt}". Provide feedback using the specified JSON structure, including a suggested outline plan. Essay: ${essay}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: feedbackSchema
            }
        });
        
        const jsonText = response.text;
        return JSON.parse(jsonText) as GeminiFeedback;
    } catch (error) {
        console.error("Feedback generation failed:", error);
        throw error;
    }
};
