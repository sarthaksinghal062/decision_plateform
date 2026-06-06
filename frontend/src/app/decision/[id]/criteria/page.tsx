"use client"
import { useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { saveCriteria } from "@/lib/api"
import { useDecisionStore } from "@/store/decisionStore"

// ─── Suggestion Engine ────────────────────────────────────────────────────────
// Each entry: [keywords[], suggestions[]]
// First match wins; fallback at the end.

const CRITERIA_MAP: [string[], string[]][] = [
  // City / relocation
  [
    ["city", "move", "relocat", "live", "settle", "town", "place to"],
    ["Cost of Living", "Safety", "Job Market", "Weather", "Lifestyle", "Transport", "Rent", "Healthcare", "Community", "Air Quality"],
  ],
  // Job / career
  [
    ["job", "offer", "career", "role", "position", "work", "employ", "company", "startup", "firm"],
    ["Salary", "Work-Life Balance", "Growth Potential", "Remote Work", "Company Culture", "Benefits", "Job Stability", "Location", "Learning Opportunities", "Team"],
  ],
  // University / college / school
  [
    ["college", "university", "school", "degree", "study", "educat", "course", "program"],
    ["Reputation", "Cost / Fees", "Location", "Campus Life", "Career Placement", "Faculty Quality", "Scholarships", "Research Opportunities", "Class Size", "Specializations"],
  ],
  // Phone / mobile
  [
    ["phone", "mobile", "smartphone", "iphone", "android", "samsung", "pixel"],
    ["Camera Quality", "Battery Life", "Performance", "Price", "Display", "Storage", "Brand", "Software Support", "Durability", "Design"],
  ],
  // Laptop / computer
  [
    ["laptop", "macbook", "computer", "pc", "notebook", "chromebook"],
    ["Performance", "Battery Life", "Price", "Display Quality", "Portability", "Build Quality", "Brand", "Keyboard", "Storage", "RAM"],
  ],
  // Car / vehicle
  [
    ["car", "vehicle", "suv", "truck", "electric", "ev", "bike", "motorcycle"],
    ["Price", "Fuel Efficiency", "Safety Rating", "Reliability", "Comfort", "Performance", "Maintenance Cost", "Resale Value", "Features", "Brand"],
  ],
  // House / apartment / property
  [
    ["house", "apartment", "flat", "property", "home", "rent", "buy", "purchase"],
    ["Price", "Location", "Size", "Safety", "Commute", "Amenities", "Natural Light", "Parking", "Neighbourhood", "Condition"],
  ],
  // Travel / vacation / trip
  [
    ["travel", "vacation", "holiday", "trip", "visit", "destination", "tour"],
    ["Cost", "Weather", "Safety", "Attractions", "Food & Culture", "Accessibility", "Accommodation", "Visa Requirements", "Language Barrier", "Activities"],
  ],
  // Investment / stock / crypto / finance
  [
    ["invest", "stock", "crypto", "fund", "portfolio", "finance", "saving", "return", "asset"],
    ["Returns", "Risk Level", "Liquidity", "Diversification", "Market Volatility", "Fees", "Time Horizon", "Tax Implications", "Reputation", "Transparency"],
  ],
  // Software / tool / app / platform
  [
    ["software", "tool", "app", "platform", "saas", "framework", "library", "service", "subscription"],
    ["Features", "Ease of Use", "Price", "Performance", "Support", "Integrations", "Security", "Scalability", "Documentation", "Community"],
  ],
  // Restaurant / food / dining
  [
    ["restaurant", "food", "cafe", "dining", "eat", "cuisine"],
    ["Food Quality", "Price", "Location", "Service", "Ambiance", "Menu Variety", "Hygiene", "Wait Time", "Portions", "Parking"],
  ],
  // Partner / relationship (handled gently)
  [
    ["partner", "relationship", "marry", "marriage", "date"],
    ["Compatibility", "Values Alignment", "Communication", "Trust", "Support", "Goals", "Family", "Emotional Intelligence", "Stability", "Shared Interests"],
  ],
]

const FALLBACK_SUGGESTIONS = [
  "Quality", "Cost", "Ease of Use", "Reliability", "Time", "Support", "Flexibility", "Impact", "Risk", "Scalability",
]

function getSuggestions(title: string): string[] {
  const t = title.toLowerCase()
  for (const [keywords, suggestions] of CRITERIA_MAP) {
    if (keywords.some((kw) => t.includes(kw))) {
      return suggestions
    }
  }
  return FALLBACK_SUGGESTIONS
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CriteriaPage() {
  const router = useRouter()
  const params = useParams()
  const decisionId = params.id as string
  const { decisionTitle, setCriteria } = useDecisionStore()

  const [criteriaNames, setCriteriaNames] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  // Recompute suggestions only when title changes
  const suggestions = useMemo(
    () => getSuggestions(decisionTitle ?? ""),
    [decisionTitle]
  )

  const addCriterion = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || criteriaNames.includes(trimmed)) return
    setCriteriaNames([...criteriaNames, trimmed])
    setInput("")
  }

  const remove = (name: string) =>
    setCriteriaNames(criteriaNames.filter((c) => c !== name))

  const handleNext = async () => {
    if (criteriaNames.length < 2) return alert("Add at least 2 criteria")
    setLoading(true)
    try {
      const res = await saveCriteria(decisionId, criteriaNames)
      setCriteria(res)
      router.push(`/decision/${decisionId}/compare`)
    } catch {
      alert("Failed to save criteria. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  const visibleSuggestions = suggestions.filter((s) => !criteriaNames.includes(s))

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-lg">
        <p className="text-sm text-gray-400 mb-1">Step 1 of 3</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">What factors matter?</h1>
        <p className="text-gray-500 text-sm mb-6">
          For: <span className="font-medium text-gray-700">{decisionTitle}</span>
        </p>

        {/* Input */}
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Cost of Living"
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

        {/* Dynamic suggestions */}
        {visibleSuggestions.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
              Suggested for your decision
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => addCriterion(s)}
                  className="text-xs border border-gray-300 rounded-full px-3 py-1 text-gray-600
                             hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors bg-white"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

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
          disabled={criteriaNames.length < 2 || loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          {loading ? "Saving..." : `Continue with ${criteriaNames.length} criteria →`}
        </button>
      </div>
    </main>
  )
}
