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

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  step: 1, icon: '○' },
  comparing: { label: 'Comparing', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   step: 2, icon: '⇌' },
  rating:    { label: 'Scoring',   color: '#7c6fff', bg: 'rgba(124,111,255,0.1)',   step: 3, icon: '◆' },
  complete:  { label: 'Complete',  color: '#34d399', bg: 'rgba(52,211,153,0.1)',    step: 4, icon: '✓' },
} as const

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
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

function DecisionCard({ decision, onDelete, index }: { decision: Decision; onDelete: (id: string) => void; index: number }) {
  const router = useRouter()
  const cfg    = STATUS_CONFIG[decision.status] ?? STATUS_CONFIG.draft
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const handleDelete = async () => {
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
      className="group relative overflow-hidden rounded-2xl border transition-all duration-300
                 hover:-translate-y-0.5 animate-fade-up"
      style={{
        background:  'var(--surface)',
        borderColor: confirming ? 'var(--error)' : 'var(--border)',
        boxShadow:   confirming ? '0 0 0 1px var(--error)' : 'none',
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Subtle gradient top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}55, transparent)` }}
      />

      {/* ── Main content ── */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-4">

          {/* Status icon badge */}
          <div
            className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold mt-0.5"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}
          >
            {cfg.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3
              className="text-sm font-semibold leading-snug mb-1.5 truncate pr-2"
              style={{ color: 'var(--text-1)', letterSpacing: '-0.01em' }}
            >
              {decision.title}
            </h3>

            {/* Status + time */}
            <div className="flex items-center gap-2 mb-2.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                {cfg.label}
              </span>
              <span style={{ color: 'var(--text-3)' }} className="text-[11px]">
                {timeAgo(decision.created_at)}
              </span>
            </div>

            {/* Meta chips */}
            <div className="flex items-center flex-wrap gap-1.5">
              {decision.criteria_count != null && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg font-medium"
                  style={{ color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  {decision.criteria_count} criteria
                </span>
              )}
              {decision.options_count != null && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg font-medium"
                  style={{ color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  {decision.options_count} options
                </span>
              )}
              {isComplete && decision.winner && (
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-lg font-semibold"
                  style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: 'var(--success)', border: '1px solid var(--success-border)' }}
                >
                  🏆 {decision.winner}
                  {decision.winner_score != null && (
                    <span className="opacity-70">· {decision.winner_score.toFixed(2)}</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => router.push(resumeRoute(decision))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                         transition-all hover:opacity-90 active:scale-95"
              style={
                isComplete
                  ? { background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }
                  : { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
              }
            >
              {isComplete ? (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Results</>
              ) : (
                <>Continue →</>
              )}
            </button>

            {!confirming && (
              <button
                onClick={() => setConfirming(true)}
                title="Delete decision"
                className="opacity-0 group-hover:opacity-100 transition-all duration-150
                           w-7 h-7 rounded-lg flex items-center justify-center
                           hover:bg-[var(--error-bg)] active:scale-95"
                style={{ color: 'var(--text-3)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isComplete && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-3)' }}>Step {cfg.step} of 4</span>
              <span className="text-[10px] font-mono font-medium" style={{ color: cfg.color }}>{progress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${cfg.color}99, ${cfg.color})` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirm bar ── */}
      {confirming && (
        <div
          className="flex items-center justify-between gap-3 px-5 py-3 border-t"
          style={{ background: 'var(--error-bg)', borderColor: 'var(--error-border)' }}
        >
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--error)', flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-xs" style={{ color: 'var(--error)' }}>
              Delete &quot;{decision.title.length > 30 ? decision.title.slice(0, 30) + '…' : decision.title}&quot;?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirming(false)} disabled={deleting}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ color: 'var(--text-2)', background: 'var(--surface)' }}
            >Cancel</button>
            <button
              onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                         text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: 'var(--error)' }}
            >
              {deleting
                ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting…</>
                : <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                    Delete
                  </>
              }
            </button>
          </div>
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
        className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative"
        style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-glow"
          style={{ background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }} />
      </div>
      <h2 className="font-semibold mb-2" style={{ fontSize: 18, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>
        No decisions yet
      </h2>
      <p className="text-sm mb-8 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text-2)' }}>
        Start your first structured decision analysis — it only takes a few minutes.
      </p>
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
                   text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: 'var(--shadow-accent)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        Start a Decision
      </button>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-start gap-4">
        <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
        <div className="flex-1">
          <div className="skeleton h-3.5 w-2/3 rounded-lg mb-2.5" />
          <div className="skeleton h-2.5 w-20 rounded-md mb-3" />
          <div className="flex gap-2">
            <div className="skeleton h-4 w-16 rounded-lg" />
            <div className="skeleton h-4 w-14 rounded-lg" />
          </div>
        </div>
        <div className="skeleton h-7 w-20 rounded-lg shrink-0" />
      </div>
      <div className="mt-4"><div className="skeleton h-1 w-full rounded-full" /></div>
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ value, label, color, bg, icon }: { value: number; label: string; color: string; bg: string; icon: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-px"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold font-mono tracking-tight mb-0.5" style={{ color, letterSpacing: '-1.5px' }}>
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-3)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
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

  const FILTERS = [
    { key: 'all',       label: 'All',       count: counts.all       },
    { key: 'complete',  label: 'Complete',  count: counts.complete  },
    { key: 'comparing', label: 'Comparing', count: counts.comparing },
    { key: 'rating',    label: 'Scoring',   count: counts.rating    },
    { key: 'draft',     label: 'Draft',     count: counts.draft     },
  ] as const

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Hero header band ── */}
      <div
        className="relative border-b pt-20 pb-8 px-5 overflow-hidden"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 100% 100% at 50% 100%, black 0%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 100%, black 0%, transparent 80%)',
            opacity: 0.2,
          }}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48"
          style={{ background: 'radial-gradient(ellipse, var(--accent-glow) 0%, transparent 70%)' }} />

        <div className="max-w-4xl mx-auto relative">
          <div className="animate-fade-up">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-md"
                style={{ color: 'var(--accent)', background: 'var(--accent-bg)', fontFamily: 'monospace' }}
              >
                Workspace
              </span>
            </div>
            <h1 className="font-bold mb-1.5" style={{ fontSize: 32, letterSpacing: '-1.5px', color: 'var(--text-1)' }}>
              Decision Dashboard
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'monospace' }}>
              {decisions.length} decision{decisions.length !== 1 ? 's' : ''} in workspace
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8">

        {/* ── Stats strip ── */}
        {decisions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-up">
            <StatCard
              value={counts.complete} label="Complete" color="var(--success)" bg="var(--success-bg)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            />
            <StatCard
              value={inProgress} label="In Progress" color="var(--accent)" bg="var(--accent-bg)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            />
            <StatCard
              value={counts.draft} label="Drafts" color="var(--text-2)" bg="var(--surface-2)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
            />
          </div>
        )}

        {/* ── Toolbar — search + filter + new button ── */}
        {decisions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up anim-delay-1">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                style={{ color: 'var(--text-3)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search decisions…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${search ? 'var(--accent)' : 'var(--border)'}`,
                  color: 'var(--text-1)',
                  boxShadow: search ? '0 0 0 3px var(--accent-bg)' : 'none',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-3)' }}>×</button>
              )}
            </div>

            {/* New button */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                         transition-all hover:opacity-90 active:scale-95 whitespace-nowrap shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: 'var(--shadow-accent)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New Decision
            </button>
          </div>
        )}

        {/* ── Filter tabs ── */}
        {decisions.length > 0 && (
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 animate-fade-up anim-delay-1">
            {FILTERS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150"
                style={
                  filter === key
                    ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }
                    : { background: 'var(--surface)', color: 'var(--text-3)', borderColor: 'var(--border)' }
                }
              >
                {label}
                <span
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-mono"
                  style={{
                    background: filter === key ? 'rgba(255,255,255,0.2)' : 'var(--surface-2)',
                    color: filter === key ? '#fff' : 'var(--text-3)',
                  }}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16 animate-fade-up">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--error)' }}>{error}</p>
            <button onClick={() => window.location.reload()} className="text-xs font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--text-3)' }}>Try again</button>
          </div>
        ) : decisions.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 animate-fade-up">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-2)' }}>No decisions match your filters</p>
            <button onClick={() => { setSearch(''); setFilter('all') }} className="text-xs font-semibold transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((d, i) => (
              <DecisionCard key={d.id} decision={d} onDelete={handleDelete} index={i} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
