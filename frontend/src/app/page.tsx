'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createDecision } from '@/lib/api'
import { useDecisionStore } from '@/store/decisionStore'

/* ── Data ──────────────────────────────────────────────────────────────────── */
const SUGGESTIONS = [
  'Which city should I move to?',
  'Best job offer to accept',
  'Best laptop under ₹80,000',
  'Which MBA college to choose?',
  'Which car should I buy?',
  'Where to go on vacation?',
]

const STEPS = [
  {
    n: '01', label: 'Define Criteria',
    desc: 'List every factor that matters to your decision — price, quality, location, and more.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="12" height="4" rx="1"/><rect x="3" y="17" width="8" height="4" rx="1"/>
      </svg>
    ),
  },
  {
    n: '02', label: 'Priority Matrix',
    desc: 'Use pairwise comparison to determine mathematically consistent weights for each factor.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12M15 9v12"/>
      </svg>
    ),
  },
  {
    n: '03', label: 'Add Options',
    desc: 'Add the choices you are evaluating — the engine auto-suggests based on your decision.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
      </svg>
    ),
  },
  {
    n: '04', label: 'Score & Rank',
    desc: 'Rate each option per factor. The AHP engine surfaces the optimal choice automatically.',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/>
      </svg>
    ),
  },
]

const FEATURES = [
  { emoji: '⚖️', color: 'accent', label: 'Pairwise Comparison Engine', desc: 'Toggle each factor pair to determine relative importance. Weights are derived using the Saaty Fundamental Scale (1–9).' },
  { emoji: '📊', color: 'green',  label: 'Fractional Accuracy Analysis', desc: 'Every final score includes weighted accuracy percentages and a full right-vs-total breakdown for complete auditability.' },
  { emoji: '🔁', color: 'orange', label: 'Consistency Ratio Check', desc: 'A live consistency index validates your priority matrix. If the ratio drifts, you\'re flagged before proceeding.' },
  { emoji: '🧮', color: 'accent', label: 'Auto-Suggestions', desc: 'Context-aware criteria and option suggestions appear automatically based on your decision title.' },
  { emoji: '📄', color: 'green',  label: 'Dashboard & History', desc: 'All your decisions live in a workspace. Resume any in-progress decision or revisit completed ones at any time.' },
  { emoji: '🗂️', color: 'orange', label: 'Multi-Type Decisions', desc: 'From MBA colleges to laptops to job offers — the engine handles any structured decision intelligently.' },
]

const STATS = [
  { num: '98', suffix: '%', label: 'Decision Confidence' },
  { num: '4',  suffix: '×', label: 'Faster than meetings' },
  { num: '9',  suffix: '',  label: 'Saaty Scale Points'  },
  { num: '∞',  suffix: '',  label: 'Decisions per workspace' },
]

const STEP_ROUTES: Record<number, (id: string) => string> = {
  1: (id) => `/decision/${id}/criteria`,
  2: (id) => `/decision/${id}/compare`,
  3: (id) => `/decision/${id}/options`,
  4: (id) => `/decision/${id}/score`,
  5: (id) => `/decision/${id}/results`,
}

