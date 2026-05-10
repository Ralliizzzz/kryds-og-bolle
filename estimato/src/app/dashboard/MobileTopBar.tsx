"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/dashboard", label: "Oversigt", exact: true },
  { href: "/dashboard/leads", label: "Leads", exact: false },
  { href: "/dashboard/bookings", label: "Bookinger", exact: false },
  { href: "/dashboard/priser", label: "Priser og tillæg", exact: false },
  { href: "/dashboard/settings", label: "Indstillinger", exact: false },
  { href: "/dashboard/embed", label: "Installer widget", exact: false },
  { href: "/dashboard/billing", label: "Abonnement", exact: false },
]

export default function MobileTopBar({ companyName }: { companyName?: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-sm">Estimato</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Åbn menu"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <aside className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col px-3 py-5 shadow-xl">
            <div className="flex items-center justify-between px-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <span className="font-bold text-gray-900 text-sm">Estimato</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-0.5 flex-1">
              {navItems.map(({ href, label, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            {companyName && (
              <div className="mt-4 pt-4 border-t border-gray-100 px-3">
                <p className="text-xs font-semibold text-gray-700 truncate">{companyName}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
