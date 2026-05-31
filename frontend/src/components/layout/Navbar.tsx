// frontend/src/components/layout/Navbar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/',          label: 'Home'      },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="fixed top-0 left-0 right-0 z-50
                       bg-white dark:bg-gray-900
                       border-b border-gray-200 dark:border-gray-800 h-14
                       transition-colors duration-200">
      <div className="max-w-5xl mx-auto h-full px-4 flex items-center justify-between">

        {/* Logo */}
       <Link href="/" className="flex items-center gap-2">
  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
    <span className="text-white text-xs font-bold">D</span>
  </div>
  <span className="font-semibold text-sm">Decision Helper</span>
</Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {l.label}
            </Link>
          ))}

          <button
            onClick={() => router.push('/')}
            className="ml-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm
                       font-medium hover:bg-blue-700 transition-colors"
          >
            + New Decision
          </button>

          {/* Theme toggle */}
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="sm:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current mb-1" />
            <span className="block w-5 h-0.5 bg-current" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden bg-white dark:bg-gray-900
                        border-t border-gray-100 dark:border-gray-800
                        px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(l.href)
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => { setOpen(false); router.push('/') }}
            className="w-full mt-1 px-3 py-2 bg-blue-600 text-white rounded-lg
                       text-sm font-medium text-left"
          >
            + New Decision
          </button>
        </div>
      )}
    </header>
  )
}