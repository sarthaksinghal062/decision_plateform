// frontend/src/app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDecision } from '@/lib/api'
import { useDecisionStore } from '@/store/decisionStore'

const SUGGESTIONS = [
  'Best laptop under ₹80,000',
  'Which city to move to',
  'Best job offer to accept',
]

export default function HomePage() {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setDecision = useDecisionStore((s) => s.setDecision)

  const handleStart = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const decision = await createDecision(title.trim())
      setDecision(decision)
      router.push(`/decision/${decision.id}/criteria`)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Decision Helper
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Make better decisions with structured thinking
        </p>

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
              // ✅ KEY FIX: explicit text + bg colors
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
              {loading ? '...' : 'Start →'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setTitle(s)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-full 
                           text-gray-600 hover:border-blue-400 hover:text-blue-600
                           transition-colors bg-white"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}