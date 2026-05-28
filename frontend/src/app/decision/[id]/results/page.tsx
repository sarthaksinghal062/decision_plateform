// frontend/src/app/decision/[id]/results/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getResults } from '@/lib/api'

interface OptionResult {
  id: string
  name: string
  final_score: number
  rank: number
}

interface CriterionWeight {
  id: string
  name: string
  weight: number
}

interface ResultsData {
  decision_title: string
  ranked_options: OptionResult[]
  criteria_weights: CriterionWeight[]
  score_breakdown: Record<string, Record<string, number>>
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getResults(id)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Calculating results...</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Could not load results.</p>
      </div>
    )
  }

  const winner = results.ranked_options[0]
  const maxScore = winner?.final_score ?? 10

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Winner Card */}
        <div className="bg-blue-600 text-white rounded-2xl p-6 text-center shadow-md">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-2xl font-bold">{winner.name}</h2>
          <p className="text-blue-100 mt-1">
            Score: {winner.final_score.toFixed(2)} · Winner of "{results.decision_title}"
          </p>
        </div>

        {/* Rankings + Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Final Rankings
          </h3>
          <div className="space-y-3">
            {results.ranked_options.map((opt, i) => (
              <div key={opt.id}>
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span className="font-medium">
                    {i + 1}. {opt.name}
                  </span>
                  <span className="text-gray-500">{opt.final_score.toFixed(2)}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      i === 0 ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                    style={{ width: `${(opt.final_score / maxScore) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Criteria Weights */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Criteria Weights
          </h3>
          <div className="space-y-2">
            {results.criteria_weights.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-32 shrink-0">{c.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(c.weight * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {(c.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Breakdown Table */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Score Breakdown
          </h3>
          <table className="w-full text-sm text-gray-700">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 font-medium text-gray-500">Factor</th>
                <th className="text-center py-2 font-medium text-gray-500">Weight</th>
                {results.ranked_options.map((o) => (
                  <th key={o.id} className="text-center py-2 font-medium text-gray-500">
                    {o.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.criteria_weights.map((c) => (
                <tr key={c.id} className="border-b border-gray-50">
                  <td className="py-2">{c.name}</td>
                  <td className="text-center py-2 text-gray-400">
                    {(c.weight * 100).toFixed(0)}%
                  </td>
                  {results.ranked_options.map((o) => (
                    <td key={o.id} className="text-center py-2">
                      {results.score_breakdown?.[o.id]?.[c.id] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 
                       font-medium hover:bg-gray-50 transition-colors text-sm bg-white"
          >
            Start New Decision
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium 
                       hover:bg-blue-700 transition-colors text-sm"
          >
            Copy Share Link
          </button>
        </div>

      </div>
    </main>
  )
}