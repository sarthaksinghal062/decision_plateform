// frontend/src/app/decision/[id]/compare/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { saveComparisons, calculateWeights } from '@/lib/api'
import { useDecisionStore } from '@/store/decisionStore'

// AHP preference levels
const PREFERENCES = [
  { label: 'Extremely', value: 'extremely', scale: 7 },
  { label: 'Strongly',  value: 'strongly',  scale: 5 },
  { label: 'Moderately', value: 'moderately', scale: 3 },
  { label: 'Slightly',  value: 'slightly',  scale: 2 },
  { label: 'Equal',     value: 'equal',     scale: 1 },
  { label: 'Slightly',  value: 'slightly',  scale: 2 },
  { label: 'Moderately', value: 'moderately', scale: 3 },
  { label: 'Strongly',  value: 'strongly',  scale: 5 },
  { label: 'Extremely', value: 'extremely', scale: 7 },
]

interface Criterion {
  id: string
  name: string
}

interface PairComparison {
  criterion_a: string
  criterion_b: string
  winner: string
  preference: string
}

// Generate all unique pairs from criteria list
function generatePairs(criteria: Criterion[]) {
  const pairs: [Criterion, Criterion][] = []
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      pairs.push([criteria[i], criteria[j]])
    }
  }
  return pairs
}

