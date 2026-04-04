import React, { useState, useRef } from "react";
import { Upload, FileText, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Zap, FileCode, ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import { cn } from "@/src/lib/utils";

export default function Home() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("English");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setText("");
    }
  };

  const handleAnalyze = async () => {
    if (!text && !file) return;

    setIsLoading(true);
    let contentToAnalyze = text;

    try {
      // 1. If file is uploaded, parse it first
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const parseResponse = await fetch("/api/parse-document", {
          method: "POST",
          body: formData,
        });

        if (!parseResponse.ok) {
          throw new Error("Failed to parse document");
        }

        const parseData = await parseResponse.json();
        contentToAnalyze = parseData.text;
      }


      // 2. Send the content to the backend for analysis
      const analyzeResponse = await fetch("http://localhost:3000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: contentToAnalyze, language }),
      });

      if (!analyzeResponse.ok) {
        throw new Error("Failed to analyze document with AI");
      }

      const result = await analyzeResponse.json();

      // Store results in session storage for the analysis page
      sessionStorage.setItem("analysisResult", JSON.stringify(result));
      navigate("/analysis");
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(error instanceof Error ? error.message : "Failed to analyze document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Break the <span className="text-indigo-600">Complex</span> Clauses
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Instantly simplify legal documents into plain English. Understand risks, get actionable advice, and make informed decisions with AI.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700">Secure & Confidential</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Instant AI Analysis</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100">
              <CheckCircle2 className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Multi-language Support</span>
            </div>
          </motion.div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col gap-6"
          >
            <div className="rounded-3xl bg-white p-8 shadow-xl shadow-indigo-100/50 border border-indigo-50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Input Legal Text</h2>
                <LanguageSelector
                  selectedLanguage={language}
                  onLanguageChange={setLanguage}
                />
              </div>

              <div className="space-y-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all",
                    file
                      ? "border-indigo-500 bg-indigo-50/50"
                      : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-white"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,image/*"
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex flex-col items-center text-center">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg",
                        file.type.includes("pdf") ? "bg-rose-600" :
                          file.type.includes("word") ? "bg-blue-600" :
                            file.type.startsWith("image/") ? "bg-emerald-600" : "bg-indigo-600"
                      )}>
                        {file.type.includes("pdf") && <FileText className="h-6 w-6" />}
                        {file.type.includes("word") && <FileCode className="h-6 w-6" />}
                        {file.type.startsWith("image/") && <ImageIcon className="h-6 w-6" />}
                        {(!file.type.includes("pdf") && !file.type.includes("word") && !file.type.startsWith("image/")) && <FileText className="h-6 w-6" />}
                      </div>
                      <p className="mt-4 text-sm font-semibold text-gray-900">{file.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="mt-4 text-xs font-bold text-rose-500 hover:underline"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-gray-500">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-gray-900">Upload Document</p>
                      <p className="mt-1 text-xs text-gray-500">PDF, DOCX, or Images</p>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500">OR PASTE TEXT</span>
                  </div>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); setFile(null); }}
                  placeholder="Paste your legal clauses or entire document here..."
                  className="h-48 w-full resize-none rounded-2xl border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                />

                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || (!text && !file)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Analyzing Document...
                    </>
                  ) : (
                    <>
                      Analyze Now
                      <ArrowRight className="h-6 w-6" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col justify-center gap-8"
          >
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg text-indigo-600 border border-indigo-50">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Simplify Legal Jargon</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    Our AI converts complex legalese into plain, everyday language that anyone can understand.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg text-rose-600 border border-rose-50">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Risk Identification</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    Automatically flag risky clauses, hidden liabilities, and unfair terms before you sign.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg text-emerald-600 border border-emerald-50">
                  <Zap className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Actionable Advice</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    Get clear suggestions on what steps to take for each clause to protect your interests.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl bg-indigo-900 p-8 text-white shadow-2xl">
              <p className="text-lg font-medium italic opacity-90">
                "Legal documents shouldn't be a barrier to justice. ClauseBreaker AI empowers everyone to understand what they are signing."
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-700 border-2 border-indigo-500" />
                <div>
                  <p className="font-bold">Sahil Mundhe</p>
                  <p className="text-sm opacity-70">Founder, ClauseBreaker AI</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
