import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

//  MULTIPLE API KEY ROTATION
const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const apiKeys = keysString.split(",").map(key => key.trim()).filter(key => key.length > 0);

if (apiKeys.length === 0) {
  console.error("CRITICAL ERROR: No Gemini API keys found in .env file.");
}

const aiClients = apiKeys.map(key => new GoogleGenAI({ apiKey: key }));
let currentClientIndex = 0;

function getNextAiClient() {
  if (aiClients.length === 0) {
    throw new Error("Cannot process request: No API keys configured.");
  }
  const client = aiClients[currentClientIndex];
  console.log(`[API Rotation] Routing request through Key #${currentClientIndex + 1} of ${aiClients.length}`);
  currentClientIndex = (currentClientIndex + 1) % aiClients.length;
  return client;
}

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

// JSON CLEANING UTILITY
function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\n/, "");
  else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\n/, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\n```$/, "");
  return cleaned.trim();
}

export async function analyzeLegalDocument(text: string, language: string = "English"): Promise<AnalysisResult> {
  const model = "gemini-2.5-flash"; 
  
  const prompt = `
    SYSTEM INSTRUCTIONS:
    You are an expert, highly strict legal AI assistant. Your ONLY job is to analyze the provided text.
    
    CRITICAL RULES:
    1. ZERO HALLUCINATION: You must ONLY use the provided document text. Do not invent, assume, or add outside legal clauses.
    2. CORRUPTED/NON-LEGAL TEXT: Evaluate the text first. If the text is corrupted, gibberish, a recipe, a random story, or clearly NOT a legal/contractual document, you MUST output a JSON response where:
       - "summary" is EXACTLY: "ERROR: The provided text does not appear to be a valid legal document or is too corrupted to read."
       - "overallRisk" is "high"
       - "clauses" is an empty array []
    
    TASK:
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

  try {
    const currentAi = getNextAiClient();
    const response = await currentAi.models.generateContent({
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

    const cleanedText = cleanJsonResponse(response.text);
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "System Error: The AI generated a response, but it could not be formatted correctly, or the document was unreadable. Please try again.",
      overallRisk: "high",
      clauses: [
        {
          text: "N/A",
          simplified: "The system encountered an error processing this document.",
          risk: "high",
          explanation: "This usually happens if the document is too large, the text is corrupted, or the AI service timed out.",
          suggestion: "Try uploading a clearer PDF or pasting smaller sections of text."
        }
      ]
    };
  }
}

export async function compareLegalDocuments(text1: string, text2: string, language: string = "English"): Promise<ComparisonResult> {
  const model = "gemini-2.5-flash";
  
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

  try {
    const currentAi = getNextAiClient();
    const response = await currentAi.models.generateContent({
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

    const cleanedText = cleanJsonResponse(response.text);
    return JSON.parse(cleanedText);

  } catch (error) {
    console.error("Gemini Comparison Error:", error);
    return {
      differences: [
        {
          topic: "Processing Error",
          doc1Value: "N/A",
          doc2Value: "N/A",
          impact: "The documents could not be compared due to a system or formatting error."
        }
      ],
      recommendation: "Please try comparing the documents again or check if the text is corrupted."
    };
  }
}


//  READ TEXT FROM IMAGES

export async function extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
  const model = "gemini-2.5-flash";
  const currentAi = getNextAiClient(); // Use rotation for this too!

  const response = await currentAi.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          { text: "Extract all text from this document accurately. Do not add any commentary, just provide the text found in the image." },
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType,
            },
          },
        ],
      },
    ],
  });
  
  if (!response.text) {
    throw new Error("Failed to extract text from image");
  }
  return response.text;
}