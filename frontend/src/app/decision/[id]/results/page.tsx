"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getResults } from "@/lib/api"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend
} from "recharts"

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#7C3AED", "#0891B2"]

interface RankItem {
  option_id: string
  name: string
  score: number
  breakdown: Record<string, number>
  is_winner?: boolean
}
interface WeightItem {
  criterion: string
  criterion_id: string
  weight: number
}
interface Results {
  winner: RankItem
  ranking: RankItem[]
  weights: WeightItem[]
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const decisionId = params.id as string
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "radar">("overview")

  useEffect(() => {
    getResults(decisionId)
      .then((res) => setResults(res.data))
      .catch(() => setError("Could not load results. Please try again."))
      .finally(() => setLoading(false))
  }, [decisionId])

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={() => router.refresh()} />
  if (!results) return null

  const { winner, ranking, weights } = results

  // Bar chart data
  const barData = ranking.map((r, i) => ({
    name: r.name,
    score: r.score,
    fill: COLORS[i % COLORS.length],
  }))

  // Donut chart data
  const donutData = weights.map((w) => ({
    name: w.criterion,
    value: Math.round(w.weight * 100),
  }))

  // Radar chart data
  const radarData = weights.map((w) => {
    const entry: Record<string, any> = { criterion: w.criterion }
    ranking.forEach((opt) => {
      entry[opt.name] = opt.breakdown[w.criterion_id] || 0
    })
    return entry
  })

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Analysis complete</p>
            <h1 className="text-lg font-semibold text-gray-900">Decision Results</h1>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + New Decision
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Winner Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏆</span>
                <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">Best Choice</span>
              </div>
              <h2 className="text-3xl font-bold mb-1">{winner.name}</h2>
              <p className="text-blue-200 text-sm">
                Scored {winner.score.toFixed(2)} out of 10 based on your priorities
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{winner.score.toFixed(1)}</div>
              <div className="text-blue-200 text-xs">weighted score</div>
            </div>
          </div>

          {/* Mini ranking inside winner card */}
          <div className="mt-5 pt-5 border-t border-blue-500 grid grid-cols-3 gap-3">
            {ranking.map((r, i) => (
              <div key={r.option_id} className={`rounded-xl p-3 ${i === 0 ? "bg-white/20" : "bg-white/10"}`}>
                <div className="text-xs text-blue-200 mb-1">#{i + 1}</div>
                <div className="font-semibold text-sm truncate">{r.name}</div>
                <div className="text-blue-200 text-xs">{r.score.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(["overview", "breakdown", "radar"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Final Scores</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(2), "Score"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Your Priorities</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`, "Weight"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Breakdown Tab */}
        {activeTab === "breakdown" && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Score Breakdown</h3>
              <p className="text-xs text-gray-400 mt-0.5">How each option scored on every factor</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Factor</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Weight</th>
                    {ranking.map((r) => (
                      <th key={r.option_id} className="text-center px-4 py-3 text-xs font-medium text-gray-500">
                        {r.name}
                        {r.is_winner && <span className="ml-1">🏆</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weights.map((w, i) => (
                    <tr key={w.criterion_id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-6 py-3 font-medium text-gray-900">{w.criterion}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {Math.round(w.weight * 100)}%
                        </span>
                      </td>
                      {ranking.map((r) => {
                        const score = r.breakdown[w.criterion_id] || 0
                        const contribution = (w.weight * score).toFixed(2)
                        return (
                          <td key={r.option_id} className="px-4 py-3 text-center">
                            <span className={`font-semibold ${score >= 8 ? "text-green-600" : score >= 5 ? "text-gray-700" : "text-red-500"}`}>
                              {score}
                            </span>
                            <span className="text-gray-300 text-xs ml-1">({contribution})</span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">Final Score</td>
                    <td className="px-4 py-3"></td>
                    {ranking.map((r) => (
                      <td key={r.option_id} className="px-4 py-3 text-center">
                        <span className={`font-bold text-base ${r.is_winner ? "text-blue-600" : "text-gray-700"}`}>
                          {r.score.toFixed(2)}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Radar Tab */}
        {activeTab === "radar" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Option Comparison</h3>
            <p className="text-xs text-gray-400 mb-4">How each option performs across all factors</p>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                {ranking.map((r, i) => (
                  <Radar
                    key={r.option_id}
                    name={r.name}
                    dataKey={r.name}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Why winner won */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Why {winner.name} won</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Based on your priorities, <strong>{winner.name}</strong> scored highest with{" "}
                <strong>{winner.score.toFixed(2)}/10</strong>. The top factor was{" "}
                <strong>{weights[0]?.criterion}</strong> ({Math.round(weights[0]?.weight * 100)}% weight),
                where {winner.name} scored{" "}
                <strong>{winner.breakdown[weights[0]?.criterion_id] || "—"}/10</strong>.{" "}
                {ranking.length > 1 && (
                  <>
                    The runner-up <strong>{ranking[1].name}</strong> scored{" "}
                    {ranking[1].score.toFixed(2)}, a difference of{" "}
                    {(winner.score - ranking[1].score).toFixed(2)} points.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Start New Decision
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </main>
  )
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Calculating results...</p>
      </div>
    </main>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <p className="text-gray-700 mb-4">{message}</p>
        <button onClick={onRetry} className="text-blue-600 underline text-sm">Try again</button>
      </div>
    </main>
  )
}
