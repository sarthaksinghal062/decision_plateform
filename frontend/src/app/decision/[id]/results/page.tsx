"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getResults } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  PieChart,
  Pie,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
interface OptionResult {
  id: string;
  name: string;
  final_score: number;
  rank: number;
  scores_by_criterion: Record<string, number>;
}

interface CriterionWeight {
  id: string;
  name: string;
  weight: number;
}

interface ResultsData {
  decision_id?: string;
  decision_title?: string;
  ranked_options: OptionResult[];
  criteria_weights: CriterionWeight[];
  winner?: OptionResult | null;
}

type ResultsResponse = ResultsData & {
  ranking?: OptionResult[];
  weights?: CriterionWeight[];
};

// ─── Colors ──────────────────────────────────────────────────────────────────
const OPTION_COLORS = [
  "#f59e0b",
  "#fbbf24",
  "#fcd34d",
  "#22c55e",
  "#eab308",
  "#a3e635",
];
const DONUT_COLORS = [
  "#f59e0b",
  "#fbbf24",
  "#fcd34d",
  "#eab308",
  "#facc15",
  "#fef08c",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400";
  if (score >= 6) return "text-amber-400";
  if (score >= 4) return "text-yellow-400";
  return "text-red-400";
}

// ─── Sub Components ──────────────────────────────────────────────────────────
function WinnerCard({
  winner,
  title,
}: {
  winner: OptionResult;
  title: string;
}) {
  return (
    <div className="card relative overflow-hidden p-8 mb-6 bg-gradient-to-br from-[var(--accent)] to-amber-600 text-white">
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -right-2 w-24 h-24 bg-white/5 rounded-full" />
      <div className="relative z-10">
        <p className="text-amber-100 text-xs font-semibold uppercase tracking-widest mb-2">
          WINNER
        </p>
        <div className="flex items-start gap-4">
          <span className="text-5xl">🏆</span>
          <div>
            <h2 className="text-3xl font-bold leading-tight">{winner.name}</h2>
            <p className="text-amber-100 mt-1">
              Score:{" "}
              <span className="font-mono font-bold text-xl">
                {winner.final_score.toFixed(2)}
              </span>{" "}
              / 10
            </p>
            <p className="text-sm text-amber-200 mt-0.5">
              Best choice for &quot;{title}&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// (Rest of the components remain the same - only the broken part is fixed)

function RadarCompare({
  options,
  criteria,
}: {
  options: OptionResult[];
  criteria: CriterionWeight[];
}) {
  const data = criteria.map((c) => {
    const row: Record<string, string | number> = { criterion: c.name };
    options.forEach((o) => {
      row[o.name] = o.scores_by_criterion?.[c.id] ?? 0;
    });
    return row;
  });

  return (
    <div className="card p-6 mb-6">
      <p className="text-xs uppercase tracking-widest text-[var(--text-3)] font-semibold mb-5">
        MULTI-FACTOR COMPARISON
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="criterion"
            tick={{ fontSize: 11, fill: "var(--text-2)" }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: "var(--text-2)" }}
          />
          {options.map((opt, i) => (
            <Radar
              key={opt.id}
              name={opt.name}
              dataKey={opt.name}
              stroke={OPTION_COLORS[i] ?? "var(--accent)"}
              fill={OPTION_COLORS[i] ?? "var(--accent)"}
              fillOpacity={0.15}
              strokeWidth={2.5}
            />
          ))}
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ color: "var(--text-2)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--text-1)",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ... (keep the rest of your components: RankingList, FinalScoresBar, WeightsDonut, ScoreBreakdown, etc.)

// Main Page Component (keep your existing fetch logic + normalized data)
export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = (await getResults(id)) as ResultsResponse;

        const normalized: ResultsData = {
          ...data,
          ranked_options: data.ranked_options || data.ranking || [],
          criteria_weights: data.criteria_weights || data.weights || [],
          winner:
            data.winner || (data.ranked_options || data.ranking)?.[0] || null,
        };

        setResults(normalized);
      } catch (err) {
        console.error("Results fetch failed", err);
        setError("Could not load results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  // ... rest of your component (WinnerCard, RankingList, etc.) remains the same

  if (loading)
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="skeleton w-96 h-96 rounded-3xl" />
      </div>
    );

  if (error || !results || !results.ranked_options?.length) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-semibold mb-3">
            Failed to Load Results
          </h2>
          <p className="text-[var(--text-2)] mb-8">{error}</p>
          <button
            onClick={() => router.push(`/decision/${id}/score`)}
            className="btn-primary px-8 py-3 rounded-2xl"
          >
            ← Return to Scoring
          </button>
        </div>
      </div>
    );
  }

  const {
    decision_title = "Decision",
    ranked_options,
    criteria_weights,
  } = results;
  const winner = ranked_options[0];

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-[var(--text-3)]">
          ANALYSIS COMPLETE
        </p>
        <h1 className="text-4xl font-semibold tracking-tight mt-2">
          {decision_title}
        </h1>
      </div>

      <WinnerCard winner={winner} title={decision_title} />
      {/* Add other components: RankingList, FinalScoresBar, RadarCompare, etc. */}
      {/* ... your existing JSX ... */}
    </main>
  );
}
