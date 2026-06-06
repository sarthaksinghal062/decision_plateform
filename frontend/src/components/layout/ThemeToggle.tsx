// frontend/src/components/layout/ThemeToggle.tsx
'use client'

import { useState, useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

const OPTIONS = [
  { value: 'light',  icon: '☀️', label: 'Light'  },
  { value: 'dark',   icon: '🌙', label: 'Dark'   },
  { value: 'system', icon: '⊙',  label: 'System' },
] as const

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  const [open,    setOpen]    = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  if (!mounted) return null

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Toggle theme"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm
                   border transition-all hover:border-[var(--border-2)]"
        style={{
          color: 'var(--text-2)',
          background: 'transparent',
          borderColor: 'var(--border)',
        }}
      >
        <span className="text-sm leading-none">{current.icon}</span>
        <span className="text-xs font-medium hidden sm:block" style={{ color: 'var(--text-2)' }}>
          {current.label}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 w-32 rounded-xl border overflow-hidden
                       shadow-xl animate-fade-in"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium
                           transition-colors text-left"
                style={{
                  background: theme === opt.value ? 'var(--accent-bg)' : 'transparent',
                  color: theme === opt.value ? 'var(--accent)' : 'var(--text-2)',
                }}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
                {theme === opt.value && (
                  <span className="ml-auto text-xs" style={{ color: 'var(--accent)' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
