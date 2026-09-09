# ArrayScope — Array Algorithm Visualizer Module

Interactive, step-accurate visualizer for array operations, searches, and sorts
(Aurora Command Deck UI). Every animation frame is a real algorithm step — no
faked sequences.

- Operations: access, update, insert, delete, traverse
- Advanced: reverse, rotate left, slice
- Searches: linear, binary (requires a sorted array)
- Sorts: bubble, selection, insertion
- Step engine: play / pause / next / previous / reset / speed
- Live stats, explanation panel, complexity labels, C++ / Python / Java code viewer

---

## 1. Quick start (local run)

Requires Node.js 20+ (or Bun).

```sh
git clone <repository-url>
cd <repository-name>
npm install
npm run dev          # http://localhost:8080
```

Other scripts:

```sh
npm run build        # production build
npm run build:dev    # development-mode build
npm run preview      # serve the build
npm run lint
npm run format
```

---

## 2. Configuration and environment variables

**This module needs no environment variables, API keys, or backend.** It is
100% client-side: no database, no network calls, no secrets to provision.

If you embed it in a larger app that does use env vars, nothing here conflicts —
just do not commit a `.env` file, and expose browser-side values only through
`VITE_*` names.

Build/config files that matter for a handoff:

| File | Purpose |
| --- | --- |
| `vite.config.ts` | Vite + TanStack Start setup |
| `tsconfig.json` | Path alias `@/*` → `src/*` (required by all imports below) |
| `src/styles.css` | Design tokens, theme classes, cell highlight animations |
| `components.json` | shadcn/ui component config |

---

## 3. Module structure

```
src/
  lib/
    algorithms.ts     # pure step generators + metadata  (no React)
    codeSnippets.ts   # C++/Python/Java source per algorithm (no React)
  components/viz/
    ArrayCanvas.tsx   # renders array cells + highlights
    CodeViewer.tsx    # language tabs + active-line highlighting
  routes/
    index.tsx         # full ArrayScope page: state, controls, playback
    __root.tsx        # document shell, fonts, theme class
  styles.css          # required tokens/animations for the viz components
```

**Layering:** `algorithms.ts` and `codeSnippets.ts` are framework-free and can be
reused anywhere. `ArrayCanvas` / `CodeViewer` are presentational React
components. `routes/index.tsx` is the composed page.

---

## 4. Reusable entry points

### `@/lib/algorithms`

```ts
type HighlightKind =
  | "compare" | "swap" | "sorted" | "found" | "active"
  | "min" | "key" | "range" | "low" | "high" | "mid";

type Step = {
  array: number[];                            // full snapshot at this step
  highlights: Record<number, HighlightKind>;  // index -> visual state
  explanation: string;                        // human-readable narration
  codeLine: number;                           // 1-based line in CODE[algo]
  comparisons: number;                        // cumulative
  swaps: number;                              // cumulative (shifts/copies for some ops)
  pointers?: { low?: number; mid?: number; high?: number };
};

type AlgoKey =
  | "access" | "update" | "insert" | "delete" | "traverse"
  | "reverse" | "rotate" | "slice"
  | "linear" | "binary"
  | "bubble" | "selection" | "insertion";

const ALGO_META: Record<AlgoKey, {
  label: string;
  group: "operation" | "advanced" | "search" | "sort";
  time: string;   // e.g. "O(n²)"
  space: string;
}>;

const isSorted: (a: number[]) => boolean;
```

Step generators — all pure, all return `Step[]`, none mutate their input:

| Function | Signature |
| --- | --- |
| `accessSteps` | `(a: number[], index: number)` |
| `updateSteps` | `(a: number[], index: number, value: number)` |
| `insertSteps` | `(a: number[], index: number, value: number)` |
| `deleteSteps` | `(a: number[], index: number)` |
| `traverseSteps` | `(a: number[])` |
| `reverseSteps` | `(a: number[])` |
| `rotateSteps` | `(a: number[], k: number)` |
| `sliceSteps` | `(a: number[], start: number, end: number)` |
| `linearSearchSteps` | `(a: number[], target: number)` |
| `binarySearchSteps` | `(a: number[], target: number)` — caller must check `isSorted` first |
| `bubbleSortSteps` | `(a: number[])` |
| `selectionSortSteps` | `(a: number[])` |
| `insertionSortSteps` | `(a: number[])` |

The final array result is always `steps[steps.length - 1].array`.

