"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import { saveCriteria, getDecision } from "@/lib/api"
import { useDecisionStore } from "@/store/decisionStore"

const SUGGESTIONS = ["Price", "Performance", "Battery", "Display", "Portability", "Brand", "Warranty", "Design"]

export default function CriteriaPage() {
  const router = useRouter()
  const params = useParams()
  const decisionId = params.id as string
  const { decisionTitle, setCriteria, setDecision } = useDecisionStore()

  const [criteriaNames, setCriteriaNames] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!decisionId) {
      router.push("/")
      return
    }

    getDecision(decisionId)
      .then((decision) => {
        setDecision(decision.id, decision.title)
        setReady(true)
      })
      .catch((err) => {
        console.error("[Criteria] Decision lookup failed:", { decisionId, err })
        alert("This decision was not found. Please start a new one from the homepage.")
        router.push("/")
      })
  }, [decisionId, router, setDecision])

  const addCriterion = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || criteriaNames.includes(trimmed)) return
    setCriteriaNames([...criteriaNames, trimmed])
    setInput("")
  }

  const remove = (name: string) =>
    setCriteriaNames(criteriaNames.filter((c) => c !== name))

  const handleNext = async () => {
    if (!ready) return
    if (criteriaNames.length < 2) return alert("Add at least 2 criteria")
    setLoading(true)
    try {
      const criteria = await saveCriteria(decisionId, criteriaNames)
      setCriteria(criteria)
      router.push(`/decision/${decisionId}/compare`)
    } catch (err) {
      console.error("[Criteria] Save failed:", { decisionId, err })
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        alert("Decision not found. Please start a new decision from the homepage.")
        router.push("/")
        return
      }
      alert("Failed to save criteria. Check the browser console for details.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-lg">
        <p className="text-sm text-gray-400 mb-1">Step 1 of 3</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">What factors matter?</h1>
        <p className="text-gray-500 text-sm mb-6">For: <span className="font-medium text-gray-700">{decisionTitle}</span></p>

        {/* Input */}
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Battery life"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCriterion(input)}
          />
          <button
            onClick={() => addCriterion(input)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SUGGESTIONS.filter((s) => !criteriaNames.includes(s)).map((s) => (
            <button
              key={s}
              onClick={() => addCriterion(s)}
              className="text-xs border border-gray-300 rounded-full px-3 py-1 text-gray-600 hover:border-blue-400 hover:text-blue-600"
            >
              + {s}
            </button>
          ))}
        </div>

        {/* Added criteria */}
        {criteriaNames.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-400 mb-3">Your criteria ({criteriaNames.length})</p>
            <div className="flex flex-wrap gap-2">
              {criteriaNames.map((c, i) => (
                <span
                  key={c}
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-sm rounded-full px-3 py-1"
                >
                  {i + 1}. {c}
                  <button onClick={() => remove(c)} className="ml-1 text-blue-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!ready || criteriaNames.length < 2 || loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          {loading ? "Saving..." : `Continue with ${criteriaNames.length} criteria →`}
        </button>
      </div>
    </main>
  )
}