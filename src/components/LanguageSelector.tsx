import { Globe } from "lucide-react";
import { cn } from "@/src/lib/utils";

export const LANGUAGES = [
  { name: "English", code: "English" },
  { name: "Hindi", code: "Hindi" },
  { name: "Marathi", code: "Marathi" },
  { name: "Tamil", code: "Tamil" },
  { name: "Telugu", code: "Telugu" },
  { name: "Bengali", code: "Bengali" },
  { name: "Gujarati", code: "Gujarati" },
  { name: "Kannada", code: "Kannada" },
  { name: "Malayalam", code: "Malayalam" },
  { name: "Punjabi", code: "Punjabi" },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
}

export default function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  className,
}: LanguageSelectorProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Globe className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Target Language
        </span>
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="mt-0.5 block w-full rounded-lg border-0 bg-transparent p-0 text-sm font-medium text-gray-900 focus:ring-0"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
