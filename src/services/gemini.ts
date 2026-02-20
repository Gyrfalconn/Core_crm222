import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getLeadInsights(contactName: string, company: string, status: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a brief, professional AI insight for an Indian CRM lead named ${contactName} at ${company}. Current status is ${status}. Consider the Indian business context and cultural nuances. Suggest a next best action. Keep it under 60 words.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate insights at this time.";
  }
}

export async function generateEmailDraft(contactName: string, dealTitle: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a short, professional follow-up email for ${contactName} regarding the deal "${dealTitle}". Use a tone appropriate for Indian business communication. Focus on moving to the next stage.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating email draft.";
  }
}
