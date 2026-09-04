export type HighlightKind =
  | "compare"
  | "swap"
  | "sorted"
  | "found"
  | "active"
  | "min"
  | "key"
  | "range"
  | "low"
  | "high"
  | "mid";

export type Step = {
  array: number[];
  highlights: Record<number, HighlightKind>;
  explanation: string;
  codeLine: number;
  comparisons: number;
  swaps: number;
  pointers?: { low?: number; mid?: number; high?: number };
};

export type AlgoKey =
  | "access"
  | "update"
  | "insert"
  | "delete"
  | "traverse"
  | "linear"
  | "binary"
  | "bubble"
  | "selection"
  | "insertion";

export const ALGO_META: Record<
  AlgoKey,
  { label: string; group: "operation" | "search" | "sort"; time: string; space: string }
> = {
  access: { label: "Access", group: "operation", time: "O(1)", space: "O(1)" },
  update: { label: "Update", group: "operation", time: "O(1)", space: "O(1)" },
  insert: { label: "Insert", group: "operation", time: "O(n)", space: "O(1)" },
  delete: { label: "Delete", group: "operation", time: "O(n)", space: "O(1)" },
  traverse: { label: "Traverse", group: "operation", time: "O(n)", space: "O(1)" },
  linear: { label: "Linear Search", group: "search", time: "O(n)", space: "O(1)" },
  binary: { label: "Binary Search", group: "search", time: "O(log n)", space: "O(1)" },
  bubble: { label: "Bubble Sort", group: "sort", time: "O(n²)", space: "O(1)" },
  selection: { label: "Selection Sort", group: "sort", time: "O(n²)", space: "O(1)" },
  insertion: { label: "Insertion Sort", group: "sort", time: "O(n²)", space: "O(1)" },
};

export const isSorted = (a: number[]) => a.every((v, i) => i === 0 || a[i - 1] <= v);

const mark = (entries: Array<[number, HighlightKind]>): Record<number, HighlightKind> =>
  Object.fromEntries(entries) as Record<number, HighlightKind>;

/* ---------------------------------- operations --------------------------------- */

export function accessSteps(a: number[], index: number): Step[] {
  const base = { comparisons: 0, swaps: 0 };
  return [
    {
      array: [...a],
      highlights: mark([[index, "active"]]),
      explanation: `Computing the memory offset for index ${index}. Arrays give direct random access, so no scanning is needed.`,
      codeLine: 2,
      ...base,
    },
    {
      array: [...a],
      highlights: mark([[index, "found"]]),
      explanation: `Index ${index} contains the value ${a[index]!}. Access completed in constant time.`,
      codeLine: 3,
      ...base,
    },
  ];
}

export function updateSteps(a: number[], index: number, value: number): Step[] {
  const after = [...a];
  const old = after[index];
  after[index] = value;
  return [
    {
      array: [...a],
      highlights: mark([[index, "active"]]),
      explanation: `Locating index ${index}, which currently holds ${old}.`,
      codeLine: 2,
      comparisons: 0,
      swaps: 0,
    },
    {
      array: after,
      highlights: mark([[index, "found"]]),
      explanation: `Index ${index} updated from ${old} to ${value}. The index itself never changes.`,
      codeLine: 3,
      comparisons: 0,
      swaps: 0,
    },
  ];
}

export function insertSteps(a: number[], index: number, value: number): Step[] {
  const steps: Step[] = [];
  const work = [...a, a.length ? a[a.length - 1] : value];
  steps.push({
    array: [...a],
    highlights: mark(a.length ? [[Math.min(index, a.length - 1), "active"]] : []),
    explanation: `Inserting ${value} at index ${index}. Every element from index ${index} onward must shift one slot to the right.`,
    codeLine: 2,
    comparisons: 0,
    swaps: 0,
  });
  for (let k = a.length - 1; k >= index; k--) {
    work[k + 1] = work[k]!;
    steps.push({
      array: [...work],
      highlights: mark([
        [k, "compare"],
        [k + 1, "swap"],
      ]),
      explanation: `Shifting the value ${work[k + 1]} from index ${k} to index ${k + 1}.`,
      codeLine: 4,
      comparisons: 0,
      swaps: steps.length,
    });
  }
  work[index] = value;
  steps.push({
    array: [...work],
    highlights: mark([[index, "found"]]),
    explanation: `Placed ${value} at index ${index}. Array size is now ${work.length}.`,
    codeLine: 6,
    comparisons: 0,
    swaps: Math.max(0, a.length - index),
  });
  return steps;
}

