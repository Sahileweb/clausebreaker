import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Lightbulb, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import RiskBadge from "./RiskBadge";
import { cn } from "@/src/lib/utils";

interface Clause {
  text: string;
  simplified: string;
  risk: "low" | "medium" | "high";
  explanation: string;
  suggestion: string;
}

interface ClauseCardProps {
  clause: Clause;
  index: number;
}

export default function ClauseCard({ clause, index }: ClauseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"simplified" | "eli15" | "action">("simplified");

  const riskColors = {
    low: "border-emerald-200 bg-emerald-50/30",
    medium: "border-amber-200 bg-amber-50/30",
    high: "border-rose-200 bg-rose-50/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "group overflow-hidden rounded-2xl border transition-all hover:shadow-xl",
        riskColors[clause.risk] || "border-gray-200 bg-white"
      )}
    >
      <div className="flex flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Clause {index + 1}
            </span>
            <RiskBadge risk={clause.risk} />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-gray-500 transition-colors hover:bg-white hover:text-indigo-600"
          >
            {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Original Text</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600 group-hover:line-clamp-none">
            {clause.text}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("simplified")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === "simplified"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white/50 text-gray-600 hover:bg-white"
            )}
          >
            <Info className="h-4 w-4" />
            Simplified
          </button>
          <button
            onClick={() => setActiveTab("eli15")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === "eli15"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white/50 text-gray-600 hover:bg-white"
            )}
          >
            <HelpCircle className="h-4 w-4" />
            Explain Like I'm 15
          </button>
          <button
            onClick={() => setActiveTab("action")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === "action"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white/50 text-gray-600 hover:bg-white"
            )}
          >
            <Lightbulb className="h-4 w-4" />
            What Should I Do?
          </button>
        </div>

        <div className="mt-6 min-h-[100px] rounded-xl bg-white/80 p-5 shadow-inner">
          <AnimatePresence mode="wait">
            {activeTab === "simplified" && (
              <motion.div
                key="simplified"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-2"
              >
                <p className="text-base font-medium leading-relaxed text-gray-900">
                  {clause.simplified}
                </p>
              </motion.div>
            )}
            {activeTab === "eli15" && (
              <motion.div
                key="eli15"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-2"
              >
                <p className="text-base font-medium leading-relaxed text-indigo-700">
                  {clause.explanation}
                </p>
              </motion.div>
            )}
            {activeTab === "action" && (
              <motion.div
                key="action"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-2"
              >
                <p className="text-base font-medium leading-relaxed text-emerald-700">
                  {clause.suggestion}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
