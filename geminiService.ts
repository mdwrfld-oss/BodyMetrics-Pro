
import { GoogleGenAI, Type } from "@google/genai";
import { AppState } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeProgress(state: AppState) {
  try {
    const prompt = `Analyze these body measurement trends and goals. Provide a concise, high-tech, motivational insight (max 3 sentences). 
    Data: ${JSON.stringify(state.entries.slice(-5))}
    Goals: ${JSON.stringify(state.goals)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a high-performance fitness analyst. Your tone is professional, futuristic, and encouraging. Use tech-inspired metaphors.",
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analyzing biometric data flow... System optimal. Keep pushing your physical limits.";
  }
}
