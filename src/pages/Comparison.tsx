import { useState, useRef } from "react";
import { Upload, FileText, ArrowRight, Loader2, GitCompare, AlertCircle, CheckCircle2, ArrowLeft, FileCode, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";

interface Difference {
  topic: string;
  doc1Value: string;
  doc2Value: string;
  impact: string;
}

interface ComparisonResult {
  differences: Difference[];
  recommendation: string;
}

export default function Comparison() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const file1InputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleCompare = async () => {
    if ((!text1 && !file1) || (!text2 && !file2)) return;

    setIsLoading(true);
    let content1 = text1;
    let content2 = text2;

    try {
      // 1. Parse PDF 1 if uploaded
      if (file1) {
        const formData = new FormData();
        formData.append("file", file1);
        const parseResponse = await fetch("/api/parse-document", {
          method: "POST",
          body: formData,
        });
        if (!parseResponse.ok) throw new Error("Failed to parse Document 1");
        const parseData = await parseResponse.json();
        content1 = parseData.text;
      }

      // 2. Parse File 2 if uploaded
      if (file2) {
        const formData = new FormData();
        formData.append("file", file2);
        const parseResponse = await fetch("/api/parse-document", {
          method: "POST",
          body: formData,
        });
        if (!parseResponse.ok) throw new Error("Failed to parse Document 2");
        const parseData = await parseResponse.json();
        content2 = parseData.text;
      }

      
      const compareResponse = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text1: content1, 
          text2: content2, 
          language: "English" 
        }),
      });

      if (!compareResponse.ok) {
        throw new Error("Comparison request failed on the server.");
      }

      const comparisonData = await compareResponse.json();
      setResult(comparisonData);
    } catch (error) {
      console.error("Comparison failed:", error);
      alert(error instanceof Error ? error.message : "Failed to compare documents. Please try again.");
    } finally {
      setIsLoading(false);
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
              <h1 className="text-2xl font-bold text-gray-900">Document Comparison</h1>
              <p className="text-sm text-gray-500">Compare two legal documents and highlight key differences</p>
            </div>
          </div>
        </div>

        {!result ? (
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Document 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl bg-white p-8 shadow-xl shadow-indigo-100/50 border border-indigo-50"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Document 1 (Original)</h2>
              <div className="space-y-6">
                <div
                  onClick={() => file1InputRef.current?.click()}
                  className={cn(
                    "relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all",
                    file1 ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-white"
                  )}
                >
                  <input type="file" ref={file1InputRef} onChange={(e) => e.target.files?.[0] && setFile1(e.target.files[0])} accept=".pdf,.docx,image/*" className="hidden" />
                  {file1 ? (
                    <div className="flex flex-col items-center text-center">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-white mb-2",
                        file1.type.includes("pdf") ? "bg-rose-500" :
                          file1.type.includes("word") ? "bg-blue-500" :
                            file1.type.startsWith("image/") ? "bg-emerald-500" : "bg-indigo-500"
                      )}>
                        {file1.type.includes("pdf") && <FileText className="h-5 w-5" />}
                        {file1.type.includes("word") && <FileCode className="h-5 w-5" />}
                        {file1.type.startsWith("image/") && <ImageIcon className="h-5 w-5" />}
                        {(!file1.type.includes("pdf") && !file1.type.includes("word") && !file1.type.startsWith("image/")) && <FileText className="h-5 w-5" />}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-900 px-4 truncate max-w-full">{file1.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm font-semibold text-gray-900">Upload Doc (PDF/DOCX/IMG)</p>
                    </div>
                  )}
                </div>
                <textarea
                  value={text1}
                  onChange={(e) => { setText1(e.target.value); setFile1(null); }}
                  placeholder="Or paste text here..."
                  className="h-40 w-full resize-none rounded-2xl border-gray-200 bg-gray-50 p-4 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                />
              </div>
            </motion.div>

            {/* Document 2 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl bg-white p-8 shadow-xl shadow-indigo-100/50 border border-indigo-50"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Document 2 (Revised)</h2>
              <div className="space-y-6">
                <div
                  onClick={() => file2InputRef.current?.click()}
                  className={cn(
                    "relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all",
                    file2 ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-white"
                  )}
                >
                  <input type="file" ref={file2InputRef} onChange={(e) => e.target.files?.[0] && setFile2(e.target.files[0])} accept=".pdf,.docx,image/*" className="hidden" />
                  {file2 ? (
                    <div className="flex flex-col items-center text-center">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-white mb-2",
                        file2.type.includes("pdf") ? "bg-rose-500" :
                          file2.type.includes("word") ? "bg-blue-500" :
                            file2.type.startsWith("image/") ? "bg-emerald-500" : "bg-indigo-500"
                      )}>
                        {file2.type.includes("pdf") && <FileText className="h-5 w-5" />}
                        {file2.type.includes("word") && <FileCode className="h-5 w-5" />}
                        {file2.type.startsWith("image/") && <ImageIcon className="h-5 w-5" />}
                        {(!file2.type.includes("pdf") && !file2.type.includes("word") && !file2.type.startsWith("image/")) && <FileText className="h-5 w-5" />}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-900 px-4 truncate max-w-full">{file2.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm font-semibold text-gray-900">Upload Doc (PDF/DOCX/IMG)</p>
                    </div>
                  )}
                </div>
                <textarea
                  value={text2}
                  onChange={(e) => { setText2(e.target.value); setFile2(null); }}
                  placeholder="Or paste text here..."
                  className="h-40 w-full resize-none rounded-2xl border-gray-200 bg-gray-50 p-4 text-sm focus:border-indigo-500 focus:bg-white focus:ring-indigo-500"
                />
              </div>
            </motion.div>

            <div className="lg:col-span-2 flex justify-center">
              <button
                onClick={handleCompare}
                disabled={isLoading || ((!text1 && !file1) || (!text2 && !file2))}
                className="flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Comparing Documents...
                  </>
                ) : (
                  <>
                    Compare Documents
                    <GitCompare className="h-6 w-6" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-8"
          >
            <div className="rounded-3xl bg-indigo-900 p-8 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <h2 className="text-xl font-bold">Expert Recommendation</h2>
              </div>
              <p className="text-lg text-indigo-50 leading-relaxed">{result.recommendation}</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {result.differences.map((diff, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100"
                >
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{diff.topic}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100">
                    <div className="bg-white p-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Document 1</span>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{diff.doc1Value}</p>
                    </div>
                    <div className="bg-white p-6">
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Document 2</span>
                      <p className="mt-2 text-sm text-gray-900 font-medium leading-relaxed">{diff.doc2Value}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50/50 px-6 py-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Impact Analysis</span>
                        <p className="mt-1 text-sm text-indigo-900 font-medium">{diff.impact}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setResult(null)}
                className="rounded-xl bg-white px-8 py-3 text-sm font-bold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50"
              >
                Compare Different Documents
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