### `@/lib/codeSnippets`

```ts
type Language = "cpp" | "python" | "java";
const LANGUAGES: Array<{ key: Language; label: string; ext: string }>;
const CODE: Record<AlgoKey, Record<Language, string[]>>;  // one string per line
```

`Step.codeLine` indexes into `CODE[algo][language]` as a **1-based** line number.

### `@/components/viz/ArrayCanvas`

```tsx
<ArrayCanvas
  array={number[]}
  highlights={Record<number, HighlightKind>}
  hasRange={boolean}   // dims cells outside the active range (binary search / slice)
  caption={string}     // small monospace label, e.g. "step 4 / 21"
/>
```

Renders an empty state on its own when `array.length === 0`.

### `@/components/viz/CodeViewer`

```tsx
<CodeViewer
  algo={AlgoKey}
  language={Language}
  onLanguageChange={(l: Language) => void}
  activeLine={number | null}   // pass step.codeLine
/>
```

---

## 5. Integration example

Minimal embed: run bubble sort and step through it with the shipped components.

```tsx
// MiniVisualizer.tsx
import { useState } from "react";
import { bubbleSortSteps, type Step } from "@/lib/algorithms";
import { ArrayCanvas } from "@/components/viz/ArrayCanvas";
import { CodeViewer } from "@/components/viz/CodeViewer";
import type { Language } from "@/lib/codeSnippets";

export function MiniVisualizer({ input = [5, 3, 4, 1, 2] }: { input?: number[] }) {
  const [steps] = useState<Step[]>(() => bubbleSortSteps(input));
  const [i, setI] = useState(0);
  const [language, setLanguage] = useState<Language>("cpp");
  const step = steps[i]!;

  return (
    <div className="space-y-4">
      <ArrayCanvas
        array={step.array}
        highlights={step.highlights}
        hasRange={false}
        caption={`step ${i + 1} / ${steps.length}`}
      />

      <p className="text-sm">{step.explanation}</p>
      <p className="font-mono text-xs">
        comparisons {step.comparisons} · swaps {step.swaps}
      </p>

      <div className="flex gap-2">
        <button onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0}>
          Previous
        </button>
        <button
          onClick={() => setI((n) => Math.min(steps.length - 1, n + 1))}
          disabled={i === steps.length - 1}
        >
          Next
        </button>
      </div>

      <CodeViewer
        algo="bubble"
        language={language}
        onLanguageChange={setLanguage}
        activeLine={step.codeLine}
      />
    </div>
  );
}
```

Headless use (no UI, e.g. tests or a different renderer):

```ts
import { binarySearchSteps, isSorted } from "@/lib/algorithms";

if (!isSorted(data)) throw new Error("Binary Search requires a sorted array.");
const steps = binarySearchSteps(data, 50);
const finalArray = steps.at(-1)!.array;
```

### Checklist for dropping these files into another app

1. Copy `src/lib/algorithms.ts`, `src/lib/codeSnippets.ts`, and
   `src/components/viz/*`.
2. Keep or recreate the `@/*` → `src/*` path alias.
3. Import the token/animation layer from `src/styles.css` — the components use
   semantic classes (`glass`, `cell-compare`, `cell-sorted`, `text-mist`, …)
   defined there. Without it they render unstyled.
4. Add the `dark` / `light` theme class on `<html>` (see `src/routes/__root.tsx`).
5. Only React 19, Tailwind CSS v4, and `lucide-react` are needed for the viz
   pieces — no router or server dependency.

---

## 6. Dependencies

Runtime: React 19, TanStack Start / Router (page shell only), Tailwind CSS v4,
`lucide-react` icons, plus the shadcn/ui + Radix set already vendored in
`src/components/ui`. Tooling: TypeScript 5.8, Vite 8, ESLint, Prettier.

The reusable module (`lib/` + `components/viz/`) depends only on **React** and
**Tailwind**.

---

## 7. Behavior contracts worth preserving

- Array size is capped at 20 elements for readability.
- Binary Search is blocked on unsorted input with:
  `Binary Search requires a sorted array. Please sort the array first.`
- Invalid input (non-numeric values, out-of-range indices) surfaces a validation
  message and leaves the array unchanged — never throws.
- Reset restores the original array snapshot and zeroes the statistics; switching
  algorithms clears playback only.
- Keyboard transport: `Space` play/pause, `←` previous, `→` next, `R` reset.
