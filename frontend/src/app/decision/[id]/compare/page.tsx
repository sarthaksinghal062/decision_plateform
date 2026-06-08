// frontend/src/app/decision/[id]/compare/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { saveComparisons, calculateWeights } from "@/lib/api";
import { useDecisionStore } from "@/store/decisionStore";

// AHP preference levels
const PREFERENCES = [
  { label: "Extremely", value: "extremely", scale: 7 },
  { label: "Strongly", value: "strongly", scale: 5 },
  { label: "Moderately", value: "moderately", scale: 3 },
  { label: "Slightly", value: "slightly", scale: 2 },
  { label: "Equal", value: "equal", scale: 1 },
  { label: "Slightly", value: "slightly", scale: 2 },
  { label: "Moderately", value: "moderately", scale: 3 },
  { label: "Strongly", value: "strongly", scale: 5 },
  { label: "Extremely", value: "extremely", scale: 7 },
];

interface Criterion {
  id: string;
  name: string;
}

interface PairComparison {
  criterion_a: string;
  criterion_b: string;
  winner: string;
  preference: string;
}

// Generate all unique pairs from criteria list
function generatePairs(criteria: Criterion[]) {
  const pairs: [Criterion, Criterion][] = [];
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      pairs.push([criteria[i], criteria[j]]);
    }
  }
  return pairs;
}

