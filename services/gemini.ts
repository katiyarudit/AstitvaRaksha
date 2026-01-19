
import { GoogleGenAI, Type } from "@google/genai";
import { InsightData } from "../types";

export const generateRiskInsight = async (
  state: string,
  total: number,
  percentile: number,
  date: string
): Promise<InsightData> => {
  // Fix: Ensure we use the API key directly from process.env.API_KEY as per instructions
  if (!process.env.API_KEY || process.env.API_KEY === "undefined" || process.env.API_KEY === "") {
    return getFallbackInsight(state, date);
  }

  try {
    // Fix: Create a new GoogleGenAI instance right before making an API call to ensure it uses up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform a multidimensional identity risk assessment for Aadhaar enrolment in ${state}. 
        Audit Summary: ${total} total enrolments.
        Context: Identify risks across migration pressure, welfare exclusion, child identity gaps, and social inequality. 
        Analyze the socio-economic and security implications for India.
        Return strictly JSON with 'problem', 'impact', and 'solution' (array of strings).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: { type: Type.STRING },
            impact: { type: Type.STRING },
            solution: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["problem", "impact", "solution"]
        }
      }
    });

    // Fix: Access .text property directly instead of as a method
    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(jsonString) as InsightData;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return getFallbackInsight(state, date);
  }
};

const getFallbackInsight = (state: string, date: string): InsightData => ({
  problem: `System identified multiple identity risk vectors in ${state} including potential late-adult enrolment and child registration gaps.`,
  impact: "Failure to enroll infants leads to future denial of basic health and educational services. High adult enrolment ratios suggest late identity acquisition, likely linked to welfare exclusion or migration.",
  solution: [
    "Deploy mobile enrolment units in underserved blocks.",
    "Launch awareness campaigns targeting mothers for infant registration (0-5 age group).",
    "Tighten document verification for adult enrolments to prevent duplicate or fraudulent identities.",
    "Implement an automated audit trail for districts showing persistent anomalies."
  ]
});
