
import { GoogleGenAI, Type } from "@google/genai";
import { CategoryType, Problem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateProblems(category: CategoryType, count: number = 5, excludeIds: string[] = []): Promise<Problem[]> {
  const prompt = `Generate ${count} unique mental math problems for 2nd to 4th graders in the category: ${category}.
  
  Guidelines for the mix:
  - 50% of problems should be "Free Text" (where the child types the answer). For these, leave 'options' as an empty array [].
  - 50% of problems should be "Multiple Choice". For these, provide exactly 4 distinct strings in 'options', including the correct answer.
  
  Category specifics:
  - ADDITION: Focus on rounding/splitting strategies.
  - SUBTRACTION: Focus on "counting up" or multi-step breakdown.
  - MULT_BREAKDOWN: 2-digit by 1-digit (e.g., 14 x 7).
  - MULT_NEAR: Numbers near 10, 20, 50, 100 (e.g., 19 x 4).
  - DIVISION: Simple division facts, sometimes with remainders.
  - FRACTIONS: Half, Quarter, Three Quarters of whole numbers.
  - ESTIMATION: Approximate answers (always Multiple Choice for this category).
  
  IMPORTANT: 
  - Do not generate problems with these IDs: ${excludeIds.join(', ')}.
  - Ensure the 'trick' is a short, kid-friendly mental math strategy.
  - 'answer' must be a single number or a very simple string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Exactly 4 options for MC, or empty array for free-text."
              },
              trick: { type: Type.STRING },
              explanation: { type: Type.STRING },
              category: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["id", "question", "answer", "trick", "explanation", "category", "difficulty", "options"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as Problem[];
  } catch (error) {
    console.error("Error generating problems:", error);
    return [];
  }
}

// Local Buddy Logic for Instant Response
const CHEERS = [
  "You're a math wizard! ✨",
  "Boom! Perfect answer! 🚀",
  "Your brain is growing so fast! 🧠💨",
  "High five! That was clever! ✋",
  "Pixel is impressed! Great job! 🤖",
  "You're unstoppable! 🌟"
];

const ENCOURAGEMENTS = [
  "Nice try! Check out this trick... 💡",
  "So close! Pixel has a hint for you! 🤖",
  "Don't give up! Look at the brain trick! ✨",
  "Math is all about practice! Try again! 🔄"
];

export function getLocalBuddyResponse(isCorrect: boolean): string {
  const list = isCorrect ? CHEERS : ENCOURAGEMENTS;
  return list[Math.floor(Math.random() * list.length)];
}
