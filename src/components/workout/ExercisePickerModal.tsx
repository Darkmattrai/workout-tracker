import React, { useState, useMemo } from 'react'
import { Search, Plus, ChevronDown } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { MuscleGroupBadge } from './MuscleGroupBadge'
import { useAppContext } from '../../context/AppContext'
import { Exercise, MuscleGroup, Equipment } from '../../types'
import { muscleGroupLabel, equipmentLabel, generateId } from '../../lib/utils'

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'cardio', 'full_body',
]

const ALL_EQUIPMENT: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band', 'other',
]

interface ExercisePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

export function ExercisePickerModal({ isOpen, onClose, onSelect }: ExercisePickerModalProps) {
  const { state, dispatch } = useAppContext()

  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null)
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // New exercise form state
  const [newName, setNewName] = useState('')
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('chest')
  const [newEquipment, setNewEquipment] = useState<Equipment>('barbell')

  const filtered = useMemo(() => {
    return state.exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
      const matchesMuscle = !muscleFilter || ex.primaryMuscle === muscleFilter || ex.muscleGroups.includes(muscleFilter)
      const matchesEquipment = !equipmentFilter || ex.equipment === equipmentFilter
      return matchesSearch && matchesMuscle && matchesEquipment
    })
  }, [state.exercises, search, muscleFilter, equipmentFilter])

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise)
    onClose()
    resetState()
  }

  const handleCreateCustom = () => {
    if (!newName.trim()) return
    const exercise: Exercise = {
      id: generateId(),
      name: newName.trim(),
      primaryMuscle: newMuscle,
      muscleGroups: [newMuscle],
      equipment: newEquipment,
      isCustom: true,
    }
    dispatch({ type: 'ADD_CUSTOM_EXERCISE', payload: exercise })
    handleSelect(exercise)
  }

  const resetState = () => {
    setSearch('')
    setMuscleFilter(null)
    setEquipmentFilter(null)
    setShowCreateForm(false)
    setNewName('')
    setNewMuscle('chest')
    setNewEquipment('barbell')
  }

  const handleClose = () => {
    onClose()
    resetState()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Select Exercise" className="max-w-2xl">
      <div className="space-y-4 -mt-2">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1f2937] border border-[#2d3f55] text-slate-100 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Muscle group filter */}
        <div>
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Muscle Group</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setMuscleFilter(null)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                !muscleFilter
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-[#2d3f55] text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            {ALL_MUSCLE_GROUPS.map((mg) => (
              <button
                key={mg}
                onClick={() => setMuscleFilter(mg === muscleFilter ? null : mg)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  muscleFilter === mg
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-[#2d3f55] text-slate-400 hover:text-slate-200'
                }`}
              >
                {muscleGroupLabel(mg)}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment filter */}
        <div>
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Equipment</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setEquipmentFilter(null)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                !equipmentFilter
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-[#2d3f55] text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            {ALL_EQUIPMENT.map((eq) => (
              <button
                key={eq}
                onClick={() => setEquipmentFilter(eq === equipmentFilter ? null : eq)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  equipmentFilter === eq
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-[#2d3f55] text-slate-400 hover:text-slate-200'
                }`}
              >
                {equipmentLabel(eq)}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="max-h-64 overflow-y-auto space-y-1 border border-[#1e2d40] rounded-lg">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No exercises found</div>
          ) : (
            filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleSelect(ex)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1f2937] transition-colors text-left border-b border-[#1e2d40] last:border-b-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{ex.name}</span>
                    {ex.isCustom && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{equipmentLabel(ex.equipment)}</p>
                </div>
                <MuscleGroupBadge muscle={ex.primaryMuscle} />
              </button>
            ))
          )}
        </div>

        {/* Create custom exercise */}
        <div className="border border-[#1e2d40] rounded-lg overflow-hidden">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-slate-200 hover:bg-[#1f2937] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus size={16} />
              Create Custom Exercise
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showCreateForm ? 'rotate-180' : ''}`}
            />
          </button>

          {showCreateForm && (
            <div className="px-4 pb-4 space-y-3 border-t border-[#1e2d40] pt-3">
              <Input
                label="Exercise Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Bulgarian Split Squat"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Primary Muscle</label>
                  <select
                    value={newMuscle}
                    onChange={(e) => setNewMuscle(e.target.value as MuscleGroup)}
                    className="w-full bg-[#1f2937] border border-[#2d3f55] text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {ALL_MUSCLE_GROUPS.map((mg) => (
                      <option key={mg} value={mg}>
                        {muscleGroupLabel(mg)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Equipment</label>
                  <select
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value as Equipment)}
                    className="w-full bg-[#1f2937] border border-[#2d3f55] text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {ALL_EQUIPMENT.map((eq) => (
                      <option key={eq} value={eq}>
                        {equipmentLabel(eq)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateCustom}
                disabled={!newName.trim()}
                className="w-full"
              >
                <Plus size={14} />
                Create & Add
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
