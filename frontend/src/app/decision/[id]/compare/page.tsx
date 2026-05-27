"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { saveComparisons, calculateWeights } from "@/lib/api"
import { useDecisionStore } from "@/store/decisionStore"

const SCALE = [
  { label: "Equal",      value: "equal",      score: 1 },
  { label: "Slightly",   value: "slightly",   score: 2 },
  { label: "Moderately", value: "moderately", score: 3 },
  { label: "Strongly",   value: "strongly",   score: 5 },
  { label: "Extremely",  value: "extremely",  score: 7 },
]

function generatePairs(criteria: {id: string, name: string}[]) {
  const pairs = []
  for (let i = 0; i < criteria.length; i++)
    for (let j = i + 1; j < criteria.length; j++)
      pairs.push([criteria[i], criteria[j]])
  return pairs
}

export default function ComparePage() {
  const router = useRouter()
  const params = useParams()
  const decisionId = params.id as string
  const { criteria, nextStep } = useDecisionStore()

  const pairs = generatePairs(criteria)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [selected, setSelected] = useState<{winner: string, preference: string} | null>(null)
  const [loading, setLoading] = useState(false)

  const pair = pairs[current]
  const progress = Math.round((current / pairs.length) * 100)

  const choose = (winnerId: string, preference: string) => {
    setSelected({ winner: winnerId, preference })
  }

  const handleNext = async () => {
    if (!selected) return
    const newAnswer = {
      criterion_a: pair[0].id,
      criterion_b: pair[1].id,
      winner: selected.winner,
      preference: selected.preference,
    }
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)
    setSelected(null)

    if (current + 1 < pairs.length) {
      setCurrent(current + 1)
    } else {
      // All comparisons done — save and calculate
      setLoading(true)
      try {
        await saveComparisons(decisionId, newAnswers)
        await calculateWeights(decisionId)
        nextStep()
        router.push(`/decision/${decisionId}/options`)
      } catch {
        alert("Failed to save comparisons. Check backend is running.")
      } finally {
        setLoading(false)
      }
    }
  }

  if (!criteria.length) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No criteria found. Please start over.</p>
          <button onClick={() => router.push("/")} className="text-blue-600 underline">Go home</button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step 2 of 3 — Comparing factors</span>
            <span>{current + 1} of {pairs.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 text-center">
          <p className="text-sm text-gray-400 mb-6">Which factor matters more to you?</p>

          {/* Two options */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => choose(pair[0].id, selected?.preference || "moderately")}
              className={`flex-1 py-4 px-6 rounded-xl border-2 text-sm font-medium transition-all ${
                selected?.winner === pair[0].id
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {pair[0].name}
            </button>

            <div className="flex items-center text-gray-300 font-light">vs</div>

            <button
              onClick={() => choose(pair[1].id, selected?.preference || "moderately")}
              className={`flex-1 py-4 px-6 rounded-xl border-2 text-sm font-medium transition-all ${
                selected?.winner === pair[1].id
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {pair[1].name}
            </button>
          </div>

          {/* Importance scale — only show after picking a winner */}
          {selected && (
            <div>
              <p className="text-xs text-gray-400 mb-3">How much more important?</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {SCALE.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSelected({ ...selected, preference: s.value })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selected.preference === s.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={!selected || loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          {loading ? "Calculating weights..." : current + 1 < pairs.length ? "Next comparison →" : "Calculate weights →"}
        </button>
      </div>
    </main>
  )
}