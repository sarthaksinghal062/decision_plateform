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

    /** Apply dark or light class — removes whichever is not needed */
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
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

    // system — follow OS preference live
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyTheme(mq.matches)

    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return <>{children}</>
}

