import React from 'react'
import { Menu } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="bg-[#0a0f1e] border-b border-[#1e2d40] px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger (visual only) */}
        <button className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1f2937] transition-colors">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-100 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  )
}