export default function ComparePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  // Pull criteria from Zustand store (saved in Step 1)
  const { criteria, decisionTitle, setComparisons: storeSetComparisons } = useDecisionStore()

  const [pairs, setPairs] = useState<[Criterion, Criterion][]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<PairComparison[]>([])

  // Selected state for current pair: { winner: id, preference: string } | null
  const [selected, setSelected] = useState<{
    winner: string
    preference: string
    side: 'left' | 'right' | 'equal'
  } | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (criteria && criteria.length >= 2) {
      setPairs(generatePairs(criteria))
    }
  }, [criteria])

  if (!criteria || criteria.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No criteria found. Please go back and add criteria first.</p>
          <button
            onClick={() => router.push(`/decision/${id}/criteria`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            ← Back to Criteria
          </button>
        </div>
      </div>
    )
  }

  const totalPairs = pairs.length
  const currentPair = pairs[currentIndex]
  const progress = totalPairs > 0 ? Math.round((currentIndex / totalPairs) * 100) : 0
  const isLast = currentIndex === totalPairs - 1

  const handleSelect = (side: 'left' | 'right' | 'equal', preference: string) => {
    if (!currentPair) return
    const [a, b] = currentPair
    const winner = side === 'left' ? a.id : side === 'right' ? b.id : a.id
    setSelected({ winner, preference, side })
  }

  const handleNext = () => {
    if (!selected || !currentPair) return
    const [a, b] = currentPair

    const entry: PairComparison = {
      criterion_a: a.id,
      criterion_b: b.id,
      winner: selected.side === 'equal' ? a.id : selected.winner,
      preference: selected.preference,
    }

    const newAnswers = [...answers, entry]
    setAnswers(newAnswers)
    setSelected(null)

    if (!isLast) {
      setCurrentIndex((i) => i + 1)
    } else {
      handleSubmit(newAnswers)
    }
  }

  const handleSubmit = async (finalAnswers: PairComparison[]) => {
    setSaving(true)
    setError('')
    try {
      await saveComparisons(id, finalAnswers)
      const weights = await calculateWeights(id)
      storeSetComparisons(finalAnswers, weights)
      router.push(`/decision/${id}/options`)
    } catch (e) {
      console.error(e)
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  if (saving) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Calculating weights with AHP...</p>
          <p className="text-gray-400 text-sm mt-1">This takes just a second</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Step 2 of 4</p>
          <h1 className="text-xl font-bold text-gray-900">Compare Factors</h1>
          {decisionTitle && (
            <p className="text-sm text-gray-500 mt-0.5">For: {decisionTitle}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Comparison {currentIndex + 1} of {totalPairs}</span>
            <span>{progress}% done</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pairwise Card */}
        {currentPair && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            
            {/* Question */}
            <p className="text-center text-sm text-gray-500 mb-5">
              Which factor matters <span className="font-semibold text-gray-700">more</span> to you?
            </p>

            {/* Two options side by side */}
            <div className="flex items-center gap-3 mb-6">
              {/* Left criterion */}
              <button
                onClick={() => {
                  // Clicking a criterion selects it with "moderately" default
                  if (selected?.side === 'left') return
                  setSelected({
                    winner: currentPair[0].id,
                    preference: 'moderately',
                    side: 'left',
                  })
                }}
                className={`flex-1 py-4 px-3 rounded-xl border-2 text-center font-semibold text-sm transition-all ${
                  selected?.side === 'left'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {currentPair[0].name}
              </button>

              {/* Equal button */}
              <button
                onClick={() => handleSelect('equal', 'equal')}
                className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                  selected?.side === 'equal'
                    ? 'border-gray-500 bg-gray-100 text-gray-700'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                Equal
              </button>

              {/* Right criterion */}
              <button
                onClick={() => {
                  if (selected?.side === 'right') return
                  setSelected({
                    winner: currentPair[1].id,
                    preference: 'moderately',
                    side: 'right',
                  })
                }}
                className={`flex-1 py-4 px-3 rounded-xl border-2 text-center font-semibold text-sm transition-all ${
                  selected?.side === 'right'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {currentPair[1].name}
              </button>
            </div>

            {/* Strength slider — only show when left or right selected (not equal) */}
            {selected && selected.side !== 'equal' && (
              <div className="mb-6">
                <p className="text-xs text-gray-400 text-center mb-3">
                  How much more important is{' '}
                  <span className="font-semibold text-gray-600">
                    {selected.side === 'left' ? currentPair[0].name : currentPair[1].name}
                  </span>?
                </p>

                {/* Preference buttons grid */}
                <div className="grid grid-cols-4 gap-2">
                  {(['slightly', 'moderately', 'strongly', 'extremely'] as const).map((pref) => (
                    <button
                      key={pref}
                      onClick={() =>
                        setSelected((s) => s ? { ...s, preference: pref } : s)
                      }
                      className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all capitalize ${
                        selected?.preference === pref
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>

                {/* AHP Scale hint */}
                <p className="text-center text-xs text-gray-300 mt-2">
                  slightly = 2× · moderately = 3× · strongly = 5× · extremely = 7×
                </p>
              </div>
            )}

            {/* Summary sentence */}
            {selected && (
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-center text-sm text-gray-600 mb-5">
                {selected.side === 'equal' ? (
                  <>
                    <span className="font-medium text-gray-800">{currentPair[0].name}</span>
                    {' and '}
                    <span className="font-medium text-gray-800">{currentPair[1].name}</span>
                    {' are equally important'}
                  </>
                ) : (
                  <>
                    <span className="font-medium text-gray-800">
                      {selected.side === 'left' ? currentPair[0].name : currentPair[1].name}
                    </span>
                    {' is '}
                    <span className="font-medium text-blue-600 capitalize">{selected.preference}</span>
                    {' more important than '}
                    <span className="font-medium text-gray-800">
                      {selected.side === 'left' ? currentPair[1].name : currentPair[0].name}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Next / Finish button */}
            <button
              onClick={handleNext}
              disabled={!selected}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium
                         hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors text-sm"
            >
              {isLast ? 'Calculate Weights →' : 'Next Comparison →'}
            </button>

            {error && (
              <p className="text-red-500 text-xs text-center mt-3">{error}</p>
            )}
          </div>
        )}

        {/* Criteria reminder */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {criteria.map((c: Criterion) => (
            <span
              key={c.id}
              className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-500"
            >
              {c.name}
            </span>
          ))}
        </div>

      </div>
    </main>
  )
}