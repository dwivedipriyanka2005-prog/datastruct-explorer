import { CODE, LANGUAGES, type Language } from "@/lib/codeSnippets";
import { ALGO_META, type AlgoKey } from "@/lib/algorithms";

type Props = {
  algo: AlgoKey;
  language: Language;
  onLanguageChange: (l: Language) => void;
  activeLine: number | null;
};

export function CodeViewer({ algo, language, onLanguageChange, activeLine }: Props) {
  const lines = CODE[algo][language];
  const ext = LANGUAGES.find((l) => l.key === language)?.ext ?? "txt";

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <div className="flex items-center gap-1" role="tablist" aria-label="Code language">
          {LANGUAGES.map((l) => (
            <button
              key={l.key}
              role="tab"
              aria-selected={l.key === language}
              onClick={() => onLanguageChange(l.key)}
              className={`h-8 rounded-t-lg px-3 font-mono text-[11px] transition-colors ${
                l.key === language ? "bg-secondary text-frost" : "text-mist hover:text-frost"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <span className="pr-2 font-mono text-[10px] text-mist">
          {algo}.{ext}
        </span>
      </div>

      <pre className="overflow-x-auto p-3 pt-2 font-mono text-[11px] leading-relaxed">
        {lines.map((line, idx) => {
          const lineNo = idx + 1;
          const active = activeLine === lineNo;
          return (
            <div
              key={lineNo}
              className={`flex gap-3 rounded-md px-2 py-0.5 ${
                active ? "bg-primary/15 text-frost ring-1 ring-primary/40" : "text-mist"
              }`}
            >
              <span className="w-4 shrink-0 select-none text-right opacity-60">{lineNo}</span>
              <code className="whitespace-pre">{line || " "}</code>
            </div>
          );
        })}
      </pre>

      <div className="border-t border-border px-4 py-2 font-mono text-[10px] text-mist">
        {ALGO_META[algo].label} · time {ALGO_META[algo].time} · space {ALGO_META[algo].space}
      </div>
    </div>
  );
}
