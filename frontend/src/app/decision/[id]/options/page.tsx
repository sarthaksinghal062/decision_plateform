"use client"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { saveOptions, saveRatings } from "@/lib/api"
import { useDecisionStore } from "@/store/decisionStore"

export default function OptionsPage() {
  const router = useRouter()
  const params = useParams()
  const decisionId = params.id as string
  const { criteria } = useDecisionStore()

  const [optionNames, setOptionNames] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({})
  const [step, setStep] = useState<"options" | "ratings">("options")
  const [loading, setLoading] = useState(false)

  const addOption = () => {
    const trimmed = input.trim()
    if (!trimmed || optionNames.includes(trimmed)) return
    setOptionNames([...optionNames, trimmed])
    setInput("")
  }

  const removeOption = (name: string) =>
    setOptionNames(optionNames.filter((o) => o !== name))

  const setRating = (option: string, criterionId: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [option]: { ...(prev[option] || {}), [criterionId]: score },
    }))
  }

  const allRated = () =>
    optionNames.every((opt) =>
      criteria.every((c) => ratings[opt]?.[c.id] !== undefined)
    )

  const handleSubmit = async () => {
    if (!allRated()) return alert("Please rate all options for every criterion")
    setLoading(true)
    try {
      const optRes = await saveOptions(decisionId, optionNames)
      const savedOptions = optRes.data

      const ratingsList: object[] = []
      savedOptions.forEach((opt: any) => {
        criteria.forEach((c) => {
          ratingsList.push({
            option_id: opt.id,
            criterion_id: c.id,
            score: ratings[opt.name]?.[c.id] || 5,
          })
        })
      })

      await saveRatings(decisionId, ratingsList)
      router.push(`/decision/${decisionId}/results`)
    } catch {
      alert("Failed to save. Is backend running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl">
        {step === "options" ? (
          <>
            <p className="text-sm text-gray-400 mb-1">Step 3 of 3</p>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">What are your options?</h1>
            <p className="text-gray-500 text-sm mb-6">Add the choices you are deciding between</p>

            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. MacBook Air, Dell XPS..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOption()}
              />
              <button
                onClick={addOption}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            {optionNames.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-400 mb-3">Your options ({optionNames.length})</p>
                <div className="flex flex-col gap-2">
                  {optionNames.map((o) => (
                    <div key={o} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                      <span className="text-sm text-gray-700">{o}</span>
                      <button
                        onClick={() => removeOption(o)}
                        className="text-gray-300 hover:text-red-500 text-lg"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep("ratings")}
              disabled={optionNames.length < 2}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
            >
              {optionNames.length < 2
                ? "Add at least 2 options"
                : `Rate ${optionNames.length} options`}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-1">Step 3 of 3 — Rate each option</p>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Score your options</h1>

            <div className="flex flex-col gap-6">
              {optionNames.map((opt) => (
                <div key={opt} className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="font-medium text-gray-900 mb-4">{opt}</h2>
                  <div className="flex flex-col gap-4">
                    {criteria.map((c) => (
                      <div key={c.id}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">{c.name}</span>
                          <span className="text-sm font-medium text-blue-600">
                            {ratings[opt]?.[c.id] ?? 5}/10
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          step={1}
                          value={ratings[opt]?.[c.id] ?? 5}
                          onChange={(e) =>
                            setRating(opt, c.id, Number(e.target.value))
                          }
                          className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                          <span>Poor</span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
            >
              {loading ? "Calculating results..." : "See results"}
            </button>
          </>
        )}
      </div>
    </main>
  )
}