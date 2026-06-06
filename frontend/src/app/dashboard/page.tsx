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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     dot: '#9B9890', step: 1 },
  comparing: { label: 'Comparing', dot: '#F59E0B', step: 2 },
  rating:    { label: 'Scoring',   dot: '#3B82F6', step: 3 },
  complete:  { label: 'Complete',  dot: '#10B981', step: 4 },
} as const

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

// ─── Decision Card ─────────────────────────────────────────────────────────────

function DecisionCard({ decision, onDelete }: { decision: Decision; onDelete: (id: string) => void }) {
  const router = useRouter()
  const cfg    = STATUS_CONFIG[decision.status] ?? STATUS_CONFIG.draft
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

  const isComplete = decision.status === 'complete'
  const progress   = (cfg.step / 4) * 100

  return (
    <div
      className="group relative rounded-2xl border p-5 transition-all duration-200
                 hover:shadow-lg hover:-translate-y-px"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Accent left bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full transition-opacity duration-200
                   opacity-0 group-hover:opacity-100"
        style={{ background: isComplete ? 'var(--green)' : 'var(--accent)' }}
      />

      <div className="flex items-start gap-4">

        {/* Left */}
        <div className="flex-1 min-w-0">
          {/* Status row */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: cfg.dot }}
            />
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-3)' }}
            >
              {cfg.label}
            </span>
            <span style={{ color: 'var(--border-2)' }} className="text-[11px]">·</span>
            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
              {timeAgo(decision.created_at)}
            </span>
          </div>

          {/* Title */}
          <h3
            className="text-sm font-semibold leading-snug mb-2 pr-4 truncate"
            style={{ color: 'var(--text-1)' }}
          >
            {decision.title}
          </h3>

          {/* Meta chips */}
          <div className="flex items-center flex-wrap gap-2">
            {decision.criteria_count != null && (
              <span
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border"
                style={{ color: 'var(--text-3)', borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                {decision.criteria_count} criteria
              </span>
            )}
            {decision.options_count != null && (
              <span
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border"
                style={{ color: 'var(--text-3)', borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                {decision.options_count} options
              </span>
            )}
            {isComplete && decision.winner && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium border"
                style={{
                  background: 'var(--green-bg)',
                  borderColor: 'rgba(16,185,129,0.2)',
                  color: 'var(--green)',
                }}
              >
                🏆 {decision.winner}
                {decision.winner_score != null && (
                  <span className="opacity-70">· {decision.winner_score.toFixed(2)}</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => router.push(resumeRoute(decision))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold
                       transition-all hover:opacity-90 active:scale-95"
            style={
              isComplete
                ? { background: 'var(--green-bg)', color: 'var(--green)' }
                : { background: 'var(--accent-bg)', color: 'var(--accent)' }
            }
          >
            {isComplete ? 'View Results' : 'Continue →'}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[11px] transition-colors"
            style={{
              color: confirming ? 'var(--red)' : 'var(--text-3)',
            }}
          >
            {deleting ? '…' : confirming ? 'Confirm?' : 'Delete'}
          </button>

          {confirming && !deleting && (
            <button
              onClick={() => setConfirming(false)}
              className="text-[11px]"
              style={{ color: 'var(--text-3)' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!isComplete && (
        <div
          className="mt-4 h-0.5 rounded-full overflow-hidden"
          style={{ background: 'var(--surface-2)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--accent)' }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  const router = useRouter()
  return (
    <div className="text-center py-24 animate-fade-up">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <span className="text-2xl">◈</span>
      </div>
      <h2 className="font-semibold mb-2 text-base" style={{ color: 'var(--text-1)' }}>
        No decisions yet
      </h2>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--text-2)' }}>
        Start your first structured decision — it only takes a few minutes.
      </p>
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                   text-white transition-all hover:opacity-90"
        style={{ background: 'var(--accent)' }}
      >
        + Start a Decision
      </button>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton w-1.5 h-1.5 rounded-full" />
        <div className="skeleton h-2.5 w-20 rounded-full" />
      </div>
      <div className="skeleton h-4 w-3/4 rounded-lg mb-3" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="rounded-2xl border p-4 text-center"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <p
        className="text-2xl font-bold font-mono tracking-tight mb-0.5"
        style={{ color }}
      >
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</p>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<Decision['status'] | 'all'>('all')

  useEffect(() => {
    getAllDecisions()
      .then((data) => setDecisions(data as Decision[]))
      .catch(() => setError('Failed to load decisions.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = (id: string) => setDecisions((prev) => prev.filter((d) => d.id !== id))

  const filtered = decisions.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || d.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all:       decisions.length,
    complete:  decisions.filter((d) => d.status === 'complete').length,
    comparing: decisions.filter((d) => d.status === 'comparing').length,
    rating:    decisions.filter((d) => d.status === 'rating').length,
    draft:     decisions.filter((d) => d.status === 'draft').length,
  }

  const inProgress = counts.comparing + counts.rating

  return (
    <main className="min-h-screen py-10 px-5" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight mb-1"
              style={{ color: 'var(--text-1)' }}
            >
              Dashboard
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              {decisions.length} decision{decisions.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                       text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--accent)' }}
          >
            + New
          </button>
        </div>

        {/* Stats */}
        {decisions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up anim-delay-1">
            <StatCard value={counts.complete} label="Complete"    color="var(--green)"  />
            <StatCard value={inProgress}      label="In Progress" color="var(--accent)" />
            <StatCard value={counts.draft}    label="Drafts"      color="var(--text-2)" />
          </div>
        )}

        {/* Search */}
        {decisions.length > 0 && (
          <div className="relative mb-3 animate-fade-up anim-delay-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-3)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
              }}
            />
          </div>
        )}

        {/* Filter tabs */}
        {decisions.length > 0 && (
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 animate-fade-up anim-delay-1">
            {(
              [
                { key: 'all',       label: `All (${counts.all})`           },
                { key: 'complete',  label: `Complete (${counts.complete})`  },
                { key: 'comparing', label: `Comparing (${counts.comparing})`},
                { key: 'rating',    label: `Scoring (${counts.rating})`    },
                { key: 'draft',     label: `Draft (${counts.draft})`       },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={
                  filter === key
                    ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }
                    : { background: 'var(--surface)', color: 'var(--text-2)', borderColor: 'var(--border)' }
                }
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
          <div className="text-center py-12">
            <p className="text-sm mb-3" style={{ color: 'var(--red)' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs"
              style={{ color: 'var(--text-3)' }}
            >
              Retry
            </button>
          </div>
        ) : decisions.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm mb-2" style={{ color: 'var(--text-2)' }}>
              No decisions match your filters.
            </p>
            <button
              onClick={() => { setSearch(''); setFilter('all') }}
              className="text-xs font-medium"
              style={{ color: 'var(--accent)' }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-up anim-delay-2">
            {filtered.map((d) => (
              <DecisionCard key={d.id} decision={d} onDelete={handleDelete} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
