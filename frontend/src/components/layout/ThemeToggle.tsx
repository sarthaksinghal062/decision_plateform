// frontend/src/components/layout/ThemeToggle.tsx
'use client'

import { useState, useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

const OPTIONS = [
  { value: 'light',  icon: '☀️', label: 'Light'  },
  { value: 'dark',   icon: '🌙', label: 'Dark'   },
  { value: 'system', icon: '💻', label: 'System' },
] as const

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  const [open, setOpen]     = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm
                   text-gray-500 dark:text-gray-400
                   hover:bg-gray-100 dark:hover:bg-gray-800
                   border border-transparent hover:border-gray-200
                   dark:hover:border-gray-700 transition-all"
        title="Toggle theme"
      >
        <span>{current.icon}</span>
        <span className="text-xs font-medium hidden sm:block">{current.label}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1.5 z-50 w-32
                          bg-white dark:bg-gray-900
                          border border-gray-200 dark:border-gray-700
                          rounded-xl shadow-lg overflow-hidden">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm
                            transition-colors text-left
                            ${theme === opt.value
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
                {theme === opt.value && (
                  <span className="ml-auto text-blue-500 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}