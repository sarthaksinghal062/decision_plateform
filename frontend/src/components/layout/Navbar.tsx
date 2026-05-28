"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === "/"

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Decision Helper</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={`text-sm transition-colors ${
              isHome ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/new"
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + New
          </Link>
        </div>
      </div>
    </nav>
  )
}
