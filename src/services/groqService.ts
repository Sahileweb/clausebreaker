import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatWithGroq(
  messages: Message[],
  model: string = "llama-3.3-70b-versatile"
): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.5,
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq");
    }

    return content;
  } catch (error) {
    console.error("Groq API Error:", error);
    throw new Error("Failed to get response from Groq chatbot service.");
  }
}
