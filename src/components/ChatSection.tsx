import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Loader2, User, Bot } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

interface Message {
  role: "user" | "model";
  text: string;
}

interface ChatSectionProps {
  documentText: string;
}

export default function ChatSection({ documentText }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 1. Prepare history for the Gemini service
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      // 2. Call the Gemini service directly from the frontend
      const { chatWithDocument } = await import("../services/geminiService");
      const answer = await chatWithDocument(input, documentText, history);
      
      const botMessage: Message = { role: "model", text: answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = { 
        role: "model", 
        text: "Sorry, I encountered an error. Please try again." 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-12 overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-8 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Chat with Document</h2>
      </div>

      <div className="flex h-[500px] flex-col">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">Ask any follow-up questions about this document.</p>
              <p className="text-xs mt-1">I'll only answer based on the provided text.</p>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "user" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-600"
                )}>
                  {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "user" 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-gray-100 text-gray-900 rounded-tl-none"
                )}>
                  {message.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500 italic">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 p-6">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a question about this document..."
              className="w-full rounded-2xl border-gray-200 bg-gray-50 py-3 pl-4 pr-12 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
