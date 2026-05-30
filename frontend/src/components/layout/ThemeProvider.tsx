// frontend/src/components/layout/ThemeProvider.tsx
'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (dark: boolean) => {
      if (dark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    if (theme === 'dark') {
      applyTheme(true)
      return
    }

    if (theme === 'light') {
      applyTheme(false)
      return
    }

    // system — follow OS preference
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(mq.matches)

    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return <>{children}</>
}
