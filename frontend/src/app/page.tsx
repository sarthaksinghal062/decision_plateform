// frontend/src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDecision } from '@/lib/api'
import { useDecisionStore } from '@/store/decisionStore'
import { useSearchParams } from "next/navigation"

const SUGGESTIONS = [
  'Best laptop under ₹80,000',
  'Which city to move to',
  'Best job offer to accept',
]

const STEP_ROUTES: Record<number, (id: string) => string> = {
  1: (id) => `/decision/${id}/criteria`,
  2: (id) => `/decision/${id}/compare`,
  3: (id) => `/decision/${id}/options`,
  4: (id) => `/decision/${id}/score`,
  5: (id) => `/decision/${id}/results`,
}

export default function HomePage() {
  const [title,   setTitle]   = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const { decisionId, decisionTitle, step, reset, setDecision, setCriteria,
          setComparisons, setOptions, setScores, setResults } = useDecisionStore()

  useEffect(() => { setMounted(true) }, [])

  const hasResumable = mounted && !!decisionId && step > 1 && step < 5

  const handleStart = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      reset()   // clear previous state
      const decision = await createDecision(title.trim())
      setDecision(decision.id, decision.title)
      router.push(`/decision/${decision.id}/criteria`)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleResume = () => {
    if (!decisionId) return
    const route = STEP_ROUTES[step]?.(decisionId) ?? '/'
    router.push(route)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">

        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Make Better Decisions
          </h1>
          <p className="text-gray-500 text-sm">
            Structured, math-backed choices using the same framework used by<br />
            governments, researchers, and Fortune 500 companies.
          </p>
        </div>

        {/* Resume banner — only shows if in-progress decision exists */}
        {hasResumable && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4
                          flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">
                In Progress — Step {step} of 4
              </p>
              <p className="text-sm font-medium text-gray-800 truncate">
                {decisionTitle}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { reset(); }}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleResume}
                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs
                           font-medium hover:bg-amber-600 transition-colors"
              >
                Resume →
              </button>
            </div>
          </div>
        )}

        {/* Main input card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What decision are you trying to make?
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              placeholder="e.g. Best laptop under ₹80,000"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300
                         text-gray-900 placeholder:text-gray-400 bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-blue-500 text-sm"
            />
            <button
              onClick={handleStart}
              disabled={!title.trim() || loading}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg font-medium
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors text-sm whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent
                                   rounded-full animate-spin" />
                  Starting...
                </span>
              ) : 'Start →'}
            </button>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setTitle(s)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-full
                           text-gray-600 hover:border-blue-400 hover:text-blue-600
                           hover:bg-blue-50 transition-colors bg-white"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Steps preview */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[
            { n: 1, label: 'Criteria',  icon: '📋' },
            { n: 2, label: 'Compare',   icon: '⚖️' },
            { n: 3, label: 'Options',   icon: '🗂️' },
            { n: 4, label: 'Score',     icon: '🎯' },
          ].map((s) => (
            <div key={s.n} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-lg mb-1">{s.icon}</div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}