import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, ChevronUp, ChevronDown, ArrowLeft, Save } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ExercisePickerModal } from '../components/workout/ExercisePickerModal'
import { MuscleGroupBadge } from '../components/workout/MuscleGroupBadge'
import { useAppContext } from '../context/AppContext'
import { WorkoutTemplate, ExerciseTemplate, SetTemplate, MuscleGroup, Exercise, SetType } from '../types'
import { generateId, muscleGroupLabel } from '../lib/utils'

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'cardio', 'full_body',
]

const SET_TYPES: SetType[] = ['normal', 'warmup', 'dropset', 'failure']

function makeDefaultSet(): SetTemplate {
  return {
    id: generateId(),
    type: 'normal',
    targetReps: 10,
    targetWeight: 0,
    restSeconds: 90,
  }
}

interface SetRowProps {
  set: SetTemplate
  onChange: (updated: SetTemplate) => void
  onRemove: () => void
}

function SetRow({ set, onChange, onRemove }: SetRowProps) {
  return (
    <div className="flex items-center gap-2 bg-[#0a0f1e] rounded-lg px-3 py-2">
      <select
        value={set.type}
        onChange={(e) => onChange({ ...set, type: e.target.value as SetType })}
        className="bg-[#1f2937] border border-[#2d3f55] text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
      >
        {SET_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          value={set.targetReps}
          onChange={(e) => onChange({ ...set, targetReps: parseInt(e.target.value) || 0 })}
          placeholder="Reps"
          className="w-full bg-[#1f2937] border border-[#2d3f55] text-slate-100 rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-slate-600">reps</span>
      </div>
      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          value={set.targetWeight ?? 0}
          onChange={(e) => onChange({ ...set, targetWeight: parseFloat(e.target.value) || 0 })}
          placeholder="Weight"
          className="w-full bg-[#1f2937] border border-[#2d3f55] text-slate-100 rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-slate-600">lbs</span>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={set.restSeconds}
          onChange={(e) => onChange({ ...set, restSeconds: parseInt(e.target.value) || 60 })}
          placeholder="Rest"
          className="w-16 bg-[#1f2937] border border-[#2d3f55] text-slate-100 rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-slate-600">s rest</span>
      </div>
      <button
        onClick={onRemove}
        className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

export function CreateWorkout() {
  const { state, dispatch } = useAppContext()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const existing = id ? state.workoutTemplates.find((t) => t.id === id) : null

  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [tags, setTags] = useState<MuscleGroup[]>(existing?.tags ?? [])
  const [exercises, setExercises] = useState<ExerciseTemplate[]>(existing?.exercises ?? [])
  const [showPicker, setShowPicker] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setDescription(existing.description ?? '')
      setTags(existing.tags)
      setExercises(existing.exercises)
    }
  }, [id])

  const estimatedMinutes = exercises.reduce((sum, ex) => {
    return sum + ex.sets.reduce((s, set) => s + Math.ceil(set.restSeconds / 60) + 1, 0)
  }, 0)

  const toggleTag = (mg: MuscleGroup) => {
    setTags((prev) =>
      prev.includes(mg) ? prev.filter((t) => t !== mg) : [...prev, mg]
    )
  }

  const handleAddExercise = (exercise: Exercise) => {
    const et: ExerciseTemplate = {
      id: generateId(),
      exerciseId: exercise.id,
      order: exercises.length,
      sets: [makeDefaultSet()],
    }
    setExercises((prev) => [...prev, et])
  }

  const handleRemoveExercise = (etId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== etId))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setExercises((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next.map((e, i) => ({ ...e, order: i }))
    })
  }

  const handleMoveDown = (index: number) => {
    if (index === exercises.length - 1) return
    setExercises((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next.map((e, i) => ({ ...e, order: i }))
    })
  }

  const handleUpdateSet = (etId: string, setId: string, updated: SetTemplate) => {
    setExercises((prev) =>
      prev.map((et) =>
        et.id === etId
          ? { ...et, sets: et.sets.map((s) => (s.id === setId ? updated : s)) }
          : et
      )
    )
  }

  const handleAddSet = (etId: string) => {
    setExercises((prev) =>
      prev.map((et) =>
        et.id === etId ? { ...et, sets: [...et.sets, makeDefaultSet()] } : et
      )
    )
  }

  const handleRemoveSet = (etId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((et) =>
        et.id === etId ? { ...et, sets: et.sets.filter((s) => s.id !== setId) } : et
      )
    )
  }

  const handleSave = () => {
    if (!name.trim()) {
      setNameError('Workout name is required')
      return
    }

    const template: WorkoutTemplate = {
      id: existing?.id ?? generateId(),
      name: name.trim(),
      description: description.trim() || undefined,
      tags,
      exercises,
      estimatedMinutes,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
    }

    dispatch({ type: 'SAVE_WORKOUT_TEMPLATE', payload: template })
    navigate('/workouts')
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={existing ? 'Edit Workout' : 'Create Workout'}
        subtitle={`~${estimatedMinutes} min estimated`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} />
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              <Save size={14} />
              Save
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 pb-24 md:pb-6 max-w-3xl mx-auto w-full">
        {/* Basic info */}
        <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Details</h3>
          <Input
            label="Workout Name"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError('') }}
            placeholder="e.g. Push Day A"
            error={nameError}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this workout..."
              rows={2}
              className="w-full bg-[#1f2937] border border-[#2d3f55] text-slate-100 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Muscle Groups</h3>
          <div className="flex flex-wrap gap-2">
            {ALL_MUSCLE_GROUPS.map((mg) => (
              <button
                key={mg}
                onClick={() => toggleTag(mg)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  tags.includes(mg)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-[#2d3f55] text-slate-400 hover:text-slate-200'
                }`}
              >
                {muscleGroupLabel(mg)}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises */}
        <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Exercises ({exercises.length})
            </h3>
            <Button variant="secondary" size="sm" onClick={() => setShowPicker(true)}>
              <Plus size={14} />
              Add Exercise
            </Button>
          </div>

          {exercises.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500 mb-3">No exercises added yet</p>
              <Button variant="ghost" size="sm" onClick={() => setShowPicker(true)}>
                <Plus size={14} />
                Add First Exercise
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((et, index) => {
                const exercise = state.exercises.find((e) => e.id === et.exerciseId)
                return (
                  <div
                    key={et.id}
                    className="bg-[#0a0f1e] border border-[#1e2d40] rounded-xl p-4 space-y-3"
                  >
                    {/* Exercise header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-200">
                          {exercise?.name ?? 'Unknown Exercise'}
                        </p>
                        {exercise && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {muscleGroupLabel(exercise.primaryMuscle)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === exercises.length - 1}
                          className="p-1 rounded text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveExercise(et.id)}
                          className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors ml-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Set header labels */}
                    {et.sets.length > 0 && (
                      <div className="flex items-center gap-2 px-3 text-xs text-slate-600">
                        <span className="w-16">Type</span>
                        <span className="flex-1 text-center">Reps</span>
                        <span className="flex-1 text-center">Weight</span>
                        <span className="w-20 text-center">Rest</span>
                        <span className="w-5" />
                      </div>
                    )}

                    {/* Set rows */}
                    <div className="space-y-2">
                      {et.sets.map((set) => (
                        <SetRow
                          key={set.id}
                          set={set}
                          onChange={(updated) => handleUpdateSet(et.id, set.id, updated)}
                          onRemove={() => handleRemoveSet(et.id, set.id)}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddSet(et.id)}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Plus size={13} />
                      Add Set
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Save button (bottom) */}
        <Button variant="primary" size="lg" onClick={handleSave} className="w-full">
          <Save size={16} />
          {existing ? 'Save Changes' : 'Create Workout'}
        </Button>
      </div>

      <ExercisePickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddExercise}
      />
    </div>
  )
}
