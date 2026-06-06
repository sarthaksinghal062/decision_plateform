/* eslint-disable react-hooks/set-state-in-effect */
// frontend/src/components/layout/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const links = [
    { href: '/',          label: 'Home'      },
    { href: '/dashboard', label: 'Dashboard' },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300',
          scrolled
            ? 'glass border-b'
            : 'bg-transparent',
        ].join(' ')}
        style={{ borderColor: scrolled ? 'var(--border)' : 'transparent' }}
      >
        <div className="max-w-5xl mx-auto h-full px-5 flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group select-none"
          >
            <div
              className="relative w-8 h-8 rounded-xl flex items-center justify-center
                         shadow-sm overflow-hidden"
              style={{ background: 'var(--accent)' }}
            >
              {/* geometric mark */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" fill="white" fillOpacity="0.25"/>
                <path d="M9 5L13 7.5V12.5L9 15L5 12.5V7.5L9 5Z" fill="white" fillOpacity="0.5"/>
                <circle cx="9" cy="9" r="2.5" fill="white"/>
              </svg>
            </div>
            <span
              className="font-semibold tracking-tight text-[15px] group-hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-1)' }}
            >
              Decide
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  isActive(l.href)
                    ? 'bg-[var(--surface)] text-[var(--text-1)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]',
                ].join(' ')}
              >
                {l.label}
              </Link>
            ))}

            <div className="w-px h-4 mx-2" style={{ background: 'var(--border)' }} />

            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium
                         text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--accent)' }}
            >
              <span className="text-base leading-none">+</span>
              New Decision
            </button>

            <div className="ml-1">
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile: toggle + hamburger */}
          <div className="sm:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              className="w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-1.5
                         hover:bg-[var(--surface-2)] transition-colors"
            >
              <span
                className="block h-0.5 rounded-full transition-all duration-200"
                style={{
                  background: 'var(--text-2)',
                  width: open ? '18px' : '18px',
                  transform: open ? 'translateY(4px) rotate(45deg)' : 'none',
                }}
              />
              <span
                className="block h-0.5 rounded-full transition-all duration-200"
                style={{
                  background: 'var(--text-2)',
                  width: '13px',
                  opacity: open ? 0 : 1,
                }}
              />
              <span
                className="block h-0.5 rounded-full transition-all duration-200"
                style={{
                  background: 'var(--text-2)',
                  width: '18px',
                  transform: open ? 'translateY(-4px) rotate(-45deg)' : 'none',
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="fixed top-16 left-0 right-0 z-40 sm:hidden glass border-b animate-fade-up"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="max-w-5xl mx-auto px-5 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium',
                  isActive(l.href)
                    ? 'bg-[var(--surface)] text-[var(--text-1)]'
                    : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]',
                ].join(' ')}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium
                         text-white mt-1"
              style={{ background: 'var(--accent)' }}
            >
              <span>+</span> New Decision
            </button>
          </div>
        </div>
      )}

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
