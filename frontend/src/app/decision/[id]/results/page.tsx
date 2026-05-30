'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getResults } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  PieChart, Pie,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OptionResult {
  id: string
  name: string
  final_score: number
  rank: number
  scores_by_criterion: Record<string, number>   // criterion_id → raw score 1-10
}

interface CriterionWeight {
  id: string
  name: string
  weight: number   // 0.0 – 1.0
}

interface ResultsData {
  decision_id: string
  decision_title: string
  ranked_options: OptionResult[]
  criteria_weights: CriterionWeight[]
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const OPTION_COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2']
const DONUT_COLORS  = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE']

function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-blue-600'
  if (score >= 4) return 'text-amber-600'
  return 'text-red-500'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WinnerCard({ winner, title }: { winner: OptionResult; title: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700
                    text-white rounded-2xl p-6 shadow-lg mb-4">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -right-2 w-24 h-24 bg-white/5 rounded-full" />

      <div className="relative">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
          Best Choice
        </p>
        <div className="flex items-start gap-3">
          <span className="text-4xl mt-0.5">🏆</span>
          <div>
            <h2 className="text-2xl font-bold leading-tight">{winner.name}</h2>
            <p className="text-blue-200 text-sm mt-0.5">
              Score: <span className="text-white font-bold">{winner.final_score.toFixed(2)}</span>
              {' '}· Winner of "{title}"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RankingList({ options }: { options: OptionResult[] }) {
  const max = options[0]?.final_score ?? 10

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">
        Final Rankings
      </p>
      <div className="space-y-3">
        {options.map((opt, i) => (
          <div key={opt.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center
                                  justify-center flex-shrink-0 ${
                  i === 0 ? 'bg-blue-600 text-white' :
                  i === 1 ? 'bg-gray-200 text-gray-700' :
                            'bg-gray-100 text-gray-500'
                }`}>
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-gray-800">{opt.name}</span>
              </div>
              <span className={`text-sm font-bold ${scoreColor(opt.final_score)}`}>
                {opt.final_score.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-8">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(opt.final_score / max) * 100}%`,
                  backgroundColor: OPTION_COLORS[i] ?? '#9CA3AF',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinalScoresBar({ options }: { options: OptionResult[] }) {
  const data = options.map((o, i) => ({
    name: o.name,
    score: parseFloat(o.final_score.toFixed(2)),
    color: OPTION_COLORS[i] ?? '#9CA3AF',
  }))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">
        Score Comparison
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 13 }}
            formatter={(val: number) => [val.toFixed(2), 'Score']}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RadarCompare({
  options,
  criteria,
}: {
  options: OptionResult[]
  criteria: CriterionWeight[]
}) {
  // Build data: one row per criterion
  const data = criteria.map((c) => {
    const row: Record<string, string | number> = { criterion: c.name }
    options.forEach((o) => {
      row[o.name] = o.scores_by_criterion?.[c.id] ?? 0
    })
    return row
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">
        Option Comparison by Factor
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis
            dataKey="criterion"
            tick={{ fontSize: 11, fill: '#6B7280' }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickCount={4}
          />
          {options.map((opt, i) => (
            <Radar
              key={opt.id}
              name={opt.name}
              dataKey={opt.name}
              stroke={OPTION_COLORS[i] ?? '#9CA3AF'}
              fill={OPTION_COLORS[i] ?? '#9CA3AF'}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 13 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function WeightsDonut({ criteria }: { criteria: CriterionWeight[] }) {
  const data = criteria.map((c) => ({
    name: c.name,
    value: parseFloat((c.weight * 100).toFixed(1)),
  }))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">
        Criteria Weights
      </p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => [`${val}%`, 'Weight']}
              contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                />
                <span className="text-xs text-gray-600">{d.name}</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScoreBreakdown({
  options,
  criteria,
}: {
  options: OptionResult[]
  criteria: CriterionWeight[]
}) {
  const CELL_COLOR: Record<number, string> = {
    10: 'bg-emerald-500', 9: 'bg-green-500', 8: 'bg-green-400',
    7: 'bg-lime-400',     6: 'bg-yellow-400', 5: 'bg-amber-300',
    4: 'bg-amber-400',   3: 'bg-orange-400', 2: 'bg-red-400', 1: 'bg-red-500',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4 overflow-x-auto">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">
        Score Breakdown
      </p>
      <table className="w-full text-sm text-gray-700 min-w-max">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 pr-6 font-medium text-gray-500 text-xs">Factor</th>
            <th className="text-center py-2 px-3 font-medium text-gray-500 text-xs">Weight</th>
            {options.map((o) => (
              <th key={o.id} className="text-center py-2 px-3 font-medium text-gray-500 text-xs">
                {o.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => (
            <tr key={c.id} className="border-b border-gray-50">
              <td className="py-2.5 pr-6 text-sm font-medium text-gray-800">{c.name}</td>
              <td className="text-center py-2.5 px-3">
                <span className="text-xs text-gray-400 font-medium">
                  {(c.weight * 100).toFixed(0)}%
                </span>
              </td>
              {options.map((o) => {
                const s = o.scores_by_criterion?.[c.id] ?? 0
                return (
                  <td key={o.id} className="text-center py-2.5 px-3">
                    {s > 0 ? (
                      <span className={`inline-flex w-8 h-8 rounded-lg text-white text-xs
                                        font-bold items-center justify-center
                                        ${CELL_COLOR[s] ?? 'bg-gray-300'}`}>
                        {s}
                      </span>
                    ) : (
                      <span className="text-gray-200">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}

          {/* Final score row */}
          <tr className="bg-gray-50">
            <td className="py-2.5 pr-6 text-xs font-bold text-gray-700 uppercase tracking-wide">
              Final Score
            </td>
            <td />
            {options.map((o, i) => (
              <td key={o.id} className="text-center py-2.5 px-3">
                <span
                  className="text-sm font-bold"
                  style={{ color: OPTION_COLORS[i] ?? '#6B7280' }}
                >
                  {o.final_score.toFixed(2)}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="max-w-xl mx-auto space-y-4 animate-pulse py-10 px-4">
      <div className="h-32 bg-gray-200 rounded-2xl" />
      <div className="h-40 bg-gray-100 rounded-2xl" />
      <div className="h-52 bg-gray-100 rounded-2xl" />
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [results, setResults]   = useState<ResultsData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [copied, setCopied]     = useState(false)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!id) return
    getResults(id)
      .then(setResults)
      .catch(() => setError('Could not load results. Please try again.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mounted || loading) return <Skeleton />

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-gray-700 font-medium mb-1">Something went wrong</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push(`/decision/${id}/score`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            ← Back to Scoring
          </button>
        </div>
      </div>
    )
  }

  const { decision_title, ranked_options, criteria_weights } = results
  const winner = ranked_options[0]

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Page header */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
            Results
          </p>
          <h1 className="text-xl font-bold text-gray-900">{decision_title}</h1>
        </div>

        {/* 1 — Winner card */}
        <WinnerCard winner={winner} title={decision_title} />

        {/* 2 — Rankings */}
        <RankingList options={ranked_options} />

        {/* 3 — Bar chart */}
        <FinalScoresBar options={ranked_options} />

        {/* 4 — Radar chart (only if 2+ criteria) */}
        {criteria_weights.length >= 2 && (
          <RadarCompare options={ranked_options} criteria={criteria_weights} />
        )}

        {/* 5 — Donut chart */}
        <WeightsDonut criteria={criteria_weights} />

        {/* 6 — Breakdown table */}
        <ScoreBreakdown options={ranked_options} criteria={criteria_weights} />

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700
                       font-medium hover:bg-gray-50 transition-colors text-sm bg-white"
          >
            New Decision
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium
                       hover:bg-blue-700 transition-colors text-sm"
          >
            {copied ? '✓ Copied!' : 'Share Results'}
          </button>
        </div>

      </div>
    </main>
  )
}