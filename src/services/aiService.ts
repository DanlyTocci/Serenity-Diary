import { GoogleGenAI } from "@google/genai";
import { DailyInspiration } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getDailyInspiration(): Promise<DailyInspiration> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Genera una citazione motivazionale breve e un profondo spunto di riflessione per un diario delle emozioni. Rispondi in formato JSON con i campi: quote, author, reflectionPrompt. Lingua: Italiano.",
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as DailyInspiration;
    }
  } catch (error) {
    console.error("Error fetching inspiration:", error);
  }

  // Fallback
  return {
    quote: "La felicità non è qualcosa di già pronto. Viene dalle tue azioni.",
    author: "Dalai Lama",
    reflectionPrompt: "Cosa ti ha fatto sorridere oggi, anche solo per un momento?",
  };
}
