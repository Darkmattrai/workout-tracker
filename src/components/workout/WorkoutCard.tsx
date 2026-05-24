import React, { useState } from 'react'
import { MoreVertical, Play, Clock, Dumbbell, Copy, Pencil, Trash2 } from 'lucide-react'
import { WorkoutTemplate, Exercise } from '../../types'
import { MuscleGroupBadge } from './MuscleGroupBadge'
import { Button } from '../ui/Button'
import { formatDate } from '../../lib/utils'

interface WorkoutCardProps {
  workout: WorkoutTemplate
  exercises: Exercise[]
  onStart: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function WorkoutCard({
  workout,
  exercises,
  onStart,
  onEdit,
  onDuplicate,
  onDelete,
}: WorkoutCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const exerciseNames = workout.exercises.slice(0, 4).map((et) => {
    const ex = exercises.find((e) => e.id === et.exerciseId)
    return ex?.name ?? 'Unknown'
  })

  const remaining = workout.exercises.length - exerciseNames.length

  return (
    <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 flex flex-col gap-4 hover:border-[#2d3f55] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-100 truncate">{workout.name}</h3>
          {workout.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{workout.description}</p>
          )}
        </div>
        {/* Three-dot menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-[#1f2937] transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-20 bg-[#1f2937] border border-[#1e2d40] rounded-lg shadow-lg overflow-hidden min-w-36">
                <button
                  onClick={() => { setMenuOpen(false); onEdit() }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-[#2d3f55] transition-colors"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDuplicate() }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-[#2d3f55] transition-colors"
                >
                  <Copy size={14} /> Duplicate
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-[#2d3f55] transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      {workout.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {workout.tags.map((tag) => (
            <MuscleGroupBadge key={tag} muscle={tag} />
          ))}
        </div>
      )}

      {/* Exercise preview */}
      <div className="space-y-0.5">
        {exerciseNames.map((name, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <Dumbbell size={11} className="text-slate-600 flex-shrink-0" />
            {name}
          </div>
        ))}
        {remaining > 0 && (
          <p className="text-xs text-slate-600 pl-4">+{remaining} more</p>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Dumbbell size={12} />
          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          ~{workout.estimatedMinutes} min
        </span>
      </div>

      <div className="text-xs text-slate-600">
        Updated {formatDate(workout.updatedAt)}
      </div>

      {/* Start button */}
      <Button variant="primary" size="md" onClick={onStart} className="w-full">
        <Play size={15} />
        Start Workout
      </Button>
    </div>
  )
}
