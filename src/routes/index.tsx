import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrayCanvas } from "@/components/viz/ArrayCanvas";
import { CodeViewer } from "@/components/viz/CodeViewer";
import type { Language } from "@/lib/codeSnippets";
import {
  ALGO_META,
  accessSteps,
  binarySearchSteps,
  bubbleSortSteps,
  deleteSteps,
  insertSteps,
  insertionSortSteps,
  isSorted,
  linearSearchSteps,
  reverseSteps,
  rotateSteps,
  sliceSteps,
  selectionSortSteps,
  traverseSteps,
  updateSteps,
  type AlgoKey,
  type HighlightKind,
  type Step,
} from "@/lib/algorithms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArrayScope — Interactive Array Algorithm Visualizer" },
      {
        name: "description",
        content:
          "Step through real array operations, linear and binary search, and bubble, selection and insertion sort with live stats, explanations and multi-language code.",
      },
      { property: "og:title", content: "ArrayScope — Interactive Array Algorithm Visualizer" },
      {
        property: "og:description",
        content:
          "Visualize array operations and sorting/searching algorithms step by step with synchronized C++, Python and Java code.",
      },
    ],
  }),
  component: ArrayScope,
});

const MAX_SIZE = 20;
const OPERATIONS: AlgoKey[] = ["access", "update", "insert", "delete", "traverse"];
const ADVANCED: AlgoKey[] = ["reverse", "rotate", "slice"];
const SEARCHES: AlgoKey[] = ["linear", "binary"];
const SORTS: AlgoKey[] = ["bubble", "selection", "insertion"];

const parseIntStrict = (raw: string): number | null => {
  const t = raw.trim();
  return /^-?\d+$/.test(t) ? Number(t) : null;
};