export default function ComparePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    criteria,
    decisionTitle,
    setComparisons: storeSetComparisons,
  } = useDecisionStore();

  const pairs = useMemo(() => {
    if (criteria && criteria.length >= 2) {
      return generatePairs(criteria);
    }
    return [];
  }, [criteria]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PairComparison[]>([]);

  const [selected, setSelected] = useState<{
    winner: string;
    preference: string;
    side: "left" | "right" | "equal";
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!criteria || criteria.length < 2) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="card p-8 text-center max-w-md">
          <p className="text-[var(--text-2)] mb-6">
            No criteria found. Please go back and add criteria first.
          </p>
          <button
            onClick={() => router.push(`/decision/${id}/criteria`)}
            className="btn-primary px-8 py-3 rounded-2xl"
          >
            ← Back to Criteria
          </button>
        </div>
      </div>
    );
  }

  const totalPairs = pairs.length;
  const currentPair = pairs[currentIndex];
  const progress =
    totalPairs > 0 ? Math.round((currentIndex / totalPairs) * 100) : 0;
  const isLast = currentIndex === totalPairs - 1;

  const handleSelect = (
    side: "left" | "right" | "equal",
    preference: string,
  ) => {
    if (!currentPair) return;
    const [a, b] = currentPair;
    const winner = side === "left" ? a.id : side === "right" ? b.id : a.id;
    setSelected({ winner, preference, side });
  };

  const handleNext = () => {
    if (!selected || !currentPair) return;
    const [a, b] = currentPair;

    const entry: PairComparison = {
      criterion_a: a.id,
      criterion_b: b.id,
      winner: selected.side === "equal" ? a.id : selected.winner,
      preference: selected.preference,
    };

    const newAnswers = [...answers, entry];
    setAnswers(newAnswers);
    setSelected(null);

    if (!isLast) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (finalAnswers: PairComparison[]) => {
    setSaving(true);
    setError("");
    try {
      await saveComparisons(id, finalAnswers);
      const weights = await calculateWeights(id);
      storeSetComparisons(finalAnswers, weights);
      router.push(`/decision/${id}/options`);
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  if (saving) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-[var(--text-1)] font-medium">
            Calculating weights with AHP...
          </p>
          <p className="text-[var(--text-2)] text-sm mt-2">
            This takes just a second
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <div className="card p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-1">
            STEP 2 • COMPARISON
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Which matters more?
          </h1>
          {decisionTitle && (
            <p className="text-[var(--text-2)] mt-2">For: {decisionTitle}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-[var(--text-3)] mb-2">
            <span>
              Comparison {currentIndex + 1} of {totalPairs}
            </span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pairwise Card */}
        {currentPair && (
          <div className="mb-8">
            <p className="text-center text-[var(--text-2)] mb-6">
              Which factor matters{" "}
              <span className="font-semibold text-[var(--text-1)]">more</span>{" "}
              to you?
            </p>

            {/* Two options side by side */}
            <div className="flex items-center gap-3 mb-8">
              {/* Left */}
              <button
                onClick={() => {
                  if (selected?.side === "left") return;
                  setSelected({
                    winner: currentPair[0].id,
                    preference: "moderately",
                    side: "left",
                  });
                }}
                className={`flex-1 py-5 px-4 rounded-2xl border-2 text-center font-medium transition-all ${
                  selected?.side === "left"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-1)]"
                    : "border-[var(--border)] text-[var(--text-1)] hover:border-[var(--accent)]/50"
                }`}
              >
                {currentPair[0].name}
              </button>

              {/* Equal */}
              <button
                onClick={() => handleSelect("equal", "equal")}
                className={`px-6 py-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                  selected?.side === "equal"
                    ? "border-[var(--text-2)] bg-[var(--surface-2)] text-[var(--text-1)]"
                    : "border-[var(--border)] text-[var(--text-3)] hover:border-[var(--text-2)]"
                }`}
              >
                Equal
              </button>

              {/* Right */}
              <button
                onClick={() => {
                  if (selected?.side === "right") return;
                  setSelected({
                    winner: currentPair[1].id,
                    preference: "moderately",
                    side: "right",
                  });
                }}
                className={`flex-1 py-5 px-4 rounded-2xl border-2 text-center font-medium transition-all ${
                  selected?.side === "right"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-1)]"
                    : "border-[var(--border)] text-[var(--text-1)] hover:border-[var(--accent)]/50"
                }`}
              >
                {currentPair[1].name}
              </button>
            </div>

            {/* Strength selector */}
            {selected && selected.side !== "equal" && (
              <div className="mb-8">
                <p className="text-xs text-[var(--text-3)] text-center mb-4">
                  How much more important is{" "}
                  <span className="font-medium text-[var(--text-1)]">
                    {selected.side === "left"
                      ? currentPair[0].name
                      : currentPair[1].name}
                  </span>
                  ?
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {(
                    ["slightly", "moderately", "strongly", "extremely"] as const
                  ).map((pref) => (
                    <button
                      key={pref}
                      onClick={() =>
                        setSelected((s) => (s ? { ...s, preference: pref } : s))
                      }
                      className={`py-3 px-2 rounded-2xl text-xs font-medium border transition-all capitalize ${
                        selected?.preference === pref
                          ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                          : "border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)]/50"
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>

                <p className="text-center text-xs text-[var(--text-3)] mt-4">
                  slightly = 2× · moderately = 3× · strongly = 5× · extremely =
                  7×
                </p>
              </div>
            )}

            {/* Summary */}
            {selected && (
              <div className="bg-[var(--surface-2)] rounded-2xl p-5 text-center text-sm mb-8 border border-[var(--border)]">
                {selected.side === "equal" ? (
                  <>
                    <span className="font-medium text-[var(--text-1)]">
                      {currentPair[0].name}
                    </span>
                    {" and "}
                    <span className="font-medium text-[var(--text-1)]">
                      {currentPair[1].name}
                    </span>
                    {" are equally important"}
                  </>
                ) : (
                  <>
                    <span className="font-medium text-[var(--text-1)]">
                      {selected.side === "left"
                        ? currentPair[0].name
                        : currentPair[1].name}
                    </span>
                    {" is "}
                    <span className="font-medium text-[var(--accent)] capitalize">
                      {selected.preference}
                    </span>
                    {" more important than "}
                    <span className="font-medium text-[var(--text-1)]">
                      {selected.side === "left"
                        ? currentPair[1].name
                        : currentPair[0].name}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleNext}
              disabled={!selected}
              className="w-full btn-primary py-4 rounded-2xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLast ? "Calculate Weights →" : "Next Comparison →"}
            </button>

            {error && (
              <p className="text-red-400 text-center mt-4 text-sm">{error}</p>
            )}
          </div>
        )}

        {/* Criteria chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {criteria.map((c: Criterion) => (
            <span
              key={c.id}
              className="text-xs px-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl text-[var(--text-2)]"
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
