import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Trash2, History, Filter } from 'lucide-react'
import { format, parseISO, startOfMonth } from 'date-fns'
import { TopBar } from '../components/layout/TopBar'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Button } from '../components/ui/Button'
import { useAppContext } from '../context/AppContext'
import { formatDate, formatDuration } from '../lib/utils'
import { getTotalVolume } from '../lib/analytics'
import { WorkoutSession } from '../types'
import { Activity, Clock, BarChart2 } from 'lucide-react'

interface SessionRowProps {
  session: WorkoutSession
  onDelete: () => void
}

function SessionRow({ session, onDelete }: SessionRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-[#111827] border border-[#1e2d40] rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#1f2937] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div>
            <p className="font-semibold text-slate-200 truncate">{session.workoutName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{formatDate(session.startedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <span className="text-slate-400">{formatDuration(session.durationSeconds)}</span>
            <span className="text-slate-400">{session.totalVolume.toLocaleString()} lbs</span>
            <span className="text-slate-500 text-xs">
              {session.exercises.length} ex · {session.totalSets} sets
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <div className="text-slate-500">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#1e2d40] px-5 py-4 space-y-3">
          {/* Mobile stats */}
          <div className="sm:hidden flex gap-3 text-xs text-slate-400 mb-3">
            <span>{formatDuration(session.durationSeconds)}</span>
            <span>{session.totalVolume.toLocaleString()} lbs</span>
            <span>{session.totalSets} sets</span>
          </div>

          {session.exercises.map((ex) => {
            const completedSets = ex.sets.filter((s) => s.completed)
            return (
              <div key={ex.id}>
                <p className="text-sm font-medium text-slate-300 mb-2">{ex.exerciseName}</p>
                <div className="space-y-1">
                  {completedSets.length === 0 ? (
                    <p className="text-xs text-slate-600 pl-3">No completed sets</p>
                  ) : (
                    completedSets.map((set, si) => (
                      <div key={set.id} className="flex items-center gap-3 pl-3 text-xs text-slate-400">
                        <span className="text-slate-600 w-5">{si + 1}</span>
                        <span>{set.actualWeight} lbs</span>
                        <span>×</span>
                        <span>{set.actualReps} reps</span>
                        {set.isPR && (
                          <span className="text-yellow-400 font-semibold">PR!</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function WorkoutHistory() {
  const { state, dispatch } = useAppContext()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const completed = state.workoutSessions.filter((s) => s.status === 'completed')

  const filtered = useMemo(() => {
    return completed.filter((s) => {
      if (filterFrom && s.startedAt < filterFrom) return false
      if (filterTo && s.startedAt > filterTo + 'T23:59:59') return false
      return true
    })
  }, [completed, filterFrom, filterTo])

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>()
    for (const s of filtered) {
      const key = format(startOfMonth(parseISO(s.startedAt)), 'MMMM yyyy')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }, [filtered])

  const totalVolume = getTotalVolume(state.workoutSessions)
  const totalDuration = completed.reduce((sum, s) => sum + s.durationSeconds, 0)

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_SESSION', payload: id })
    setDeleteId(null)
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Workout History"
        subtitle={`${completed.length} sessions total`}
      />

      <div className="p-6 space-y-6 pb-24 md:pb-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Sessions" value={completed.length} icon={Activity} color="blue" />
          <StatCard
            label="Total Volume"
            value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            sublabel="lbs"
            icon={BarChart2}
            color="purple"
          />
          <StatCard
            label="Total Time"
            value={formatDuration(totalDuration)}
            icon={Clock}
            color="green"
          />
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-3 bg-[#111827] border border-[#1e2d40] rounded-xl p-4">
          <Filter size={16} className="text-slate-500 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="bg-[#1f2937] border border-[#2d3f55] text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="bg-[#1f2937] border border-[#2d3f55] text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            />
            {(filterFrom || filterTo) && (
              <button
                onClick={() => { setFilterFrom(''); setFilterTo('') }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Clear
              </button>
            )}
          </div>
          {filtered.length !== completed.length && (
            <span className="text-xs text-slate-500 flex-shrink-0">
              Showing {filtered.length} of {completed.length}
            </span>
          )}
        </div>

        {/* Session list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No sessions found"
            description="Complete workouts to see your history here."
          />
        ) : (
          Array.from(grouped.entries()).map(([month, sessions]) => (
            <div key={month} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                {month}
              </h3>
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  onDelete={() => setDeleteId(session.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Session"
        message="Are you sure you want to delete this workout session? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
