"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createDecision } from "@/lib/api"
import { useDecisionStore } from "@/store/decisionStore"
import axios from "axios"

interface DecisionSummary {
  id: string
  title: string
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:      { label: "Draft",      color: "bg-gray-100 text-gray-600" },
  comparing:  { label: "Comparing",  color: "bg-blue-50 text-blue-600" },
  rating:     { label: "Rating",     color: "bg-amber-50 text-amber-600" },
  complete:   { label: "Complete",   color: "bg-green-50 text-green-600" },
}

const STATUS_NEXT_ROUTE: Record<string, string> = {
  draft:     "criteria",
  comparing: "compare",
  rating:    "options",
  complete:  "results",
}

export default function HomePage() {
  const router = useRouter()
  const { setDecisionId, setTitle, reset } = useDecisionStore()
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [decisions, setDecisions] = useState<DecisionSummary[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000" })
    api.get("/api/decisions")
      .then((res) => setDecisions(res.data))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [])

  const handleStart = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      reset()
      const res = await createDecision(input.trim())
      setDecisionId(res.data.id)
      setTitle(input.trim())
      router.push(`/decision/${res.data.id}/criteria`)
    } catch {
      alert("Could not connect to backend. Is it running?")
    } finally {
      setLoading(false)
    }
  }

  const resumeDecision = (d: DecisionSummary) => {
    setDecisionId(d.id)
    setTitle(d.title)
    const route = STATUS_NEXT_ROUTE[d.status] || "results"
    router.push(`/decision/${d.id}/${route}`)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Make better decisions
          </h1>
          <p className="text-gray-500 text-lg">
            Structured analysis using weighted scoring — no more guessing.
          </p>
        </div>

        {/* New decision input */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What decision are you trying to make?
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder='e.g. "Best laptop under ₹80,000"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
            <button
              onClick={handleStart}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {loading ? "Starting..." : "Start →"}
            </button>
          </div>

          {/* Example suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {["Best laptop under ₹80,000", "Which city to move to", "Best job offer to accept"].map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Past decisions */}
        {!fetching && decisions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Recent Decisions
            </h2>
            <div className="space-y-3">
              {decisions.map((d) => {
                const status = STATUS_LABELS[d.status] || STATUS_LABELS.draft
                return (
                  <div
                    key={d.id}
                    onClick={() => resumeDecision(d)}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {d.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(d.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-gray-300 group-hover:text-blue-400 transition-colors">→</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {fetching && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {!fetching && decisions.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No decisions yet. Create your first one above.
          </div>
        )}
      </div>
    </main>
  )
}