function ArrayScope() {
  const [array, setArray] = useState<number[]>([5, 3, 4, 1, 2]);
  const [baseArray, setBaseArray] = useState<number[]>([5, 3, 4, 1, 2]);

  const [manual, setManual] = useState("5, 3, 4, 1, 2");
  const [size, setSize] = useState("10");
  const [minVal, setMinVal] = useState("1");
  const [maxVal, setMaxVal] = useState("99");

  const [algo, setAlgo] = useState<AlgoKey>("bubble");
  const [opIndex, setOpIndex] = useState("0");
  const [opValue, setOpValue] = useState("42");
  const [target, setTarget] = useState("4");
  const [sliceEnd, setSliceEnd] = useState("3");

  const [steps, setSteps] = useState<Step[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(6);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("cpp");
  const [light, setLight] = useState(false);

  const committed = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  const step = steps ? steps[Math.min(current, steps.length - 1)] : null;
  const view = step ? step.array : array;
  const highlights: Record<number, HighlightKind> = step ? step.highlights : {};
  const atEnd = !!steps && current >= steps.length - 1;

  /* commit the final array once a run reaches its last step */
  useEffect(() => {
    if (steps && atEnd && !committed.current) {
      committed.current = true;
      setArray(steps[steps.length - 1]!.array);
    }
  }, [steps, atEnd]);

  /* autoplay */
  useEffect(() => {
    if (!playing || !steps) return;
    if (current >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const delay = Math.max(60, 1100 - speed * 100);
    const id = window.setTimeout(() => setCurrent((c) => c + 1), delay);
    return () => window.clearTimeout(id);
  }, [playing, current, steps, speed]);

  const resetRun = useCallback(() => {
    setPlaying(false);
    setSteps(null);
    setCurrent(0);
    committed.current = false;
    setArray(baseArray);
    setError(null);
    setNotice(null);
  }, [baseArray]);

  const clearRun = useCallback(() => {
    setPlaying(false);
    setSteps(null);
    setCurrent(0);
    committed.current = false;
    setError(null);
    setNotice(null);
  }, []);

  const start = (built: Step[], snapshot: number[]) => {
    setBaseArray(snapshot);
    setSteps(built);
    setCurrent(0);
    committed.current = false;
    setPlaying(true);
    setError(null);
  };

  /* ------------------------------- array creation ------------------------------ */

  const createManual = () => {
    const parts = manual.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length === 0) {
      setError("Enter at least one number, separated by commas.");
      return;
    }
    if (parts.length > MAX_SIZE) {
      setError(`Arrays are limited to ${MAX_SIZE} elements for a readable visualization.`);
      return;
    }
    const values: number[] = [];
    for (const p of parts) {
      const n = parseIntStrict(p);
      if (n === null) {
        setError(`"${p}" is not a valid integer. Use comma-separated whole numbers, e.g. 10, 20, 30.`);
        return;
      }
      values.push(n);
    }
    clearRun();
    setArray(values);
    setBaseArray(values);
    setNotice(`Array created with ${values.length} element${values.length === 1 ? "" : "s"}.`);
  };

  const createRandom = () => {
    const n = parseIntStrict(size);
    const lo = parseIntStrict(minVal);
    const hi = parseIntStrict(maxVal);
    if (n === null || n < 1 || n > MAX_SIZE) {
      setError(`Size must be a whole number between 1 and ${MAX_SIZE}.`);
      return;
    }
    if (lo === null || hi === null) {
      setError("Minimum and maximum must be whole numbers.");
      return;
    }
    if (lo > hi) {
      setError("Minimum cannot be greater than maximum.");
      return;
    }
    const values = Array.from({ length: n }, () => lo + Math.floor(Math.random() * (hi - lo + 1)));
    clearRun();
    setArray(values);
    setBaseArray(values);
    setManual(values.join(", "));
    setNotice(`Random array of ${n} values generated in range ${lo}–${hi}.`);
  };

  const clearArray = () => {
    clearRun();
    setArray([]);
    setBaseArray([]);
    setManual("");
    setNotice("Array cleared.");
  };

  /* ---------------------------------- running ---------------------------------- */

  const run = () => {
    setNotice(null);
    const a = array;
    if (a.length === 0) {
      setError("Create an array first.");
      return;
    }
    const idx = parseIntStrict(opIndex);
    const val = parseIntStrict(opValue);
    const tgt = parseIntStrict(target);

    switch (algo) {
      case "access": {
        if (idx === null || idx < 0 || idx >= a.length) {
          setError(`Index ${opIndex} is out of bounds. Valid indices are 0 to ${a.length - 1}.`);
          return;
        }
        start(accessSteps(a, idx), a);
        return;
      }
      case "update": {
        if (idx === null || idx < 0 || idx >= a.length) {
          setError(`Index ${opIndex} is out of bounds. Valid indices are 0 to ${a.length - 1}.`);
          return;
        }
        if (val === null) {
          setError("Value must be a whole number.");
          return;
        }
        start(updateSteps(a, idx, val), a);
        return;
      }
      case "insert": {
        if (a.length >= MAX_SIZE) {
          setError(`Arrays are limited to ${MAX_SIZE} elements.`);
          return;
        }
        if (idx === null || idx < 0 || idx > a.length) {
          setError(`Insert index must be between 0 and ${a.length}.`);
          return;
        }
        if (val === null) {
          setError("Value must be a whole number.");
          return;
        }
        start(insertSteps(a, idx, val), a);
        return;
      }
      case "delete": {
        if (idx === null || idx < 0 || idx >= a.length) {
          setError(`Index ${opIndex} is out of bounds. Valid indices are 0 to ${a.length - 1}.`);
          return;
        }
        start(deleteSteps(a, idx), a);
        return;
      }
      case "traverse":
        start(traverseSteps(a), a);
        return;
      case "reverse":
        start(reverseSteps(a), a);
        return;
      case "rotate": {
        if (val === null) {
          setError("Rotate amount must be a whole number.");
          return;
        }
        start(rotateSteps(a, val), a);
        return;
      }
      case "slice": {
        const end = parseIntStrict(sliceEnd);
        if (idx === null || end === null) {
          setError("Slice start and end must be whole numbers.");
          return;
        }
        if (idx < 0 || idx >= a.length) {
          setError(`Slice start must be between 0 and ${a.length - 1}.`);
          return;
        }
        if (end <= idx || end > a.length) {
          setError(`Slice end must be greater than the start and at most ${a.length}.`);
          return;
        }
        start(sliceSteps(a, idx, end), a);
        return;
      }
      case "linear": {
        if (tgt === null) {
          setError("Search target must be a whole number.");
          return;
        }
        start(linearSearchSteps(a, tgt), a);
        return;
      }
      case "binary": {
        if (tgt === null) {
          setError("Search target must be a whole number.");
          return;
        }
        if (!isSorted(a)) {
          setError("Binary Search requires a sorted array. Please sort the array first.");
          return;
        }
        start(binarySearchSteps(a, tgt), a);
        return;
      }
      case "bubble":
        start(bubbleSortSteps(a), a);
        return;
      case "selection":
        start(selectionSortSteps(a), a);
        return;
      case "insertion":
        start(insertionSortSteps(a), a);
        return;
    }
  };

  const goNext = useCallback(() => {
    setPlaying(false);
    setCurrent((c) => (steps ? Math.min(c + 1, steps.length - 1) : c));
  }, [steps]);

  const goPrev = useCallback(() => {
    setPlaying(false);
    committed.current = true;
    setCurrent((c) => Math.max(0, c - 1));
  }, []);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === " ") { e.preventDefault(); if (steps) setPlaying((p) => !p); }
      else if (e.key.toLowerCase() === "r") { resetRun(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, resetRun, steps]);

  const comparisons = step?.comparisons ?? 0;
  const swaps = step?.swaps ?? 0;
  const hasRange = useMemo(
    () => algo === "binary" && !!step && Object.keys(step.highlights).length > 0,
    [algo, step],
  );

  const needsIndex = ["access", "update", "insert", "delete", "slice"].includes(algo);
  const needsValue = ["update", "insert", "rotate"].includes(algo);
  const needsSliceEnd = algo === "slice";
  const indexLabel = algo === "slice" ? "start" : "index";
  const valueLabel = algo === "rotate" ? "positions" : "value";
  const swapsLabel =
    algo === "slice" ? "Copied" : ["insert", "delete", "rotate"].includes(algo) ? "Shifts" : "Swaps";
  const needsTarget = ["linear", "binary"].includes(algo);

  return (
    <div className="aurora-field min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-aurora/25 to-aurora3/25 ring-1 ring-border">
            <span className="font-mono text-sm font-semibold text-aurora">A:</span>
          </div>
          <div>
            <h1 className="text-sm leading-none font-semibold tracking-tight">ArrayScope</h1>
            <p className="mt-0.5 font-mono text-[10px] text-mist">structure · visualizer</p>
          </div>
        </div>
        <button
          onClick={() => setLight((v) => !v)}
          className="glass h-8 rounded-lg px-3 font-mono text-[11px] text-mist transition-colors hover:text-frost"
        >
          {light ? "Dark" : "Light"}
        </button>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-3 px-4 pb-8 lg:grid-cols-[320px_minmax(0,1fr)_380px]">
        {/* ---------------------------- CONTROL COLUMN ---------------------------- */}
        <div className="flex flex-col gap-3">
          <section className="glass rounded-2xl p-4">
            <p className="mb-3 font-mono text-[10px] tracking-[0.14em] text-mist uppercase">Create array</p>
            <label className="block">
              <span className="font-mono text-[10px] text-mist">manual values</span>
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="10, 20, 30, 40, 50"
                aria-label="Manual array values"
                className="mt-1 h-9 w-full rounded-lg bg-panel px-2.5 font-mono text-[13px] ring-1 ring-border outline-none focus:ring-primary"
              />
            </label>
            <button
              onClick={createManual}
              className="mt-2 h-9 w-full rounded-lg bg-primary font-mono text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Create array
            </button>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ["size", size, setSize],
                ["min", minVal, setMinVal],
                ["max", maxVal, setMaxVal],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="font-mono text-[10px] text-mist">{label as string}</span>
                  <input
                    value={value as string}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    aria-label={`Random ${label as string}`}
                    className="mt-1 h-9 w-full rounded-lg bg-panel px-2 font-mono text-[13px] ring-1 ring-border outline-none focus:ring-primary"
                  />
                </label>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={createRandom}
                className="glass h-9 rounded-lg font-mono text-[12px] text-frost transition-colors hover:bg-accent"
              >
                Randomize
              </button>
              <button
                onClick={clearArray}
                className="glass h-9 rounded-lg font-mono text-[12px] text-mist transition-colors hover:text-frost"
              >
                Clear
              </button>
            </div>
          </section>

          <section className="glass rounded-2xl p-4">
            <p className="mb-2 font-mono text-[10px] tracking-[0.14em] text-mist uppercase">
              Algorithm / operation
            </p>
            {[
              ["operations", OPERATIONS],
              ["advanced", ADVANCED],
              ["search", SEARCHES],
              ["sort", SORTS],
            ].map(([label, keys]) => (
              <div key={label as string} className="mb-3">
                <p className="mb-1.5 font-mono text-[9px] tracking-[0.12em] text-mist uppercase">
                  {label as string}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(keys as AlgoKey[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        setAlgo(k);
                        clearRun();
                      }}
                      aria-pressed={algo === k}
                      className={`h-9 rounded-lg font-mono text-[11px] transition-colors ${
                        algo === k
                          ? "bg-primary/15 text-frost ring-1 ring-primary/50"
                          : "glass text-mist hover:text-frost"
                      }`}
                    >
                      {ALGO_META[k].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {(needsIndex || needsValue || needsTarget || needsSliceEnd) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {needsIndex && (
                  <label className="block">
                    <span className="font-mono text-[10px] text-mist">{indexLabel}</span>
                    <input
                      value={opIndex}
                      onChange={(e) => setOpIndex(e.target.value)}
                      aria-label="Operation index"
                      className="mt-1 h-9 w-full rounded-lg bg-panel px-2.5 font-mono text-[13px] ring-1 ring-border outline-none focus:ring-primary"
                    />
                  </label>
                )}
                {needsValue && (
                  <label className="block">
                    <span className="font-mono text-[10px] text-mist">{valueLabel}</span>
                    <input
                      value={opValue}
                      onChange={(e) => setOpValue(e.target.value)}
                      aria-label="Operation value"
                      className="mt-1 h-9 w-full rounded-lg bg-panel px-2.5 font-mono text-[13px] ring-1 ring-border outline-none focus:ring-primary"
                    />
                  </label>
                )}
                {needsSliceEnd && (
                  <label className="block">
                    <span className="font-mono text-[10px] text-mist">end (exclusive)</span>
                    <input
                      value={sliceEnd}
                      onChange={(e) => setSliceEnd(e.target.value)}
                      aria-label="Slice end index"
                      className="mt-1 h-9 w-full rounded-lg bg-panel px-2.5 font-mono text-[13px] ring-1 ring-border outline-none focus:ring-primary"
                    />
                  </label>
                )}
                {needsTarget && (
                  <label className="block">
                    <span className="font-mono text-[10px] text-mist">target</span>
                    <input
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      aria-label="Search target"
                      className="mt-1 h-9 w-full rounded-lg bg-panel px-2.5 font-mono text-[13px] ring-1 ring-border outline-none focus:ring-primary"
                    />
                  </label>
                )}
              </div>
            )}

            <button
              onClick={run}
              disabled={array.length === 0}
              className="mt-3 h-10 w-full rounded-lg bg-primary font-mono text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Run {ALGO_META[algo].label}
            </button>
          </section>
        </div>

        {/* ----------------------------- STAGE COLUMN ----------------------------- */}
        <div className="flex flex-col gap-3">
          <section className="glass grid grid-cols-2 gap-2 rounded-2xl p-3 sm:grid-cols-5">
            {[
              ["Size", String(view.length), "text-frost"],
              ["Comparisons", String(comparisons), "text-aurora2"],
              [swapsLabel, String(swaps), "text-aurora3"],
              ["Step", steps ? `${current + 1}/${steps.length}` : "0", "text-frost"],
              ["Algorithm", ALGO_META[algo].label, "text-aurora"],
            ].map(([label, value, tone]) => (
              <div key={label}>
                <p className="font-mono text-[9px] tracking-[0.12em] text-mist uppercase">{label}</p>
                <p className={`mt-1 font-mono text-base font-semibold ${tone}`}>{value}</p>
              </div>
            ))}
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          {notice && !error && (
            <div className="glass rounded-xl px-4 py-2.5 font-mono text-[11px] text-aurora">{notice}</div>
          )}

          <ArrayCanvas
            array={view}
            highlights={highlights}
            hasRange={hasRange}
            caption={steps ? `${ALGO_META[algo].label} · running` : "idle"}
          />

          <section className="glass rounded-2xl p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={!steps || current === 0}
                  aria-label="Previous step"
                  className="glass grid h-10 w-10 place-items-center rounded-lg font-mono text-xs text-mist transition-colors hover:text-frost disabled:opacity-30"
                >
                  &lt;|
                </button>
                <button
                  onClick={() => setPlaying((p) => !p)}
                  disabled={!steps || atEnd}
                  aria-label={playing ? "Pause" : "Play"}
                  className="grid h-10 w-12 place-items-center rounded-lg bg-gradient-to-br from-aurora3/30 to-aurora2/30 font-mono text-xs font-semibold text-frost ring-1 ring-primary/40 transition-transform active:scale-[0.98] disabled:opacity-30"
                >
                  {playing ? "II" : "▶"}
                </button>
                <button
                  onClick={goNext}
                  disabled={!steps || atEnd}
                  aria-label="Next step"
                  className="glass grid h-10 w-10 place-items-center rounded-lg font-mono text-xs text-mist transition-colors hover:text-frost disabled:opacity-30"
                >
                  |&gt;
                </button>
                <button
                  onClick={resetRun}
                  disabled={!steps}
                  aria-label="Reset"
                  className="glass grid h-10 w-10 place-items-center rounded-lg font-mono text-xs text-mist transition-colors hover:text-frost disabled:opacity-30"
                >
                  R
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="font-mono text-[10px] text-mist" htmlFor="speed">
                  speed
                </label>
                <input
                  id="speed"
                  type="range"
                  min={1}
                  max={10}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-24 accent-primary"
                />
                <span className="font-mono text-[10px] text-aurora2">{speed}x</span>
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-tight">Explanation</p>
              <span className="font-mono text-[10px] text-aurora">
                {ALGO_META[algo].time} time · {ALGO_META[algo].space} space
              </span>
            </div>
            <p className="text-sm text-pretty text-foreground/90">
              {step
                ? step.explanation
                : array.length === 0
                  ? "No array yet. Create one on the left to start visualizing."
                  : `Ready. Pick an operation or algorithm and press Run — every frame you see is produced by the real ${ALGO_META[algo].label} execution.`}
            </p>
            {step?.pointers && (
              <div className="mt-3 flex gap-4 font-mono text-[11px]">
                <span className="text-aurora">low = {step.pointers.low}</span>
                <span className="text-warn">mid = {step.pointers.mid ?? "—"}</span>
                <span className="text-aurora">high = {step.pointers.high}</span>
              </div>
            )}
          </section>
        </div>

        {/* ------------------------------ CODE COLUMN ------------------------------ */}
        <div className="flex flex-col gap-3">
          <CodeViewer
            algo={algo}
            language={language}
            onLanguageChange={setLanguage}
            activeLine={step ? step.codeLine : null}
          />

          <section className="glass rounded-2xl p-4">
            <h2 className="mb-2 text-xs font-semibold tracking-tight">Learn arrays</h2>
            <dl className="space-y-2.5 text-[12px] text-mist">
              <div>
                <dt className="font-mono text-[10px] text-frost uppercase">Contiguous memory</dt>
                <dd>
                  Elements sit next to each other, so the address of index i is base + i × size — that is
                  why access is O(1).
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] text-frost uppercase">Insert / delete cost</dt>
                <dd>Shifting neighbours to keep the layout contiguous makes both operations O(n).</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] text-frost uppercase">Why sorting matters</dt>
                <dd>
                  Binary Search halves the search space each step, but only a sorted array guarantees the
                  discarded half cannot hold the target.
                </dd>
              </div>
            </dl>
            <p className="mt-3 font-mono text-[10px] text-mist">
              shortcuts: space play/pause · ← prev · → next · R reset
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
