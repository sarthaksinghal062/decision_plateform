"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createDecision } from "@/lib/api"
import { useDecisionStore } from "@/store/decisionStore"

export default function Home() {
  const router = useRouter()
  const { setDecisionId, setTitle } = useDecisionStore()
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      const res = await createDecision(input.trim())
      setDecisionId(res.data.id)
      setTitle(input.trim())
      router.push(`/decision/${res.data.id}/criteria`)
    } catch (e) {
      alert("Could not connect to backend. Is it running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <h1 className="text-3xl font-semibold mb-2 text-gray-900">Decision Intelligence</h1>
      <p className="text-gray-500 mb-8">Make better decisions using structured analysis</p>

      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm text-gray-600 mb-2">What decision are you trying to make?</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder='e.g. "Best laptop under ₹80,000"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
        />
        <button
          onClick={handleStart}
          disabled={loading || !input.trim()}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Starting..." : "Start Analysis →"}
        </button>
      </div>
    </main>
  )
}