/* ── Showcase mock cards data ─────────────────────────────────────────────── */
const MOCK_CARDS = [
  {
    step: '01 · Factor Setup',
    content: (
      <div>
        <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Decision Factors</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, height: 28, background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 5, padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)' }}>e.g. Price, Quality…</div>
          <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>+</div>
        </div>
        {['Factor A', 'Factor B', 'Factor C', 'Factor D'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 9px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-2)' }}>{f}</span>
            <span style={{ fontSize: 10, color: 'var(--error)', background: 'var(--error-bg)', borderRadius: 3, padding: '1px 5px' }}>×</span>
          </div>
        ))}
        <div style={{ marginTop: 14, display: 'flex', gap: 20 }}>
          {[['4','Factors'],['3','Options'],['12','Points']].map(([n,l]) => (
            <div key={l}><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: -1 }}>{n}</div><div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div></div>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: '02 · Priority Matrix',
    content: (
      <div>
        <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Pairwise Comparison</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3, marginBottom: 14 }}>
          {['','F1','F2','F3','F1','—','F1›','F1›','F2','F2›','—','F3›','F3','F3›','F2›','—'].map((c, i) => (
            <div key={i} style={{ background: c === '—' ? 'var(--accent-bg)' : 'var(--surface-2)', border: `1px solid ${c === '—' ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 4, padding: '3px 5px', fontSize: 9, fontFamily: 'monospace', color: c === '—' ? 'var(--accent)' : 'var(--text-2)', textAlign: 'center', fontWeight: c === '—' ? 600 : 400 }}>{c}</div>
          ))}
        </div>
        <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Weight Distribution</p>
        {[['Factor 1', '42%', '42.3%'],['Factor 2','28%','28.0%'],['Factor 3','18%','18.3%']].map(([label, w, tag]) => (
          <div key={label} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)', width: 52, flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border-2)', position: 'relative', overflow: 'hidden' }}><div style={{ position: 'absolute', inset: 0, right: `${100 - parseInt(w)}%`, background: 'var(--accent)', borderRadius: 3 }} /></div>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{tag}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    step: '03 · Scoring Grid',
    content: (
      <div>
        <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Option Performance (1–10)</p>
        {[['Factor','Opt 01','Opt 02','Opt 03'],['Price Eff.','8.4','9.7','8.6'],['Quality','9.1','8.8','9.1'],['Operations','1.3','3.1','4.1'],['Sustain.','2.8','3.1','4.1']].map((row, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr 1fr', gap: 4, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
            {row.map((c, ci) => <div key={ci} style={{ fontSize: 9, fontFamily: 'monospace', color: ri === 0 ? 'var(--text-2)' : (ci === 0 ? 'var(--text-3)' : ci === 3 && ri > 0 ? 'var(--accent)' : 'var(--text-1)'), fontWeight: ci === 3 && ri > 0 ? 600 : 400 }}>{c}</div>)}
          </div>
        ))}
        <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
          {[['6.35','Opt 01',false],['7.33','Opt 02',false],['8.98','Leader',true]].map(([val, lbl, hi]) => (
            <div key={String(lbl)} style={{ flex: 1, background: hi ? 'var(--accent-bg)' : 'var(--surface-2)', border: `1px solid ${hi ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 6, padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: hi ? 'var(--accent)' : 'var(--text-1)', letterSpacing: -0.5 }}>{val}</div>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: hi ? 'var(--accent)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: '04 · Final Analysis',
    content: (
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 6, padding: '5px 10px', textAlign: 'center', marginBottom: 12, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.04em' }}>✓ Optimal: Option 03</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
          {[['92.4%','Consistency'],['98.2%','Confidence']].map(([num, label]) => (
            <div key={label}><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)', letterSpacing: -1.5, lineHeight: 1 }}>{num}</div><div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div></div>
          ))}
        </div>
        <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Fractional Analysis</p>
        {[['Option','Correct','Fraction','Accuracy'],['Option A','48','0.768','92.4%'],['Option B','52','0.816','80.2%'],['Option C','39','0.866','98.2%']].map((row, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', gap: 4, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
            {row.map((c, ci) => <div key={ci} style={{ fontSize: 9, fontFamily: 'monospace', color: ri === 3 && ci > 1 ? 'var(--accent)' : ri === 0 ? 'var(--text-2)' : 'var(--text-1)', fontWeight: ri === 3 && ci > 1 ? 600 : 400 }}>{c}</div>)}
          </div>
        ))}
      </div>
    ),
  },
]

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [title,   setTitle]   = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  const { decisionId, decisionTitle, step, reset, setDecision } = useDecisionStore()

  useEffect(() => {
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
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleResume = () => {
    if (!decisionId) return
    router.push(STEP_ROUTES[step]?.(decisionId) ?? '/')
  }

  // Duplicate cards for seamless loop
  const cards = [...MOCK_CARDS, ...MOCK_CARDS]

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── NOISE OVERLAY ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundSize: '128px',
          opacity: 0.4,
        }}
      />

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-5 overflow-hidden"
        style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80 }}
      >
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
            opacity: 0.3,
          }}
        />
        {/* Glow */}
        <div
          className="pointer-events-none absolute"
          style={{ top: '8%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, var(--accent-glow) 0%, transparent 70%)', zIndex: 0 }}
        />

        <div className="relative z-10 max-w-3xl mx-auto animate-fade-up">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-7 border"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-2)', fontFamily: 'monospace', letterSpacing: '0.02em' }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-glow" style={{ background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
            Decision Matrix Analysis · AHP Precision Engine
          </div>

          {/* Headline */}
          <h1
            className="font-bold leading-tight mb-5"
            style={{ fontSize: 'clamp(36px, 6vw, 68px)', letterSpacing: '-2px', lineHeight: 1.08, color: 'var(--text-1)' }}
          >
            Make decisions with{' '}
            <span className="gradient-text">mathematical</span>
            <br />precision
          </h1>

          <p
            className="mx-auto leading-relaxed mb-9"
            style={{ fontSize: 17, color: 'var(--text-2)', maxWidth: 540 }}
          >
            Structure your choices through weighted factor analysis, pairwise comparisons, and AHP scoring — so the best option surfaces automatically.
          </p>

          {/* Resume banner */}
          {hasResumable && (
            <div
              className="rounded-2xl border p-4 mb-5 flex items-center justify-between gap-3 text-left animate-scale-in"
              style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>In progress · Step {step} of 4</p>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{decisionTitle}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => reset()} className="text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80" style={{ color: 'var(--text-3)' }}>Discard</button>
                <button onClick={handleResume} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: 'var(--accent)' }}>Resume →</button>
              </div>
            </div>
          )}

          {/* Input card */}
          <div
            className="rounded-2xl border p-5 mb-5 text-left transition-all duration-300"
            style={{
              background: 'var(--surface)',
              borderColor: focused ? 'var(--accent)' : 'var(--border)',
              boxShadow: focused ? '0 0 0 4px var(--accent-bg), var(--shadow-lg)' : 'var(--shadow-md)',
            }}
          >
            <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>
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
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
              />
              <button
                onClick={handleStart}
                disabled={!title.trim() || loading}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white
                           transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: 'var(--shadow-accent)' }}
              >
                {loading ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />Starting…</>
                ) : 'Analyse →'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setTitle(s)}
                  className="px-3 py-1.5 text-xs rounded-full border font-medium transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-3)', background: 'var(--bg)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>
            No credit card required · Free workspace · Based on Saaty AHP (1970s)
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SHOWCASE — auto-scrolling cards
      ══════════════════════════════════════════════════════ */}
      <div className="relative pb-20 overflow-hidden" style={{ zIndex: 1 }}>
        {/* Fade edges */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-24 z-10" style={{ background: 'linear-gradient(90deg, var(--bg), transparent)' }} />
        <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-24 z-10" style={{ background: 'linear-gradient(-90deg, var(--bg), transparent)' }} />

        <div
          className="flex gap-4 w-max"
          style={{ animation: 'scrollX 38s linear infinite' }}
          onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')}
          onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}
        >
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
              style={{ width: 300, background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Chrome header */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--border-2)' }} />)}
                </div>
                <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>{card.step}</span>
              </div>
              <div className="p-4">{card.content}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <div style={{ height: 1, background: 'var(--border)', maxWidth: 1100, margin: '0 auto' }} />
      <section className="max-w-5xl mx-auto px-5 py-20" id="how-it-works">
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>How it works</p>
        <h2 className="font-bold mb-4" style={{ fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-1px', color: 'var(--text-1)', lineHeight: 1.15 }}>
          Four steps from problem<br />to optimal choice
        </h2>
        <p className="mb-14" style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 500 }}>
          A structured, repeatable workflow that removes gut-feel and bias from every major decision you face.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0.5">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="p-7 transition-all duration-200 cursor-default"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: i === 0 ? '16px 0 0 16px' : i === 3 ? '0 16px 16px 0' : 0,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
            >
              <p className="text-xs font-medium mb-4" style={{ color: 'var(--accent)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{s.n}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--accent)' }}>
                {s.icon}
              </div>
              <h3 className="font-semibold mb-2" style={{ fontSize: 15, color: 'var(--text-1)', letterSpacing: '-0.2px' }}>{s.label}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      <div style={{ height: 1, background: 'var(--border)', maxWidth: 1100, margin: '0 auto' }} />
      <section className="max-w-5xl mx-auto px-5 py-20">
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>By the numbers</p>
        <h2 className="font-bold mb-14" style={{ fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-1px', color: 'var(--text-1)', lineHeight: 1.15 }}>
          Decisions grounded<br />in data, not instinct
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="p-8"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: i === 0 ? '16px 0 0 16px' : i === 3 ? '0 16px 16px 0' : 0,
              }}
            >
              <div className="font-bold mb-1.5" style={{ fontSize: 38, letterSpacing: '-2px', lineHeight: 1, color: 'var(--text-1)' }}>
                {s.num}<span style={{ color: 'var(--accent)' }}>{s.suffix}</span>
              </div>
              <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <div style={{ height: 1, background: 'var(--border)', maxWidth: 1100, margin: '0 auto' }} />
      <section className="max-w-5xl mx-auto px-5 py-20" id="features">
        <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>Features</p>
        <h2 className="font-bold mb-14" style={{ fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-1px', color: 'var(--text-1)', lineHeight: 1.15 }}>
          Everything needed to<br />decide with precision
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
          {FEATURES.map((f, i) => {
            const radii = {
              0: '16px 0 0 0', 2: '0 16px 0 0',
              3: '0 0 0 16px', 5: '0 0 16px 0',
            } as Record<number, string>
            return (
              <div
                key={f.label}
                className="p-8 transition-all duration-200 cursor-default"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: radii[i] ?? 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 text-lg"
                  style={{ background: f.color === 'green' ? 'var(--success-bg)' : f.color === 'orange' ? 'var(--warning-bg)' : 'var(--accent-bg)' }}>
                  {f.emoji}
                </div>
                <h3 className="font-semibold mb-2" style={{ fontSize: 15, color: 'var(--text-1)', letterSpacing: '-0.2px' }}>{f.label}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════ */}
      <section className="px-5 py-20">
        <div
          className="max-w-4xl mx-auto rounded-2xl border p-16 text-center relative overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border-2)' }}
        >
          {/* Glow */}
          <div className="pointer-events-none absolute" style={{ top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 300, background: 'radial-gradient(ellipse, var(--accent-glow) 0%, transparent 70%)' }} />
          <div className="relative">
            <h2 className="font-bold mb-4" style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-1.5px', color: 'var(--text-1)', lineHeight: 1.1 }}>
              Ready to decide with<br />mathematical clarity?
            </h2>
            <p className="mb-9 mx-auto" style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 440, lineHeight: 1.65 }}>
              Set up your first decision matrix in minutes. No credit card, no setup — just structured, data-backed decisions.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => document.getElementById('hero-input')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: 'var(--shadow-accent)' }}
              >
                Start for Free →
              </button>
              <a
                href="/dashboard"
                className="px-8 py-3.5 rounded-xl text-base font-semibold border transition-all hover:border-[var(--border-2)] hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}
              >
                View Dashboard
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="border-t px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
              <svg viewBox="0 0 16 16" width="12" height="12" fill="white">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fillOpacity="0.4"/><circle cx="8" cy="8" r="3" fill="white"/>
              </svg>
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>Decide</span>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace' }}>
            © 2025 Sarthak &amp; Akshara · All rights reserved
          </span>
        </div>
        <ul className="flex gap-6">
          {['Dashboard', 'How it works', 'Features'].map(l => (
            <li key={l}>
              <a href={l === 'Dashboard' ? '/dashboard' : `#${l.toLowerCase().replace(/ /g, '-')}`} className="transition-colors hover:opacity-80" style={{ fontSize: 12.5, color: 'var(--text-3)', textDecoration: 'none' }}>
                {l}
              </a>
            </li>
          ))}
        </ul>
      </footer>

      {/* ── Keyframes injected inline ── */}
      <style>{`
        @keyframes scrollX {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  )
}
