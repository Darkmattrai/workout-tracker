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
import { Calendar } from 'lucide-react'
import { WeeklyVolume } from '../../types'
import { EmptyState } from '../ui/EmptyState'

interface WorkoutFrequencyChartProps {
  data: WeeklyVolume[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-[#1e2d40] rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="text-purple-400 font-semibold">
          {payload[0].value} {payload[0].value === 1 ? 'session' : 'sessions'}
        </p>
      </div>
    )
  }
  return null
}

export function WorkoutFrequencyChart({ data }: WorkoutFrequencyChartProps) {
  const hasData = data.some((d) => d.sessionCount > 0)

  if (!hasData) {
    return (
      <EmptyState
        icon={Calendar}
        title="No frequency data yet"
        description="Complete workouts to see your weekly frequency."
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
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
        <Bar dataKey="sessionCount" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
