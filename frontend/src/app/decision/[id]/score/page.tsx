// frontend/src/app/decision/[id]/score/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { saveScores } from '@/lib/api'
import { useDecisionStore } from '@/store/decisionStore'

interface Option {
  id: string
  name: string
}

interface Criterion {
  id: string
  name: string
  weight?: number
}

interface ScoreEntry {
  option_id: string
  criterion_id: string
  score: number
}

// Score labels for UX
const SCORE_LABELS: Record<number, string> = {
  1:  'Very Poor',
  2:  'Poor',
  3:  'Below Avg',
  4:  'Average',
  5:  'Average',
  6:  'Above Avg',
  7:  'Good',
  8:  'Very Good',
  9:  'Excellent',
  10: 'Perfect',
}

const SCORE_COLOR: Record<number, string> = {
  1:  'bg-red-500',
  2:  'bg-red-400',
  3:  'bg-orange-400',
  4:  'bg-amber-400',
  5:  'bg-amber-300',
  6:  'bg-yellow-400',
  7:  'bg-lime-400',
  8:  'bg-green-400',
  9:  'bg-green-500',
  10: 'bg-emerald-500',
}

export default function ScorePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { decisionTitle, options, criteria } = useDecisionStore()

  // scores[option_id][criterion_id] = number (1-10)
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({})
  const [activeOption, setActiveOption] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (options && options.length > 0 && !activeOption) {
      setActiveOption(options[0].id)
    }
  }, [options, activeOption])

  if (!mounted) return null

  if (!options || options.length === 0 || !criteria || criteria.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Missing options or criteria. Please go back.</p>
          <button
            onClick={() => router.push(`/decision/${id}/options`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            ← Back to Options
          </button>
        </div>
      </div>
    )
  }

  const setScore = (optionId: string, criterionId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [optionId]: {
        ...(prev[optionId] ?? {}),
        [criterionId]: value,
      },
    }))
  }

  const getScore = (optionId: string, criterionId: string): number => {
    return scores[optionId]?.[criterionId] ?? 0
  }

  // How many scores filled for current option
  const filledForOption = (optionId: string): number => {
    return criteria.filter((c: Criterion) => (scores[optionId]?.[c.id] ?? 0) > 0).length
  }

  // Total filled across all options
  const totalFilled = options.reduce((acc: number, o: Option) => acc + filledForOption(o.id), 0)
  const totalNeeded = options.length * criteria.length
  const progress = totalNeeded > 0 ? Math.round((totalFilled / totalNeeded) * 100) : 0
  const allFilled = totalFilled === totalNeeded

  const handleContinue = async () => {
    if (!allFilled) {
      setError('Please score every option against every criterion before continuing.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const entries: ScoreEntry[] = []
      for (const opt of options) {
        for (const crit of criteria) {
          entries.push({
            option_id: opt.id,
            criterion_id: crit.id,
            score: scores[opt.id]?.[crit.id] ?? 5,
          })
        }
      }
      await saveScores(id, entries)
      router.push(`/decision/${id}/results`)
    } catch (e) {
      console.error(e)
      setError('Failed to save scores. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const currentOptionIndex = options.findIndex((o: Option) => o.id === activeOption)
  const isLastOption = currentOptionIndex === options.length - 1

  const goToNextOption = () => {
    if (!isLastOption) {
      setActiveOption(options[currentOptionIndex + 1].id)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
            Step 4 of 4
          </p>
          <h1 className="text-xl font-bold text-gray-900">Score Each Option</h1>
          {decisionTitle && (
            <p className="text-sm text-gray-500 mt-0.5">For: {decisionTitle}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>{totalFilled} of {totalNeeded} scores filled</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Option tabs */}
        <div className="flex gap-2 mt-5 mb-4 overflow-x-auto pb-1">
          {options.map((opt: Option, i: number) => {
            const filled = filledForOption(opt.id)
            const complete = filled === criteria.length
            const isActive = activeOption === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setActiveOption(opt.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : complete
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {complete && !isActive && (
                  <span className="mr-1">✓</span>
                )}
                {i + 1}. {opt.name}
                {!complete && (
                  <span className="ml-1.5 text-gray-300">
                    {filled}/{criteria.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Scoring card for active option */}
        {activeOption && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 text-base">
                {options.find((o: Option) => o.id === activeOption)?.name}
              </h2>
              <span className="text-xs text-gray-400">
                {filledForOption(activeOption)}/{criteria.length} scored
              </span>
            </div>

            <div className="space-y-6">
              {criteria.map((crit: Criterion) => {
                const score = getScore(activeOption, crit.id)
                return (
                  <div key={crit.id}>

                    {/* Criterion label + score badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{crit.name}</p>
                        {crit.weight && (
                          <p className="text-xs text-gray-400">
                            Weight: {(crit.weight * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                      {score > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${SCORE_COLOR[score]}`} />
                          <span className="text-sm font-bold text-gray-900">{score}</span>
                          <span className="text-xs text-gray-400">{SCORE_LABELS[score]}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">Not scored</span>
                      )}
                    </div>

                    {/* Score buttons 1-10 */}
                    <div className="grid grid-cols-10 gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                        <button
                          key={val}
                          onClick={() => setScore(activeOption, crit.id, val)}
                          className={`h-9 rounded-lg text-xs font-semibold border transition-all ${
                            score === val
                              ? `${SCORE_COLOR[val]} text-white border-transparent shadow-sm scale-105`
                              : score > 0 && val <= score
                              ? 'bg-gray-100 text-gray-500 border-gray-200'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    {/* Scale hint */}
                    <div className="flex justify-between text-xs text-gray-300 mt-1 px-0.5">
                      <span>Poor</span>
                      <span>Perfect</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Next option shortcut */}
            {!isLastOption && filledForOption(activeOption) === criteria.length && (
              <button
                onClick={goToNextOption}
                className="w-full mt-5 py-2.5 border border-blue-200 text-blue-600 rounded-xl
                           text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Next option: {options[currentOptionIndex + 1]?.name} →
              </button>
            )}
          </div>
        )}

        {/* Score overview table */}
        {totalFilled > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4 overflow-x-auto">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
              Score Overview
            </p>
            <table className="w-full text-xs text-gray-700 min-w-max">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Criterion</th>
                  {options.map((o: Option) => (
                    <th key={o.id} className="text-center py-2 px-2 font-medium text-gray-500">
                      {o.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((crit: Criterion) => (
                  <tr key={crit.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium">{crit.name}</td>
                    {options.map((o: Option) => {
                      const s = getScore(o.id, crit.id)
                      return (
                        <td key={o.id} className="text-center py-2 px-2">
                          {s > 0 ? (
                            <span
                              className={`inline-block w-7 h-7 rounded-lg text-white text-xs
                                          font-bold flex items-center justify-center ${SCORE_COLOR[s]}`}
                            >
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
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-xs text-center mb-3">{error}</p>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!allFilled || saving}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm
                     hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calculating results...
            </span>
          ) : allFilled ? (
            'See Results →'
          ) : (
            `${totalNeeded - totalFilled} scores remaining`
          )}
        </button>

        <button
          onClick={() => router.push(`/decision/${id}/options`)}
          className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to Options
        </button>

      </div>
    </main>
  )
}