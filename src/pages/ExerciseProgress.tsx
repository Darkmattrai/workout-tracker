import React, { useState, useMemo } from 'react'
import { Search, Trophy, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { TopBar } from '../components/layout/TopBar'
import { EmptyState } from '../components/ui/EmptyState'
import { WeightProgressChart } from '../components/charts/WeightProgressChart'
import { MuscleGroupBadge } from '../components/workout/MuscleGroupBadge'
import { useAppContext } from '../context/AppContext'
import { getExerciseHistory, computePersonalRecords } from '../lib/analytics'
import { formatDate } from '../lib/utils'
import { Exercise } from '../types'

export function ExerciseProgress() {
  const { state } = useAppContext()
  const [search, setSearch] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const completed = state.workoutSessions.filter((s) => s.status === 'completed')

  // Get exercises that have logged history
  const exercisesWithHistory = useMemo(() => {
    const ids = new Set<string>()
    for (const session of completed) {
      for (const ex of session.exercises) {
        if (ex.sets.some((s) => s.completed)) ids.add(ex.exerciseId)
      }
    }
    return state.exercises.filter((e) => ids.has(e.id))
  }, [completed, state.exercises])

  const filteredExercises = useMemo(() => {
    if (!search) return exercisesWithHistory
    return exercisesWithHistory.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [exercisesWithHistory, search])

  const selectedExercise = selectedExerciseId
    ? state.exercises.find((e) => e.id === selectedExerciseId) ?? null
    : null

  const history = useMemo(
    () => (selectedExerciseId ? getExerciseHistory(completed, selectedExerciseId) : []),
    [completed, selectedExerciseId]
  )

  const prs = useMemo(() => computePersonalRecords(completed), [completed])
  const selectedPR = selectedExerciseId ? prs.find((p) => p.exerciseId === selectedExerciseId) : null

  // Session history for this exercise
  const sessionHistory = useMemo(() => {
    if (!selectedExerciseId) return []
    return completed
      .filter((s) => s.exercises.some((e) => e.exerciseId === selectedExerciseId))
      .slice(0, 10)
      .map((s) => {
        const ex = s.exercises.find((e) => e.exerciseId === selectedExerciseId)!
        const completedSets = ex.sets.filter((set) => set.completed)
        const maxWeight = completedSets.length
          ? Math.max(...completedSets.map((set) => set.actualWeight))
          : 0
        const volume = completedSets.reduce((sum, set) => sum + set.actualWeight * set.actualReps, 0)
        return {
          date: s.startedAt,
          setsCount: completedSets.length,
          maxWeight,
          volume,
        }
      })
  }, [completed, selectedExerciseId])

  const top5PRs = prs.slice(0, 5)

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Progress" subtitle="Track your strength gains" />

      <div className="p-6 space-y-6 pb-24 md:pb-6">
        {/* Exercise selector */}
        <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Select Exercise</h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search exercises with history..."
              value={selectedExercise?.name ?? search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedExerciseId(null)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-[#1f2937] border border-[#2d3f55] text-slate-100 rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            {showDropdown && filteredExercises.length > 0 && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#1f2937] border border-[#1e2d40] rounded-lg shadow-xl max-h-56 overflow-y-auto">
                  {filteredExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        setSelectedExerciseId(ex.id)
                        setSearch('')
                        setShowDropdown(false)
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#2d3f55] transition-colors text-left border-b border-[#1e2d40] last:border-b-0"
                    >
                      <span className="text-sm text-slate-200">{ex.name}</span>
                      <MuscleGroupBadge muscle={ex.primaryMuscle} />
                    </button>
                  ))}
                </div>
              </>
            )}
            {showDropdown && filteredExercises.length === 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#1f2937] border border-[#1e2d40] rounded-lg px-4 py-3">
                <p className="text-sm text-slate-500">No exercises with history found</p>
              </div>
            )}
          </div>
        </div>

        {selectedExercise && selectedPR ? (
          <>
            {/* PR card */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-100">{selectedPR.maxWeight}</p>
                <p className="text-xs text-slate-500 mt-1">Max Weight (lbs)</p>
              </div>
              <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{selectedPR.bestEstimated1RM}</p>
                <p className="text-xs text-slate-500 mt-1">Best Est. 1RM</p>
              </div>
              <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-100">{sessionHistory.length}</p>
                <p className="text-xs text-slate-500 mt-1">Sessions</p>
              </div>
            </div>

            {/* Weight progress chart */}
            <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">
                Weight Progress — {selectedExercise.name}
              </h3>
              <WeightProgressChart data={history} />
            </div>

            {/* History table */}
            {sessionHistory.length > 0 && (
              <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Sessions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-[#1e2d40]">
                        <th className="text-left pb-2 pr-4">Date</th>
                        <th className="text-right pb-2 pr-4">Sets</th>
                        <th className="text-right pb-2 pr-4">Max Weight</th>
                        <th className="text-right pb-2">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2d40]">
                      {sessionHistory.map((row, i) => (
                        <tr key={i} className="text-slate-300">
                          <td className="py-2 pr-4">{formatDate(row.date)}</td>
                          <td className="py-2 pr-4 text-right">{row.setsCount}</td>
                          <td className="py-2 pr-4 text-right">{row.maxWeight} lbs</td>
                          <td className="py-2 text-right">{row.volume.toLocaleString()} lbs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : selectedExercise ? (
          <EmptyState
            icon={TrendingUp}
            title="No history for this exercise"
            description="Log sets for this exercise to track your progress."
          />
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="Select an exercise"
            description="Choose an exercise above to see your progress and personal records."
          />
        )}

        {/* Top 5 PRs */}
        {top5PRs.length > 0 && (
          <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-yellow-400" />
              Personal Records
            </h3>
            <div className="space-y-3">
              {top5PRs.map((pr, i) => (
                <div
                  key={pr.exerciseId}
                  className="flex items-center justify-between py-2 border-b border-[#1e2d40] last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-600 w-5">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{pr.exerciseName}</p>
                      <p className="text-xs text-slate-500">{formatDate(pr.achievedAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-400">{pr.bestEstimated1RM} lbs</p>
                    <p className="text-xs text-slate-500">est. 1RM</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
