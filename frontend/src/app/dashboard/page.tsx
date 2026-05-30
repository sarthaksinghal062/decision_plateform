// frontend/src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllDecisions, deleteDecision } from '@/lib/api'

interface Decision {
  id: string
  title: string
  status: 'draft' | 'comparing' | 'rating' | 'complete'
  created_at: string
  options_count?: number
  criteria_count?: number
  winner?: string
  winner_score?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record
  Decision['status'],
  { label: string; color: string; bg: string; step: number }
> = {
  draft:     { label: 'Draft',       color: 'text-gray-500',  bg: 'bg-gray-100',  step: 1 },
  comparing: { label: 'Comparing',   color: 'text-amber-700', bg: 'bg-amber-100', step: 2 },
  rating:    { label: 'Rating',      color: 'text-blue-700',  bg: 'bg-blue-100',  step: 3 },
  complete:  { label: 'Complete ✓',  color: 'text-green-700', bg: 'bg-green-100', step: 4 },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0)  return `${mins}m ago`
  return 'Just now'
}

function resumeRoute(d: Decision): string {
  switch (d.status) {
    case 'draft':     return `/decision/${d.id}/criteria`
    case 'comparing': return `/decision/${d.id}/compare`
    case 'rating':    return `/decision/${d.id}/score`
    case 'complete':  return `/decision/${d.id}/results`
    default:          return `/decision/${d.id}/criteria`
  }
}

// ─── Decision Card ────────────────────────────────────────────────────────────

function DecisionCard({
  decision,
  onDelete,
}: {
  decision: Decision
  onDelete: (id: string) => void
}) {
  const router   = useRouter()
  const cfg      = STATUS_CONFIG[decision.status] ?? STATUS_CONFIG.draft
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    try {
      await deleteDecision(decision.id)
      onDelete(decision.id)
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5
                    hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-3">

        {/* Left content */}
        <div className="flex-1 min-w-0">
          {/* Status badge */}
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full
                            mb-2 ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
            {decision.title}
          </h3>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{timeAgo(decision.created_at)}</span>
            {decision.criteria_count != null && (
              <span>{decision.criteria_count} factors</span>
            )}
            {decision.options_count != null && (
              <span>{decision.options_count} options</span>
            )}
          </div>

          {/* Winner line for complete decisions */}
          {decision.status === 'complete' && decision.winner && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-base">🏆</span>
              <span className="text-xs font-medium text-gray-700">{decision.winner}</span>
              {decision.winner_score != null && (
                <span className="text-xs text-gray-400">
                  · {decision.winner_score.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Main CTA */}
          <button
            onClick={() => router.push(resumeRoute(decision))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              decision.status === 'complete'
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {decision.status === 'complete' ? 'View Results' : 'Continue →'}
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`text-xs transition-colors ${
              confirming
                ? 'text-red-500 font-medium'
                : 'text-gray-300 hover:text-red-400'
            }`}
          >
            {deleting ? '...' : confirming ? 'Confirm delete?' : 'Delete'}
          </button>

          {confirming && !deleting && (
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-gray-300 hover:text-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for in-progress decisions */}
      {decision.status !== 'complete' && (
        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all"
            style={{ width: `${(cfg.step / 4) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  const router = useRouter()
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center
                      mx-auto mb-4">
        <span className="text-3xl">🧭</span>
      </div>
      <h2 className="text-gray-900 font-semibold mb-1">No decisions yet</h2>
      <p className="text-gray-400 text-sm mb-6">
        Start your first structured decision — it only takes a few minutes.
      </p>
      <button
        onClick={() => router.push('/')}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium
                   hover:bg-blue-700 transition-colors"
      >
        + Start a Decision
      </button>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
      <div className="h-5 bg-gray-100 rounded w-16 mb-3" />
      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<Decision['status'] | 'all'>('all')

  useEffect(() => {
    getAllDecisions()
      .then(setDecisions)
      .catch(() => setError('Failed to load decisions.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = (id: string) => {
    setDecisions((prev) => prev.filter((d) => d.id !== id))
  }

  // Filter + search
  const filtered = decisions.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || d.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all:      decisions.length,
    complete: decisions.filter((d) => d.status === 'complete').length,
    draft:    decisions.filter((d) => d.status === 'draft').length,
    comparing:decisions.filter((d) => d.status === 'comparing').length,
    rating:   decisions.filter((d) => d.status === 'rating').length,
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {decisions.length} decision{decisions.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium
                       hover:bg-blue-700 transition-colors"
          >
            + New
          </button>
        </div>

        {/* Stats row */}
        {decisions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Complete',    value: counts.complete,  color: 'text-green-600' },
              { label: 'In Progress', value: counts.comparing + counts.rating, color: 'text-blue-600' },
              { label: 'Drafts',      value: counts.draft,     color: 'text-gray-600' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-3 text-center"
              >
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {decisions.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300
                         text-gray-900 placeholder:text-gray-400 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Filter tabs */}
        {decisions.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {(
              [
                { key: 'all',      label: `All (${counts.all})`           },
                { key: 'complete', label: `Complete (${counts.complete})`  },
                { key: 'rating',   label: `Rating (${counts.rating})`     },
                { key: 'comparing',label: `Comparing (${counts.comparing})`},
                { key: 'draft',    label: `Draft (${counts.draft})`       },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                            border transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600"
            >
              Retry
            </button>
          </div>
        ) : decisions.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">No decisions match your search.</p>
            <button
              onClick={() => { setSearch(''); setFilter('all') }}
              className="mt-2 text-xs text-blue-500 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <DecisionCard key={d.id} decision={d} onDelete={handleDelete} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}