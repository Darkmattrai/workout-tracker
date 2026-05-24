import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ListChecks, FileUp } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { WorkoutCard } from '../components/workout/WorkoutCard'
import { PDFImportModal } from '../components/workout/PDFImportModal'
import { useAppContext } from '../context/AppContext'
import { MuscleGroup } from '../types'
import { muscleGroupLabel } from '../lib/utils'

const MUSCLE_FILTERS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'cardio', 'full_body',
]

export function WorkoutLibrary() {
  const { state, dispatch } = useAppContext()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showPDFImport, setShowPDFImport] = useState(false)

  const filtered = useMemo(() => {
    return state.workoutTemplates.filter((w) => {
      if (w.isArchived) return false
      const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase())
      const matchesMuscle = !muscleFilter || w.tags.includes(muscleFilter)
      return matchesSearch && matchesMuscle
    })
  }, [state.workoutTemplates, search, muscleFilter])

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_WORKOUT_TEMPLATE', payload: id })
    setDeleteId(null)
  }

  const handleDuplicate = (id: string) => {
    dispatch({ type: 'DUPLICATE_WORKOUT_TEMPLATE', payload: id })
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Workout Library"
        subtitle={`${state.workoutTemplates.filter((w) => !w.isArchived).length} workouts`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowPDFImport(true)}>
              <FileUp size={14} />
              Import PDF
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/workouts/create')}>
              <Plus size={14} />
              New Workout
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-5 pb-24 md:pb-6">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search workouts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-[#1e2d40] text-slate-100 rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Muscle group filter pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setMuscleFilter(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
              !muscleFilter
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-[#1e2d40] text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {MUSCLE_FILTERS.map((mg) => (
            <button
              key={mg}
              onClick={() => setMuscleFilter(mg === muscleFilter ? null : mg)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                muscleFilter === mg
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-[#1e2d40] text-slate-400 hover:text-slate-200'
              }`}
            >
              {muscleGroupLabel(mg)}
            </button>
          ))}
        </div>

        {/* Workout grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No workouts found"
            description={
              search || muscleFilter
                ? 'Try adjusting your search or filter.'
                : 'Create your first workout to get started.'
            }
            action={
              !search && !muscleFilter
                ? { label: 'Create Workout', onClick: () => navigate('/workouts/create') }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                exercises={state.exercises}
                onStart={() => navigate(`/log/${workout.id}`)}
                onEdit={() => navigate(`/workouts/${workout.id}/edit`)}
                onDuplicate={() => handleDuplicate(workout.id)}
                onDelete={() => setDeleteId(workout.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <PDFImportModal
        isOpen={showPDFImport}
        onClose={() => setShowPDFImport(false)}
        onImported={(id) => {
          setShowPDFImport(false)
          navigate(`/workouts/${id}/edit`)
        }}
      />
    </div>
  )
}
