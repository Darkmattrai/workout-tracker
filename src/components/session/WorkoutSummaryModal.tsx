import React from 'react'
import { Trophy, Clock, BarChart2, CheckSquare, Dumbbell } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { WorkoutSession } from '../../types'
import { formatDuration } from '../../lib/utils'

interface WorkoutSummaryModalProps {
  session: WorkoutSession
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function WorkoutSummaryModal({ session, isOpen, onClose, onSave }: WorkoutSummaryModalProps) {
  const completedSets = session.exercises.flatMap((e) => e.sets).filter((s) => s.completed)
  const prSets = completedSets.filter((s) => s.isPR)
  const exerciseCount = session.exercises.length

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workout Complete!" className="max-w-md">
      <div className="space-y-6">
        {/* Trophy */}
        <div className="flex flex-col items-center py-2">
          <div className="p-4 rounded-full bg-yellow-400/10 mb-3">
            <Trophy size={36} className="text-yellow-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">{session.workoutName}</h3>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1f2937] rounded-xl p-4 text-center">
            <Clock size={18} className="text-blue-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-100">{formatDuration(session.durationSeconds)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Duration</p>
          </div>
          <div className="bg-[#1f2937] rounded-xl p-4 text-center">
            <BarChart2 size={18} className="text-purple-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-100">
              {session.totalVolume.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Total Volume (lbs)</p>
          </div>
          <div className="bg-[#1f2937] rounded-xl p-4 text-center">
            <CheckSquare size={18} className="text-green-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-100">{completedSets.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Sets Completed</p>
          </div>
          <div className="bg-[#1f2937] rounded-xl p-4 text-center">
            <Dumbbell size={18} className="text-orange-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-slate-100">{exerciseCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Exercises</p>
          </div>
        </div>

        {/* PRs */}
        {prSets.length > 0 && (
          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <Trophy size={14} />
              {prSets.length} New Personal Record{prSets.length !== 1 ? 's' : ''}!
            </p>
            <div className="space-y-1">
              {session.exercises
                .filter((ex) => ex.sets.some((s) => s.isPR && s.completed))
                .map((ex) => (
                  <p key={ex.id} className="text-xs text-yellow-300">
                    {ex.exerciseName}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Discard
          </Button>
          <Button variant="primary" onClick={onSave} className="flex-1">
            Save Workout
          </Button>
        </div>
      </div>
    </Modal>
  )
}
