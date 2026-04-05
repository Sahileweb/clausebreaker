import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Share2, AlertCircle, CheckCircle2, AlertTriangle, FileText, LayoutDashboard, Phone, Mail, Scale } from "lucide-react";
import { motion } from "motion/react";
import ClauseCard from "../components/ClauseCard";
import RiskBadge from "../components/RiskBadge";
import LanguageSelector from "../components/LanguageSelector";
import { cn } from "@/src/lib/utils";
import ChatSection from "../components/ChatSection"; 
import { useAuth } from "../context/AuthContext";
interface Clause {
  text: string;
  simplified: string;
  risk: "low" | "medium" | "high";
  explanation: string;
  suggestion: string;
}

interface AnalysisResult {
  summary: string;
  overallRisk: "low" | "medium" | "high";
  clauses: Clause[];
}

export default function Analysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [language, setLanguage] = useState("English");
  const [isTranslating, setIsTranslating] = useState(false);
  const { token } = useAuth();
  const rawDocumentText = sessionStorage.getItem("documentText") || "";
  const navigate = useNavigate();

  useEffect(() => {
    const storedResult = sessionStorage.getItem("analysisResult");
    if (storedResult) {
      setResult(JSON.parse(storedResult));
    } else {
      navigate("/");
    }
  }, [navigate]);

  if (!result) return null;

  const riskCounts = {
    low: result.clauses.filter(c => c.risk === "low").length,
    medium: result.clauses.filter(c => c.risk === "medium").length,
    high: result.clauses.filter(c => c.risk === "high").length,
  };

  const handleDownload = () => {
    const content = `
      ClauseBreaker AI - Legal Document Analysis
      -----------------------------------------
      Summary:
      ${result.summary}
      
      Overall Risk: ${result.overallRisk.toUpperCase()}
      
      Clauses:
      ${result.clauses.map((c, i) => `
      Clause ${i + 1} (${c.risk.toUpperCase()} RISK):
      Original: ${c.text}
      Simplified: ${c.simplified}
      ELI15: ${c.explanation}
      Actionable Advice: ${c.suggestion}
      `).join("\n")}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "legal_analysis.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!result) return;
    setIsSharing(true);
    setShareLink(null);


    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) throw new Error("Failed to generate share link");

      const { link } = await response.json();
      setShareLink(link);

      // Copy to clipboard
      await navigator.clipboard.writeText(link);
    } catch (error) {
      console.error('Error sharing:', error);
      alert("Failed to create shareable link. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    if (newLang === language) return;
    setIsTranslating(true);
    setLanguage(newLang);

    try {
      const storedOriginal = sessionStorage.getItem("analysisResult");
      if (!storedOriginal) return;
      
      const original: AnalysisResult = JSON.parse(storedOriginal);
      
      // If switching back to English, just restore original
      if (newLang === "English") {
        setResult(original);
        return;
      }

      const translateText = async (text: string) => {
        if (!text || text === "N/A") return text;
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, targetLang: newLang }),
        });
        const data = await response.json();
        return data.translated || text;
      };

      // Translate summary
      const translatedSummary = await translateText(original.summary);

      // Translate all clauses
      const translatedClauses = await Promise.all(
        original.clauses.map(async (clause) => ({
          ...clause,
          simplified: await translateText(clause.simplified),
          explanation: await translateText(clause.explanation),
          suggestion: await translateText(clause.suggestion),
        }))
      );

      setResult({
        ...original,
        summary: translatedSummary,
        clauses: translatedClauses,
      });
    } catch (error) {
      console.error("Translation failed:", error);
      alert("Failed to translate document. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-50 hover:text-indigo-600 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analysis Dashboard</h1>
              <p className="text-sm text-gray-500">Comprehensive breakdown of your legal document</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <LanguageSelector 
              selectedLanguage={language} 
              onLanguageChange={handleLanguageChange} 
              className={cn(isTranslating && "opacity-50 pointer-events-none")}
            />
            <div className="h-8 w-px bg-gray-200 hidden md:block" />
            <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 transition-all"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isSharing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Link...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>

        {isTranslating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-indigo-50 p-4 border border-indigo-100 text-indigo-700 font-medium"
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Translating results to {language}... This may take a moment.
          </motion.div>
        )}

        {shareLink && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-between rounded-2xl bg-emerald-50 p-4 border border-emerald-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">Share Link Generated & Copied!</p>
                <p className="text-xs text-emerald-700 font-medium truncate max-w-md">{shareLink}</p>
              </div>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(shareLink)}
              className="text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Copy Again
            </button>
          </motion.div>
        )}

        {/* Overview Stats */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Overall Risk</span>
              <RiskBadge risk={result.overallRisk} />
            </div>
            <p className="mt-4 text-3xl font-extrabold text-gray-900">
              {result.overallRisk.toUpperCase()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
          >
            <span className="text-sm font-bold uppercase tracking-wider text-gray-400">High Risk Clauses</span>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{riskCounts.high}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
          >
            <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Moderate Risk</span>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{riskCounts.medium}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
          >
            <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Safe Clauses</span>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{riskCounts.low}</p>
            </div>
          </motion.div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Sidebar: Summary & Stats */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-3xl bg-indigo-900 p-8 text-white shadow-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-indigo-100">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold">Quick Summary</h2>
                </div>
                <div className="prose prose-invert prose-sm">
                  <p className="text-indigo-50/90 leading-relaxed whitespace-pre-line">
                    {result.summary}
                  </p>
                </div>
              </motion.div>

              <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Distribution</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1.5">
                      <span className="text-gray-500">High Risk</span>
                      <span className="text-rose-600">{Math.round((riskCounts.high / result.clauses.length) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${(riskCounts.high / result.clauses.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1.5">
                      <span className="text-gray-500">Moderate Risk</span>
                      <span className="text-amber-600">{Math.round((riskCounts.medium / result.clauses.length) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${(riskCounts.medium / result.clauses.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1.5">
                      <span className="text-gray-500">Safe</span>
                      <span className="text-emerald-600">{Math.round((riskCounts.low / result.clauses.length) * 100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(riskCounts.low / result.clauses.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Assistance Section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-lg shadow-indigo-200"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Scale className="h-6 w-6 text-indigo-100" />
                  </div>
                  <h3 className="font-bold">Legal Assistance</h3>
                </div>
                <p className="text-xs text-indigo-100/80 mb-6 leading-relaxed">
                  Have doubts? Consult with our partner legal experts for a professional review of this document.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">+1 (800) LEGAL-AI</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">consult@clausebreaker.ai</span>
                  </div>
                </div>
                <button className="w-full rounded-xl bg-white py-3 text-sm font-bold text-indigo-600 shadow-sm transition-all hover:bg-indigo-50 active:scale-[0.98]">
                  Book Consultations
                </button>
              </motion.div>

              {/* Disclaimer */}
              <div className="px-4 py-2">
                <p className="text-[10px] leading-relaxed text-gray-400 text-center italic">
                  Disclaimer: AI-generated summaries are for informational purposes only and do not constitute legal advice.
                </p>
              </div>
            </div>
          </div>

          {/* Center Column: Clauses List */}
          <div className="lg:col-span-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm border border-gray-100">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Clause Breakdown</h2>
              </div>
              <span className="text-sm font-medium text-gray-500">
                {result.clauses.length} Clauses Identified
              </span>
            </div>

            <div className="space-y-6">
              {result.clauses.map((clause, index) => (
                // @ts-ignore
                <ClauseCard key={index} clause={clause} index={index} />
              ))}
            </div>
          </div>

          {/* Right Sidebar: Chat Section */}
          <div className="lg:col-span-3">
            <div className="sticky top-24">
              <ChatSection documentText={rawDocumentText} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