export function deleteSteps(a: number[], index: number): Step[] {
  const steps: Step[] = [];
  const work = [...a];
  steps.push({
    array: [...a],
    highlights: mark([[index, "active"]]),
    explanation: `Removing the element ${a[index]!} at index ${index}. Later elements shift one slot to the left.`,
    codeLine: 2,
    comparisons: 0,
    swaps: 0,
  });
  for (let k = index; k < a.length - 1; k++) {
    work[k] = work[k + 1]!;
    steps.push({
      array: [...work],
      highlights: mark([
        [k, "swap"],
        [k + 1, "compare"],
      ]),
      explanation: `Shifting the value ${work[k]} from index ${k + 1} to index ${k}.`,
      codeLine: 4,
      comparisons: 0,
      swaps: steps.length,
    });
  }
  work.pop();
  steps.push({
    array: [...work],
    highlights: {},
    explanation: `Deletion complete. Array size is now ${work.length}.`,
    codeLine: 6,
    comparisons: 0,
    swaps: Math.max(0, a.length - 1 - index),
  });
  return steps;
}

export function traverseSteps(a: number[]): Step[] {
  return a.map((v, i) => ({
    array: [...a],
    highlights: {
      ...mark(a.slice(0, i).map((_, k) => [k, "sorted"] as [number, HighlightKind])),
      [i]: "active" as HighlightKind,
    },
    explanation: `Visiting index ${i} — value ${v}. Traversal touches each element exactly once.`,
    codeLine: 2,
    comparisons: 0,
    swaps: 0,
  }));
}

/* ----------------------------------- searches ---------------------------------- */

export function linearSearchSteps(a: number[], target: number): Step[] {
  const steps: Step[] = [];
  let comparisons = 0;
  for (let i = 0; i < a.length; i++) {
    comparisons++;
    const found = a[i]! === target;
    steps.push({
      array: [...a],
      highlights: {
        ...mark(a.slice(0, i).map((_, k) => [k, "range"] as [number, HighlightKind])),
        [i]: (found ? "found" : "compare") as HighlightKind,
      },
      explanation: found
        ? `a[${i}] = ${a[i]!} matches the target ${target}.`
        : `Comparing a[${i}] = ${a[i]!} with the target ${target}. Not a match, moving right.`,
      codeLine: 3,
      comparisons,
      swaps: 0,
    });
    if (found) {
      steps.push({
        array: [...a],
        highlights: mark([[i, "found"]]),
        explanation: `Target ${target} found at index ${i} after ${comparisons} comparison${comparisons === 1 ? "" : "s"}.`,
        codeLine: 3,
        comparisons,
        swaps: 0,
      });
      return steps;
    }
  }
  steps.push({
    array: [...a],
    highlights: {},
    explanation: `Target ${target} was not found. Every one of the ${a.length} elements was checked.`,
    codeLine: 5,
    comparisons,
    swaps: 0,
  });
  return steps;
}

