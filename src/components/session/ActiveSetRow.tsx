import React from 'react'
import { Check } from 'lucide-react'
import { LoggedSet, SetType } from '../../types'
import { cn } from '../../lib/utils'

interface ActiveSetRowProps {
  set: LoggedSet
  setIndex: number
  onUpdate: (updated: LoggedSet) => void
  isPR?: boolean
}

const setTypeLabel: Record<SetType, string> = {
  normal: 'W',
  warmup: 'WU',
  dropset: 'D',
  failure: 'F',
}

const setTypeBg: Record<SetType, string> = {
  normal: 'bg-blue-500/20 text-blue-400',
  warmup: 'bg-yellow-500/20 text-yellow-400',
  dropset: 'bg-purple-500/20 text-purple-400',
  failure: 'bg-red-500/20 text-red-400',
}

export function ActiveSetRow({ set, setIndex, onUpdate, isPR = false }: ActiveSetRowProps) {
  const handleWeightChange = (value: string) => {
    const parsed = parseFloat(value)
    onUpdate({ ...set, actualWeight: isNaN(parsed) ? 0 : parsed })
  }

  const handleRepsChange = (value: string) => {
    const parsed = parseInt(value, 10)
    onUpdate({ ...set, actualReps: isNaN(parsed) ? 0 : parsed })
  }

  const handleComplete = () => {
    onUpdate({
      ...set,
      completed: !set.completed,
      completedAt: !set.completed ? new Date().toISOString() : undefined,
    })
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
        set.completed ? 'bg-green-500/10' : 'bg-[#1f2937]'
      )}
    >
      {/* Set number */}
      <span className="text-xs text-slate-500 w-5 text-center flex-shrink-0">
        {setIndex + 1}
      </span>

      {/* Type badge */}
      <span
        className={cn(
          'text-xs font-bold px-1.5 py-0.5 rounded w-8 text-center flex-shrink-0',
          setTypeBg[set.type]
        )}
      >
        {setTypeLabel[set.type]}
      </span>

      {/* Weight input */}
      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          value={set.actualWeight || set.targetWeight || ''}
          onChange={(e) => handleWeightChange(e.target.value)}
          placeholder={set.targetWeight?.toString() ?? '0'}
          className={cn(
            'w-full bg-[#111827] border border-[#2d3f55] text-slate-100 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-blue-500',
            set.completed && 'border-green-500/30'
          )}
        />
        <span className="text-xs text-slate-600 flex-shrink-0">lbs</span>
      </div>

      {/* Reps input */}
      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          value={set.actualReps || set.targetReps || ''}
          onChange={(e) => handleRepsChange(e.target.value)}
          placeholder={set.targetReps?.toString() ?? '0'}
          className={cn(
            'w-full bg-[#111827] border border-[#2d3f55] text-slate-100 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:border-blue-500',
            set.completed && 'border-green-500/30'
          )}
        />
        <span className="text-xs text-slate-600 flex-shrink-0">reps</span>
      </div>

      {/* PR badge */}
      {isPR && set.completed && (
        <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded flex-shrink-0">
          PR!
        </span>
      )}

      {/* Complete checkbox */}
      <button
        onClick={handleComplete}
        className={cn(
          'w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          set.completed
            ? 'bg-green-500 border-green-500'
            : 'border-[#2d3f55] hover:border-green-400'
        )}
      >
        {set.completed && <Check size={14} className="text-white" strokeWidth={3} />}
      </button>
    </div>
  )
}
