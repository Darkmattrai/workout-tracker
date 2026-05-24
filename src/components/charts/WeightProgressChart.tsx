import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { ExerciseDataPoint } from '../../types'
import { EmptyState } from '../ui/EmptyState'

interface WeightProgressChartProps {
  data: ExerciseDataPoint[]
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-[#1e2d40] rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value} lbs
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function WeightProgressChart({ data }: WeightProgressChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No progress data"
        description="Log sets for this exercise to track your weight progress."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
          iconType="circle"
          iconSize={8}
        />
        <Line
          type="monotone"
          dataKey="weight"
          name="Weight"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="estimated1RM"
          name="Est. 1RM"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