export function binarySearchSteps(a: number[], target: number): Step[] {
  const steps: Step[] = [];
  let comparisons = 0;
  let low = 0;
  let high = a.length - 1;

  const rangeMarks = (lo: number, hi: number, mid?: number) => {
    const h: Record<number, HighlightKind> = {};
    for (let k = lo; k <= hi; k++) h[k] = "range";
    if (mid !== undefined) h[mid] = "mid";
    if (lo <= hi) {
      if (h[lo] === "range") h[lo] = "low";
      if (h[hi] === "range") h[hi] = "high";
      if (mid !== undefined) h[mid] = "mid";
    }
    return h;
  };

  while (low <= high) {
    const mid: number = Math.floor(low + (high - low) / 2);
    comparisons++;
    steps.push({
      array: [...a],
      highlights: rangeMarks(low, high, mid),
      explanation: `Search space is [${low} … ${high}]. Midpoint is index ${mid} with value ${a[mid]!}.`,
      codeLine: 4,
      comparisons,
      swaps: 0,
      pointers: { low, high, mid },
    });
    if (a[mid]! === target) {
      steps.push({
        array: [...a],
        highlights: mark([[mid, "found"]]),
        explanation: `a[${mid}] = ${a[mid]!} equals the target. Target ${target} found at index ${mid} after ${comparisons} comparison${comparisons === 1 ? "" : "s"}.`,
        codeLine: 5,
        comparisons,
        swaps: 0,
        pointers: { low, high, mid },
      });
      return steps;
    }
    if (a[mid]! < target) {
      low = mid + 1;
      steps.push({
        array: [...a],
        highlights: rangeMarks(low, high),
        explanation: `${a[mid]!} < ${target}, so the target must be to the right. low moves to ${low}.`,
        codeLine: 6,
        comparisons,
        swaps: 0,
        pointers: { low, high },
      });
    } else {
      high = mid - 1;
      steps.push({
        array: [...a],
        highlights: rangeMarks(low, high),
        explanation: `${a[mid]!} > ${target}, so the target must be to the left. high moves to ${high}.`,
        codeLine: 7,
        comparisons,
        swaps: 0,
        pointers: { low, high },
      });
    }
  }
  steps.push({
    array: [...a],
    highlights: {},
    explanation: `low (${low}) passed high (${high}) — the search space is empty. Target ${target} was not found.`,
    codeLine: 9,
    comparisons,
    swaps: 0,
  });
  return steps;
}

/* ------------------------------------ sorts ------------------------------------ */

export function bubbleSortSteps(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];
  let comparisons = 0;
  let swaps = 0;
  const n = a.length;
  const sortedFrom = (i: number) => {
    const h: Record<number, HighlightKind> = {};
    for (let k = n - i; k < n; k++) h[k] = "sorted";
    return h;
  };

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      steps.push({
        array: [...a],
        highlights: { ...sortedFrom(i), [j]: "compare", [j + 1]: "compare" },
        explanation: `Comparing a[${j}] = ${a[j]!} with a[${j + 1}] = ${a[j + 1]!}.`,
        codeLine: 3,
        comparisons,
        swaps,
      });
      if (a[j]! > a[j + 1]!) {
        const tmp = a[j]!;
        a[j]! = a[j + 1]!;
        a[j + 1]! = tmp;
        swaps++;
        steps.push({
          array: [...a],
          highlights: { ...sortedFrom(i), [j]: "swap", [j + 1]: "swap" },
          explanation: `${a[j + 1]!} > ${a[j]!}, so the pair is swapped. The larger value bubbles right.`,
          codeLine: 4,
          comparisons,
          swaps,
        });
      }
    }
    steps.push({
      array: [...a],
      highlights: sortedFrom(i + 1),
      explanation: `Pass ${i + 1} complete — index ${n - i - 1} now holds its final value.`,
      codeLine: 6,
      comparisons,
      swaps,
    });
  }
  steps.push({
    array: [...a],
    highlights: mark(a.map((_, k) => [k, "sorted"] as [number, HighlightKind])),
    explanation: `Bubble Sort finished with ${comparisons} comparisons and ${swaps} swaps.`,
    codeLine: 7,
    comparisons,
    swaps,
  });
  return steps;
}

