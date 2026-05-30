'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { addOption } from '@/lib/api'
import { useDecisionStore } from '@/store/decisionStore'

interface Option {
  id: string
  name: string
  description?: string
}

// Example suggestions based on common decision types
const EXAMPLE_OPTIONS: Record<string, string[]> = {
  laptop:   ['MacBook Air M3', 'Dell XPS 15', 'Lenovo ThinkPad X1'],
  city:     ['Mumbai', 'Bangalore', 'Pune'],
  job:      ['Startup Offer', 'MNC Offer', 'Freelance'],
  phone:    ['iPhone 15', 'Samsung S24', 'OnePlus 12'],
  default:  ['Option A', 'Option B', 'Option C'],
}

function getSuggestions(title: string): string[] {
  const t = title?.toLowerCase() ?? ''
  if (t.includes('laptop') || t.includes('macbook') || t.includes('computer'))
    return EXAMPLE_OPTIONS.laptop
  if (t.includes('city') || t.includes('move') || t.includes('relocat'))
    return EXAMPLE_OPTIONS.city
  if (t.includes('job') || t.includes('offer') || t.includes('career'))
    return EXAMPLE_OPTIONS.job
  if (t.includes('phone') || t.includes('mobile'))
    return EXAMPLE_OPTIONS.phone
  return EXAMPLE_OPTIONS.default
}

export default function OptionsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { decisionTitle, setOptions: storeSetOptions } = useDecisionStore()

  const [options, setOptions] = useState<Option[]>([])
  const [inputValue, setInputValue] = useState('')
  const [inputDesc, setInputDesc]   = useState('')
  const [showDesc, setShowDesc]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [savingAll, setSavingAll]   = useState(false)
  const [error, setError]           = useState('')
  const [mounted, setMounted]       = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  if (!mounted) return null

  const suggestions = getSuggestions(decisionTitle ?? '')

  // Add one option to local list (not yet saved to backend)
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

  // Save all options to backend, then navigate to score page
  const handleContinue = async () => {
    if (options.length < 2) {
      setError('Please add at least 2 options to compare.')
      return
    }
    setSavingAll(true)
    setError('')
    try {
      const saved: Option[] = []
      for (const opt of options) {
        const res = await addOption(id, opt.name, opt.description)
        saved.push(res)
      }
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
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
            Step 3 of 4
          </p>
          <h1 className="text-xl font-bold text-gray-900">Add Your Options</h1>
          {decisionTitle && (
            <p className="text-sm text-gray-500 mt-0.5">For: {decisionTitle}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-3/4 transition-all" />
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">

          <label className="block text-sm font-medium text-gray-700 mb-2">
            What are you choosing between?
          </label>

          {/* Main input row */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. MacBook Air M3"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300
                         text-gray-900 placeholder:text-gray-400 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm
                         hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
            >
              + Add
            </button>
          </div>

          {/* Optional description toggle */}
          <button
            onClick={() => setShowDesc((v) => !v)}
            className="text-xs text-gray-400 hover:text-blue-500 mt-2 transition-colors"
          >
            {showDesc ? '− Hide description' : '+ Add description (optional)'}
          </button>

          {showDesc && (
            <textarea
              value={inputDesc}
              onChange={(e) => setInputDesc(e.target.value)}
              placeholder="Short note about this option..."
              rows={2}
              className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300
                         text-gray-900 placeholder:text-gray-400 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          )}

          {error && (
            <p className="text-red-500 text-xs mt-2">{error}</p>
          )}
        </div>

        {/* Suggestions */}
        {options.length < 4 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
              Quick add suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions
                .filter((s) => !options.some((o) => o.name.toLowerCase() === s.toLowerCase()))
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-full
                               text-gray-600 hover:border-blue-400 hover:text-blue-600
                               hover:bg-blue-50 transition-colors bg-white"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Options list */}
        {options.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
              Your options ({options.length})
            </p>
            <ul className="space-y-2">
              {options.map((opt, i) => (
                <li
                  key={opt.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 group"
                >
                  {/* Number badge */}
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700
                                   text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{opt.name}</p>
                    {opt.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{opt.description}</p>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(opt.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg
                               leading-none opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Min options hint */}
        {options.length === 1 && (
          <p className="text-xs text-amber-500 text-center mb-4">
            Add at least one more option to continue
          </p>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={options.length < 2 || savingAll}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm
                     hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
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

        {/* Back link */}
        <button
          onClick={() => router.push(`/decision/${id}/compare`)}
          className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to comparisons
        </button>

      </div>
    </main>
  )
}