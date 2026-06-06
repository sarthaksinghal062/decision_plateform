// frontend/src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDecision } from '@/lib/api'
import { useDecisionStore } from '@/store/decisionStore'

const SUGGESTIONS = [
  'Which city should I move to?',
  'Best job offer to accept',
  'Best laptop under ₹80,000',
  'Which MBA college to choose?',
]

const STEPS = [
  { n: '01', label: 'Define Criteria',   desc: 'What factors matter most to you?',     icon: '◈' },
  { n: '02', label: 'Pairwise Compare',  desc: 'Weigh criteria against each other.',    icon: '⇌' },
  { n: '03', label: 'Add Options',       desc: 'List every choice you\'re considering.', icon: '◎' },
  { n: '04', label: 'Score & Rank',      desc: 'Rate options, get your ranked result.',  icon: '◆' },
]

const STEP_ROUTES: Record<number, (id: string) => string> = {
  1: (id) => `/decision/${id}/criteria`,
  2: (id) => `/decision/${id}/compare`,
  3: (id) => `/decision/${id}/options`,
  4: (id) => `/decision/${id}/score`,
  5: (id) => `/decision/${id}/results`,
}

export default function HomePage() {
  const [title,   setTitle]   = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [focused, setFocused] = useState(false)
  const router = useRouter()

  const { decisionId, decisionTitle, step, reset, setDecision } = useDecisionStore()

  useEffect(() => {
    // Defer setting mounted to avoid synchronous setState during effect execution
    const id = window.setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(id)
  }, [])

  const hasResumable = mounted && !!decisionId && step > 1 && step < 5

  const handleStart = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      reset()
      const decision = await createDecision(title.trim())
      setDecision(decision.id, decision.title)
      router.push(`/decision/${decision.id}/criteria`)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleResume = () => {
    if (!decisionId) return
    const route = STEP_ROUTES[step]?.(decisionId) ?? '/'
    router.push(route)
  }

  return (
    <main
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background geometric accent */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, var(--accent-bg) 0%, transparent 70%)',
          opacity: 0.6,
        }}
      />

      {/* Grid lines decoration */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-5 pt-20 pb-24">

        {/* Hero ───────────────────────────────────────────────────────── */}
        <div className="text-center mb-12 animate-fade-up">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border"
            style={{
              background: 'var(--accent-bg)',
              borderColor: 'var(--accent-border)',
              color: 'var(--accent)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
            AHP — Analytic Hierarchy Process
          </div>

          <h1
            className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-4"
            style={{ color: 'var(--text-1)' }}
          >
            Make decisions you{' '}
            <span
              className="relative inline-block"
              style={{ color: 'var(--accent)' }}
            >
              won&apos;t regret
            </span>
          </h1>

          <p
            className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-2)' }}
          >
            Structured, math-backed analysis used by researchers and Fortune 500 companies —
            now available in minutes.
          </p>
        </div>

        {/* Resume banner */}
        {hasResumable && (
          <div
            className="rounded-2xl border p-4 mb-5 flex items-center justify-between gap-3 animate-fade-up"
            style={{
              background: 'var(--accent-bg)',
              borderColor: 'var(--accent-border)',
            }}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5"
                 style={{ color: 'var(--accent)' }}>
                In progress · Step {step} of 4
              </p>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                {decisionTitle}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => reset()}
                className="text-xs px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text-3)' }}
              >
                Discard
              </button>
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium
                           text-white transition-all hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                Resume →
              </button>
            </div>
          </div>
        )}

        {/* Input card ────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-6 mb-4 animate-fade-up anim-delay-1 transition-shadow duration-300"
          style={{
            background: 'var(--surface)',
            borderColor: focused ? 'var(--accent)' : 'var(--border)',
            boxShadow: focused
              ? '0 0 0 4px var(--accent-bg), 0 8px 32px -4px rgba(0,0,0,0.12)'
              : '0 2px 12px -2px rgba(0,0,0,0.06)',
          }}
        >
          <label
            className="block text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-3)' }}
          >
            What decision are you trying to make?
          </label>

          <div className="flex gap-2.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. Which city should I move to?"
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
              }}
            />
            <button
              onClick={handleStart}
              disabled={!title.trim() || loading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm
                         text-white transition-all hover:opacity-90 disabled:opacity-40
                         disabled:cursor-not-allowed whitespace-nowrap"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent
                                   rounded-full animate-spin shrink-0" />
                  Starting…
                </>
              ) : (
                'Analyse →'
              )}
            </button>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mt-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setTitle(s)}
                className="px-3 py-1.5 text-xs rounded-full border font-medium
                           hover:border-[var(--accent)] hover:text-[var(--accent)]
                           hover:bg-[var(--accent-bg)] transition-all"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-2)',
                  background: 'var(--bg)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Steps ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 animate-fade-up anim-delay-2">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="group rounded-2xl border p-4 transition-all duration-200
                         hover:border-[var(--accent)] hover:shadow-md cursor-default"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Step number + icon */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="font-mono text-xs font-medium"
                  style={{ color: 'var(--text-3)' }}
                >
                  {s.n}
                </span>
                <span
                  className="text-lg group-hover:scale-110 transition-transform duration-200 inline-block"
                  style={{ color: 'var(--accent)', opacity: 0.7 }}
                >
                  {s.icon}
                </span>
              </div>
              <p
                className="text-xs font-semibold mb-1 leading-tight"
                style={{ color: 'var(--text-1)' }}
              >
                {s.label}
              </p>
              <p
                className="text-[11px] leading-snug"
                style={{ color: 'var(--text-3)' }}
              >
                {s.desc}
              </p>

              {/* Connector line (not last) */}
              {i < 3 && (
                <div
                  className="hidden sm:block absolute right-0 top-1/2 w-3 h-px"
                  style={{ background: 'var(--border)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Social proof */}
        <p
          className="text-center text-xs mt-8 animate-fade-up anim-delay-3"
          style={{ color: 'var(--text-3)' }}
        >
          Based on the Analytic Hierarchy Process developed by Thomas L. Saaty (1970s)
          — used by governments, researchers, and enterprises worldwide.
        </p>

      </div>
    </main>
  )
}
