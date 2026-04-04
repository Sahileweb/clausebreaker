import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Share2, AlertCircle, CheckCircle2, AlertTriangle, FileText, LayoutDashboard } from "lucide-react";
import { motion } from "motion/react";
import ClauseCard from "../components/ClauseCard";
import RiskBadge from "../components/RiskBadge";
import { cn } from "@/src/lib/utils";
import ChatSection from "../components/ChatSection"; 
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
        headers: { "Content-Type": "application/json" },
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

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Summary Section */}
          <div className="lg:col-span-1">
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
            </div>
          </div>

          {/* Clauses List */}
          <div className="lg:col-span-2">
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
          <ChatSection documentText={rawDocumentText} />
        </div>
      </div>
    </div>
  );
}
