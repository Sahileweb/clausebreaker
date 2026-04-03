import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Clause {
  text: string;
  simplified: string;
  risk: "low" | "medium" | "high";
  explanation: string;
  suggestion: string;
}

export interface AnalysisResult {
  summary: string;
  overallRisk: "low" | "medium" | "high";
  clauses: Clause[];
}

export interface Difference {
  topic: string;
  doc1Value: string;
  doc2Value: string;
  impact: string;
}

export interface ComparisonResult {
  differences: Difference[];
  recommendation: string;
}

export async function analyzeLegalDocument(text: string, language: string = "English"): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze the following legal document text and provide a comprehensive breakdown.
    The output must be in ${language}.
    
    1. Provide a concise summary of the document.
    2. Determine the overall risk level (low, medium, or high).
    3. Identify key clauses and for each:
       - Extract the original text.
       - Provide a simplified version in plain English (or ${language}).
       - Assign a risk level (low, medium, or high).
       - Provide an "Explain Like I'm 15" (ELI15) explanation.
       - Provide actionable advice/suggestion for the user.

    Document Text:
    ${text}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          overallRisk: { type: Type.STRING, enum: ["low", "medium", "high"] },
          clauses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                simplified: { type: Type.STRING },
                risk: { type: Type.STRING, enum: ["low", "medium", "high"] },
                explanation: { type: Type.STRING },
                suggestion: { type: Type.STRING },
              },
              required: ["text", "simplified", "risk", "explanation", "suggestion"],
            },
          },
        },
        required: ["summary", "overallRisk", "clauses"],
      },
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text);
}

export async function compareLegalDocuments(text1: string, text2: string, language: string = "English"): Promise<ComparisonResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Compare the following two legal documents and highlight key differences.
    The output must be in ${language}.
    
    1. Identify key topics/clauses that have changed.
    2. For each difference:
       - Specify the topic.
       - Provide the value/text from Document 1.
       - Provide the value/text from Document 2.
       - Explain the impact of this change on the user.
    3. Provide an overall expert recommendation on which document is better or what to watch out for.

    Document 1:
    ${text1}

    Document 2:
    ${text2}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          differences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                doc1Value: { type: Type.STRING },
                doc2Value: { type: Type.STRING },
                impact: { type: Type.STRING },
              },
              required: ["topic", "doc1Value", "doc2Value", "impact"],
            },
          },
          recommendation: { type: Type.STRING },
        },
        required: ["differences", "recommendation"],
      },
    },
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text);
}