export function selectionSortSteps(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];
  let comparisons = 0;
  let swaps = 0;
  const n = a.length;
  const sortedTo = (i: number) => {
    const h: Record<number, HighlightKind> = {};
    for (let k = 0; k < i; k++) h[k] = "sorted";
    return h;
  };

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    steps.push({
      array: [...a],
      highlights: { ...sortedTo(i), [i]: "min" },
      explanation: `Starting pass ${i + 1}. Assume index ${i} (value ${a[i]!}) holds the minimum of the unsorted part.`,
      codeLine: 2,
      comparisons,
      swaps,
    });
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      steps.push({
        array: [...a],
        highlights: { ...sortedTo(i), [minIdx]: "min", [j]: "compare" },
        explanation: `Comparing a[${j}] = ${a[j]!} with the current minimum a[${minIdx}] = ${a[minIdx]!}.`,
        codeLine: 4,
        comparisons,
        swaps,
      });
      if (a[j]! < a[minIdx]!) {
        minIdx = j;
        steps.push({
          array: [...a],
          highlights: { ...sortedTo(i), [minIdx]: "min" },
          explanation: `New minimum found: a[${minIdx}] = ${a[minIdx]!}.`,
          codeLine: 4,
          comparisons,
          swaps,
        });
      }
    }
    if (minIdx !== i) {
      const tmp = a[i]!;
      a[i]! = a[minIdx]!;
      a[minIdx]! = tmp;
      swaps++;
      steps.push({
        array: [...a],
        highlights: { ...sortedTo(i), [i]: "swap", [minIdx]: "swap" },
        explanation: `Swapping index ${i} with the minimum at index ${minIdx}.`,
        codeLine: 6,
        comparisons,
        swaps,
      });
    } else {
      steps.push({
        array: [...a],
        highlights: { ...sortedTo(i), [i]: "sorted" },
        explanation: `Index ${i} already holds the minimum — no swap needed.`,
        codeLine: 6,
        comparisons,
        swaps,
      });
    }
  }
  steps.push({
    array: [...a],
    highlights: mark(a.map((_, k) => [k, "sorted"] as [number, HighlightKind])),
    explanation: `Selection Sort finished with ${comparisons} comparisons and ${swaps} swaps.`,
    codeLine: 7,
    comparisons,
    swaps,
  });
  return steps;
}

export function insertionSortSteps(input: number[]): Step[] {
  const a = [...input];
  const steps: Step[] = [];
  let comparisons = 0;
  let swaps = 0;
  const n = a.length;
  const sortedTo = (i: number) => {
    const h: Record<number, HighlightKind> = {};
    for (let k = 0; k < i; k++) h[k] = "sorted";
    return h;
  };

  for (let i = 1; i < n; i++) {
    const key = a[i]!;
    steps.push({
      array: [...a],
      highlights: { ...sortedTo(i), [i]: "key" },
      explanation: `Taking a[${i}] = ${key} as the key and inserting it into the sorted left portion.`,
      codeLine: 2,
      comparisons,
      swaps,
    });
    let j = i - 1;
    while (j >= 0 && a[j]! > key) {
      comparisons++;
      steps.push({
        array: [...a],
        highlights: { ...sortedTo(i), [j]: "compare" },
        explanation: `a[${j}] = ${a[j]!} is greater than the key ${key}, so it shifts one slot right.`,
        codeLine: 4,
        comparisons,
        swaps,
      });
      a[j + 1]! = a[j]!;
      swaps++;
      steps.push({
        array: [...a],
        highlights: { ...sortedTo(i), [j + 1]: "swap" },
        explanation: `Shifted ${a[j + 1]!} from index ${j} to index ${j + 1}.`,
        codeLine: 5,
        comparisons,
        swaps,
      });
      j--;
    }
    if (j >= 0) {
      comparisons++;
      steps.push({
        array: [...a],
        highlights: { ...sortedTo(i), [j]: "compare" },
        explanation: `a[${j}] = ${a[j]!} is not greater than the key ${key}. The insert position is index ${j + 1}.`,
        codeLine: 4,
        comparisons,
        swaps,
      });
    }
    a[j + 1]! = key;
    steps.push({
      array: [...a],
      highlights: { ...sortedTo(i + 1), [j + 1]: "found" },
      explanation: `Key ${key} placed at index ${j + 1}. The first ${i + 1} elements are now sorted.`,
      codeLine: 8,
      comparisons,
      swaps,
    });
  }
  steps.push({
    array: [...a],
    highlights: mark(a.map((_, k) => [k, "sorted"] as [number, HighlightKind])),
    explanation: `Insertion Sort finished with ${comparisons} comparisons and ${swaps} shifts.`,
    codeLine: 9,
    comparisons,
    swaps,
  });
  return steps;
}
