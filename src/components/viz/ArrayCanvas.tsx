import type { HighlightKind } from "@/lib/algorithms";

const cellClass: Record<HighlightKind, string> = {
  compare: "cell-compare text-frost",
  swap: "cell-swap text-frost",
  sorted: "cell-sorted text-aurora",
  found: "cell-found text-found",
  active: "cell-compare text-frost",
  min: "cell-mid text-warn",
  key: "cell-swap text-aurora3",
  range: "text-frost",
  low: "cell-bound text-aurora",
  high: "cell-bound text-aurora",
  mid: "cell-mid text-warn",
};

type Props = {
  array: number[];
  highlights: Record<number, HighlightKind>;
  hasRange: boolean;
  caption: string;
};

export function ArrayCanvas({ array, highlights, hasRange, caption }: Props) {
  if (array.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-mist">Empty array</p>
        <p className="mt-2 text-sm text-mist">
          Create an array with manual values or random generation to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-tight">Array Canvas</p>
        <span className="font-mono text-[10px] text-mist">{caption}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Array elements">
        {array.map((value, i) => {
          const kind = highlights[i];
          const dim = hasRange && !kind;
          return (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1.5" role="listitem">
              <div
                title={`a[${i}] = ${value}`}
                className={`cell-base grid h-16 w-12 place-items-center rounded-xl bg-panel font-mono text-sm ring-1 ring-border ${
                  kind ? cellClass[kind] : "text-mist"
                } ${dim ? "cell-dim" : ""}`}
              >
                {value}
              </div>
              <span
                className={`font-mono text-[9px] ${kind ? "text-frost" : "text-mist"}`}
                aria-hidden="true"
              >
                {i}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {[
          ["bg-aurora2", "compared"],
          ["bg-aurora3", "swapped / shifted"],
          ["bg-warn", "mid / min"],
          ["bg-found", "found"],
          ["bg-aurora", "sorted"],
        ].map(([dot, label]) => (
          <span key={label} className="flex items-center gap-1 font-mono text-[9px] text-mist">
            <span className={`size-2 rounded-full ${dot}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
