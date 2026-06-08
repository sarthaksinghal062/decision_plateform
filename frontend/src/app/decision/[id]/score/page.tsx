// frontend/src/app/decision/[id]/score/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { saveScores } from "@/lib/api";
import { useDecisionStore } from "@/store/decisionStore";

interface Option {
  id: string;
  name: string;
}

interface Criterion {
  id: string;
  name: string;
  weight?: number;
}

interface ScoreEntry {
  option_id: string;
  criterion_id: string;
  score: number;
}

// Score labels for UX
const SCORE_LABELS: Record<number, string> = {
  1: "Very Poor",
  2: "Poor",
  3: "Below Avg",
  4: "Average",
  5: "Average",
  6: "Above Avg",
  7: "Good",
  8: "Very Good",
  9: "Excellent",
  10: "Perfect",
};

const SCORE_COLOR: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-red-400",
  3: "bg-orange-400",
  4: "bg-amber-400",
  5: "bg-amber-300",
  6: "bg-yellow-400",
  7: "bg-lime-400",
  8: "bg-green-400",
  9: "bg-green-500",
  10: "bg-emerald-500",
};

export default function ScorePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { decisionTitle, options, criteria } = useDecisionStore();

  const [scores, setScores] = useState<Record<string, Record<string, number>>>(
    {},
  );
  const [activeOption, setActiveOption] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (options && options.length > 0 && !activeOption) {
      // Defer setting state to avoid synchronous setState inside effect which can cause
      // cascading renders. Scheduling on a microtask ensures this runs after render.
      Promise.resolve().then(() => setActiveOption(options[0].id));
    }
  }, [options, activeOption]);

  if (!options || options.length === 0 || !criteria || criteria.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="card p-8 text-center max-w-md">
          <p className="text-[var(--text-2)] mb-6">
            Missing options or criteria. Please go back.
          </p>
          <button
            onClick={() => router.push(`/decision/${id}/options`)}
            className="btn-primary px-8 py-3 rounded-2xl"
          >
            ← Back to Options
          </button>
        </div>
      </div>
    );
  }

  const setScore = (optionId: string, criterionId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [optionId]: {
        ...(prev[optionId] ?? {}),
        [criterionId]: value,
      },
    }));
  };

  const getScore = (optionId: string, criterionId: string): number => {
    return scores[optionId]?.[criterionId] ?? 0;
  };

  const filledForOption = (optionId: string): number => {
    return criteria.filter(
      (c: Criterion) => (scores[optionId]?.[c.id] ?? 0) > 0,
    ).length;
  };

  const totalFilled = options.reduce(
    (acc: number, o: Option) => acc + filledForOption(o.id),
    0,
  );
  const totalNeeded = options.length * criteria.length;
  const progress =
    totalNeeded > 0 ? Math.round((totalFilled / totalNeeded) * 100) : 0;
  const allFilled = totalFilled === totalNeeded;

  const handleContinue = async () => {
    if (!allFilled) {
      setError(
        "Please score every option against every criterion before continuing.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      const entries: ScoreEntry[] = [];
      for (const opt of options) {
        for (const crit of criteria) {
          entries.push({
            option_id: opt.id,
            criterion_id: crit.id,
            score: scores[opt.id]?.[crit.id] ?? 5,
          });
        }
      }
      await saveScores(id, entries);
      router.push(`/decision/${id}/results`);
    } catch (e) {
      console.error(e);
      setError("Failed to save scores. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const currentOptionIndex = options.findIndex(
    (o: Option) => o.id === activeOption,
  );
  const isLastOption = currentOptionIndex === options.length - 1;

  const goToNextOption = () => {
    if (!isLastOption) {
      setActiveOption(options[currentOptionIndex + 1].id);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="card p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-1">
            STEP 4 • SCORING
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Rate every option
          </h1>
          {decisionTitle && (
            <p className="text-[var(--text-2)] mt-2">For: {decisionTitle}</p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-[var(--text-3)] mb-2">
            <span>
              {totalFilled} of {totalNeeded} scores filled
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

        {/* Option Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-[var(--border)]">
          {options.map((opt: Option, i: number) => {
            const filled = filledForOption(opt.id);
            const complete = filled === criteria.length;
            const isActive = activeOption === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveOption(opt.id)}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-medium border transition-all whitespace-nowrap ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-1)]"
                    : complete
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-[var(--border)] text-[var(--text-2)] hover:border-[var(--accent)]/50"
                }`}
              >
                {complete && !isActive && "✓ "}
                {i + 1}. {opt.name}
                {!complete && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {filled}/{criteria.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scoring Interface */}
        {activeOption && (
          <div className="card p-8 mb-8 bg-[var(--surface-2)]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-semibold text-xl text-[var(--text-1)]">
                {options.find((o: Option) => o.id === activeOption)?.name}
              </h2>
              <span className="text-sm text-[var(--text-3)]">
                {filledForOption(activeOption)}/{criteria.length}
              </span>
            </div>

            <div className="space-y-10">
              {criteria.map((crit: Criterion) => {
                const score = getScore(activeOption, crit.id);
                return (
                  <div key={crit.id}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-medium text-[var(--text-1)]">
                          {crit.name}
                        </p>
                        {crit.weight && (
                          <p className="text-xs text-[var(--text-3)]">
                            Weight: {(crit.weight * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                      {score > 0 && (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${SCORE_COLOR[score]}`}
                          />
                          <span className="font-mono font-bold text-lg text-[var(--text-1)]">
                            {score}
                          </span>
                          <span className="text-sm text-[var(--text-3)]">
                            {SCORE_LABELS[score]}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-10 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                        <button
                          key={val}
                          onClick={() => setScore(activeOption, crit.id, val)}
                          className={`h-11 rounded-2xl text-sm font-semibold border transition-all ${
                            score === val
                              ? `${SCORE_COLOR[val]} text-white shadow-md scale-105`
                              : "border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-2)] hover:text-[var(--text-1)]"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs text-[var(--text-3)] mt-2 px-1">
                      <span>Poor</span>
                      <span>Perfect</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isLastOption &&
              filledForOption(activeOption) === criteria.length && (
                <button
                  onClick={goToNextOption}
                  className="w-full mt-8 py-4 border border-[var(--border)] hover:bg-[var(--surface)] rounded-2xl text-[var(--text-1)] transition-colors"
                >
                  Next option: {options[currentOptionIndex + 1]?.name} →
                </button>
              )}
          </div>
        )}

        {/* Score Overview */}
        {totalFilled > 0 && (
          <div className="card p-6 mb-8 overflow-x-auto">
            <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-5">
              SCORE OVERVIEW
            </p>
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 pr-6 font-medium text-[var(--text-3)]">
                    Criterion
                  </th>
                  {options.map((o: Option) => (
                    <th
                      key={o.id}
                      className="text-center py-3 px-3 font-medium text-[var(--text-3)]"
                    >
                      {o.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((crit: Criterion) => (
                  <tr key={crit.id} className="border-b border-[var(--border)]">
                    <td className="py-4 pr-6 font-medium text-[var(--text-1)]">
                      {crit.name}
                    </td>
                    {options.map((o: Option) => {
                      const s = getScore(o.id, crit.id);
                      return (
                        <td key={o.id} className="text-center py-4 px-3">
                          {s > 0 ? (
                            <span
                              className={`inline-flex w-9 h-9 items-center justify-center rounded-2xl text-white text-sm font-bold ${SCORE_COLOR[s]}`}
                            >
                              {s}
                            </span>
                          ) : (
                            <span className="text-[var(--text-3)]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={!allFilled || saving}
          className="w-full btn-primary py-4 rounded-2xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calculating final results...
            </span>
          ) : allFilled ? (
            "See Final Results →"
          ) : (
            `${totalNeeded - totalFilled} scores remaining`
          )}
        </button>

        <button
          onClick={() => router.push(`/decision/${id}/options`)}
          className="w-full mt-4 py-3 text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
        >
          ← Back to Options
        </button>
      </div>
    </main>
  );
}
