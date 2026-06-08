'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { saveOptions } from '@/lib/api'
import { useDecisionStore } from '@/store/decisionStore'

interface Option {
  id: string
  name: string
  description?: string
}

// ── Suggestions & contextual placeholders by decision type ─────────────────────
const DECISION_TYPES: Array<{
  keywords: string[]
  suggestions: string[]
  placeholder: string
}> = [
  {
    keywords: ['laptop', 'macbook', 'computer', 'pc', 'notebook'],
    suggestions: ['MacBook Air M3', 'Dell XPS 15', 'Lenovo ThinkPad X1'],
    placeholder: 'e.g. MacBook Air M3',
  },
  {
    keywords: ['mba', 'college', 'university', 'school', 'campus', 'course', 'degree', 'admission', 'institute'],
    suggestions: ['IIM Ahmedabad', 'IIM Bangalore', 'ISB Hyderabad', 'IIM Calcutta'],
    placeholder: 'e.g. IIM Ahmedabad',
  },
  {
    keywords: ['city', 'move', 'relocat', 'live', 'settle'],
    suggestions: ['Mumbai', 'Bangalore', 'Pune', 'Hyderabad'],
    placeholder: 'e.g. Mumbai',
  },
  {
    keywords: ['job', 'offer', 'career', 'work', 'company', 'role', 'position'],
    suggestions: ['Startup Offer', 'MNC Offer', 'Remote Role', 'Freelance'],
    placeholder: 'e.g. Startup Offer',
  },
  {
    keywords: ['phone', 'mobile', 'smartphone', 'iphone', 'android'],
    suggestions: ['iPhone 15 Pro', 'Samsung Galaxy S24', 'OnePlus 12', 'Pixel 8'],
    placeholder: 'e.g. iPhone 15 Pro',
  },
  {
    keywords: ['car', 'vehicle', 'bike', 'suv', 'sedan', 'buy car'],
    suggestions: ['Maruti Swift', 'Hyundai Creta', 'Tata Nexon', 'Honda City'],
    placeholder: 'e.g. Hyundai Creta',
  },
  {
    keywords: ['house', 'flat', 'apartment', 'rent', 'property', 'home'],
    suggestions: ['2BHK Koramangala', '3BHK Whitefield', 'Studio HSR Layout'],
    placeholder: 'e.g. 2BHK in Koramangala',
  },
  {
    keywords: ['food', 'restaurant', 'eat', 'cuisine', 'dish', 'meal'],
    suggestions: ['Pizza', 'Biryani', 'Sushi', 'Pasta'],
    placeholder: 'e.g. Biryani',
  },
  {
    keywords: ['vacation', 'travel', 'trip', 'holiday', 'destination', 'visit'],
    suggestions: ['Goa', 'Manali', 'Bali', 'Paris'],
    placeholder: 'e.g. Goa',
  },
  {
    keywords: ['country', 'abroad', 'immigrat', 'visa', 'settle abroad'],
    suggestions: ['Canada', 'Germany', 'Australia', 'Netherlands'],
    placeholder: 'e.g. Canada',
  },
  {
    keywords: ['cloud', 'hosting', 'server', 'platform', 'saas', 'tool', 'software'],
    suggestions: ['AWS', 'Google Cloud', 'Azure', 'Vercel'],
    placeholder: 'e.g. AWS',
  },
  {
    keywords: ['invest', 'stock', 'fund', 'crypto', 'asset', 'mutual fund'],
    suggestions: ['Index Fund', 'Gold ETF', 'Fixed Deposit', 'Real Estate'],
    placeholder: 'e.g. Index Fund',
  },
  {
    keywords: ['camera', 'dslr', 'mirrorless', 'lens', 'photography'],
    suggestions: ['Sony A7C', 'Canon R50', 'Fujifilm X-T5', 'Nikon Z30'],
    placeholder: 'e.g. Sony A7C',
  },
  {
    keywords: ['watch', 'smartwatch', 'wearable'],
    suggestions: ['Apple Watch Series 9', 'Samsung Galaxy Watch 6', 'Garmin Fenix'],
    placeholder: 'e.g. Apple Watch Series 9',
  },
  {
    keywords: ['headphone', 'earphone', 'earbud', 'speaker', 'audio'],
    suggestions: ['Sony WH-1000XM5', 'AirPods Pro', 'Bose QC45'],
    placeholder: 'e.g. Sony WH-1000XM5',
  },
]

const DEFAULT_TYPE = {
  suggestions: ['Option A', 'Option B', 'Option C'],
  placeholder: 'e.g. Option A',
}

function getDecisionType(title: string) {
  const t = (title ?? '').toLowerCase()
  return DECISION_TYPES.find((type) => type.keywords.some((kw) => t.includes(kw))) ?? DEFAULT_TYPE
}


