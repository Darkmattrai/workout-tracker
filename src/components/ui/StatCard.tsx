import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

type CardColor = 'blue' | 'green' | 'purple' | 'orange'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  icon: LucideIcon
  color?: CardColor
}

const colorMap: Record<CardColor, { icon: string; ring: string }> = {
  blue:   { icon: 'text-blue-400',   ring: 'bg-blue-500/10' },
  green:  { icon: 'text-green-400',  ring: 'bg-green-500/10' },
  purple: { icon: 'text-purple-400', ring: 'bg-purple-500/10' },
  orange: { icon: 'text-orange-400', ring: 'bg-orange-500/10' },
}

export function StatCard({ label, value, sublabel, icon: Icon, color = 'blue' }: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 flex items-start gap-4">
      <div className={cn('p-3 rounded-xl flex-shrink-0', colors.ring)}>
        <Icon size={22} className={colors.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-100 leading-none">{value}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
      </div>
    </div>
  )
}
