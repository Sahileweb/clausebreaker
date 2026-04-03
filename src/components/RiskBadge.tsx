import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface RiskBadgeProps {
  risk: "low" | "medium" | "high";
  className?: string;
}

export default function RiskBadge({ risk, className }: RiskBadgeProps) {
  const config = {
    low: {
      label: "Safe",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    medium: {
      label: "Moderate",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertTriangle,
    },
    high: {
      label: "Risky",
      color: "bg-rose-50 text-rose-700 border-rose-200",
      icon: AlertCircle,
    },
  };

  const { label, color, icon: Icon } = config[risk] || config.medium;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
        color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}