export default function OptionsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { decisionTitle, setOptions: storeSetOptions } = useDecisionStore()

  const [options, setOptions] = useState<Option[]>([])
  const [inputValue, setInputValue] = useState('')
  const [inputDesc, setInputDesc]   = useState('')
  const [showDesc, setShowDesc]     = useState(false)
  const [savingAll, setSavingAll]   = useState(false)
  const [error, setError]           = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const { suggestions, placeholder } = getDecisionType(decisionTitle ?? '')

  const handleAdd = () => {
    const name = inputValue.trim()
    if (!name) return
    if (options.some((o) => o.name.toLowerCase() === name.toLowerCase())) {
      setError('This option already exists.')
      return
    }
    setOptions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, description: inputDesc.trim() || undefined },
    ])
    setInputValue('')
    setInputDesc('')
    setShowDesc(false)
    setError('')
    inputRef.current?.focus()
  }

  const handleRemove = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  const handleSuggestion = (s: string) => {
    if (options.some((o) => o.name.toLowerCase() === s.toLowerCase())) return
    setOptions((prev) => [...prev, { id: crypto.randomUUID(), name: s }])
  }

  const handleContinue = async () => {
    if (options.length < 2) {
      setError('Please add at least 2 options to compare.')
      return
    }
    setSavingAll(true)
    setError('')
    try {
      const saved: Option[] = await saveOptions(id, options.map((o) => o.name))
      storeSetOptions(saved)
      router.push(`/decision/${id}/score`)
    } catch (e) {
      console.error(e)
      setError('Failed to save options. Please try again.')
    } finally {
      setSavingAll(false)
    }
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <div className="card p-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-1">STEP 3 • OPTIONS</p>
          <h1 className="text-3xl font-semibold tracking-tight">What are your choices?</h1>
          {decisionTitle && (
            <p className="text-[var(--text-2)] mt-2">For: {decisionTitle}</p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full w-3/4 transition-all" />
          </div>
        </div>

        {/* Add Option Card */}
        <div className="card p-6 mb-8 bg-[var(--surface-2)]">

          <label className="block text-sm font-medium text-[var(--text-2)] mb-3">
            Add an option
          </label>

          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={placeholder}
              className="flex-1 px-5 py-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl 
                         text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--accent)] outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              className="btn-primary px-8 rounded-2xl whitespace-nowrap disabled:opacity-50"
            >
              + Add
            </button>
          </div>

          {/* Description toggle */}
          <button
            onClick={() => setShowDesc((v) => !v)}
            className="text-xs text-[var(--text-3)] hover:text-[var(--accent)] mt-3 transition-colors"
          >
            {showDesc ? '− Hide description' : '+ Add description (optional)'}
          </button>

          {showDesc && (
            <textarea
              value={inputDesc}
              onChange={(e) => setInputDesc(e.target.value)}
              placeholder="Short note about this option..."
              rows={2}
              className="w-full mt-3 px-5 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl 
                         text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--accent)] outline-none resize-none"
            />
          )}

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* Suggestions */}
        {options.length < 4 && suggestions.length > 0 && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-3">
              Quick suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions
                .filter((s) => !options.some((o) => o.name.toLowerCase() === s.toLowerCase()))
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="text-sm border border-[var(--border)] hover:border-[var(--accent)] 
                               hover:text-[var(--accent)] px-4 py-2 rounded-2xl transition-colors"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Added Options */}
        {options.length > 0 && (
          <div className="card p-6 mb-8 bg-[var(--surface-2)]">
            <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-4">
              YOUR OPTIONS ({options.length})
            </p>
            <ul className="space-y-3">
              {options.map((opt, i) => (
                <li
                  key={opt.id}
                  className="flex items-start gap-4 p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] group"
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] 
                                   text-sm font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-1)] truncate">{opt.name}</p>
                    {opt.description && (
                      <p className="text-[var(--text-3)] text-sm mt-1 truncate">{opt.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemove(opt.id)}
                    className="text-xl leading-none text-[var(--text-3)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {options.length === 1 && (
          <p className="text-amber-400 text-center text-sm mb-4">Add at least one more option to continue</p>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={options.length < 2 || savingAll}
          className="w-full btn-primary py-4 rounded-2xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {savingAll ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving options...
            </span>
          ) : (
            `Continue with ${options.length} option${options.length !== 1 ? 's' : ''} →`
          )}
        </button>

        <button
          onClick={() => router.push(`/decision/${id}/compare`)}
          className="w-full mt-4 py-3 text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
        >
          ← Back to comparisons
        </button>
      </div>
    </main>
  )
}