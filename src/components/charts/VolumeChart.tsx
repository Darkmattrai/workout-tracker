import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { BarChart2 } from 'lucide-react'
import { WeeklyVolume } from '../../types'
import { EmptyState } from '../ui/EmptyState'

interface VolumeChartProps {
  data: WeeklyVolume[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-[#1e2d40] rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-blue-400 font-semibold">{payload[0].value.toLocaleString()} lbs</p>
      </div>
    )
  }
  return null
}

export function VolumeChart({ data }: VolumeChartProps) {
  const hasData = data.some((d) => d.totalVolume > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={BarChart2}
        title="No volume data yet"
        description="Complete workouts to see your weekly volume trend."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" vertical={false} />
        <XAxis
          dataKey="weekLabel"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
        <Bar dataKey="totalVolume" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
