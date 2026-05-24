import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, X, Layers } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { MuscleGroupBadge } from './MuscleGroupBadge'
import { useAppContext } from '../../context/AppContext'
import {
  extractTextFromPDF,
  parseAllWorkoutsFromText,
  convertToWorkoutTemplate,
  type ParsedWorkout,
  type ParsedExercise,
} from '../../lib/pdfParser'

interface Props {
  isOpen: boolean
  onClose: () => void
  onImported: (workoutId: string) => void
}

type Step = 'upload' | 'parsing' | 'preview' | 'error'

export function PDFImportModal({ isOpen, onClose, onImported }: Props) {
  const { state, dispatch } = useAppContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  // Support multiple workouts from one PDF
  const [parsedWorkouts, setParsedWorkouts] = useState<ParsedWorkout[]>([])
  const [activeWorkoutIdx, setActiveWorkoutIdx] = useState(0)
  const parsed = parsedWorkouts[activeWorkoutIdx] ?? null
  const [editedNames, setEditedNames] = useState<string[]>([])
  const editedName = editedNames[activeWorkoutIdx] ?? ''
  const [expandedEx, setExpandedEx] = useState<Set<number>>(new Set())

  const reset = () => {
    setStep('upload')
    setErrorMsg('')
    setFileName('')
    setParsedWorkouts([])
    setActiveWorkoutIdx(0)
    setEditedNames([])
    setExpandedEx(new Set())
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Please upload a PDF file.')
      setStep('error')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('File is too large (max 20 MB).')
      setStep('error')
      return
    }

    setFileName(file.name)
    setStep('parsing')

    try {
      const text = await extractTextFromPDF(file)
      if (!text.trim()) {
        throw new Error('Could not extract text from this PDF. It may be a scanned image.')
      }
      const results = parseAllWorkoutsFromText(text, state.exercises)
      const valid = results.filter((w) => w.exercises.length > 0)

      if (valid.length === 0) {
        throw new Error(
          'No exercises detected. Make sure the PDF contains exercise names (e.g. "Bench Press", "Squat") with sets and reps.'
        )
      }

      setParsedWorkouts(valid)
      setActiveWorkoutIdx(0)
      setEditedNames(valid.map((w) => w.name))
      setExpandedEx(new Set(valid[0].exercises.map((_, i) => i)))
      setStep('preview')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse PDF.')
      setStep('error')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const toggleExercise = (i: number) => {
    setExpandedEx((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const removeExercise = (i: number) => {
    if (!parsed) return
    const updated = { ...parsed, exercises: parsed.exercises.filter((_, idx) => idx !== i) }
    setParsedWorkouts((prev) => prev.map((w, wi) => wi === activeWorkoutIdx ? updated : w))
    setExpandedEx((prev) => {
      const next = new Set<number>()
      prev.forEach((v) => { if (v < i) next.add(v); else if (v > i) next.add(v - 1) })
      return next
    })
  }

  const updateSetReps = (exIdx: number, setIdx: number, reps: number) => {
    if (!parsed) return
    const exercises = parsed.exercises.map((ex, ei) =>
      ei !== exIdx ? ex : { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, reps } : s) }
    )
    setParsedWorkouts((prev) => prev.map((w, wi) => wi === activeWorkoutIdx ? { ...w, exercises } : w))
  }

  const updateSetWeight = (exIdx: number, setIdx: number, weight: number | undefined) => {
    if (!parsed) return
    const exercises = parsed.exercises.map((ex, ei) =>
      ei !== exIdx ? ex : { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, weight } : s) }
    )
    setParsedWorkouts((prev) => prev.map((w, wi) => wi === activeWorkoutIdx ? { ...w, exercises } : w))
  }

  const setEditedNameForCurrent = (name: string) => {
    setEditedNames((prev) => prev.map((n, i) => i === activeWorkoutIdx ? name : n))
  }

  const switchWorkout = (idx: number) => {
    setActiveWorkoutIdx(idx)
    setExpandedEx(new Set(parsedWorkouts[idx]?.exercises.map((_, i) => i) ?? []))
  }

  const importCurrentWorkout = () => {
    if (!parsed) return
    const template = convertToWorkoutTemplate({ ...parsed, name: editedName }, state.exercises)

    parsed.exercises.forEach((pe, i) => {
      if (!pe.matchedExercise) {
        const exId = template.exercises[i]?.exerciseId
        if (exId && !state.exercises.find((e) => e.id === exId)) {
          dispatch({
            type: 'ADD_CUSTOM_EXERCISE',
            payload: { id: exId, name: pe.name, primaryMuscle: 'full_body', muscleGroups: ['full_body'], equipment: 'other', isCustom: true },
          })
        }
      }
    })

    dispatch({ type: 'SAVE_WORKOUT_TEMPLATE', payload: template })
    return template.id
  }

  const handleImportAll = () => {
    let lastId = ''
    parsedWorkouts.forEach((w, i) => {
      const template = convertToWorkoutTemplate({ ...w, name: editedNames[i] ?? w.name }, state.exercises)
      w.exercises.forEach((pe, ei) => {
        if (!pe.matchedExercise) {
          const exId = template.exercises[ei]?.exerciseId
          if (exId && !state.exercises.find((e) => e.id === exId)) {
            dispatch({ type: 'ADD_CUSTOM_EXERCISE', payload: { id: exId, name: pe.name, primaryMuscle: 'full_body', muscleGroups: ['full_body'], equipment: 'other', isCustom: true } })
          }
        }
      })
      dispatch({ type: 'SAVE_WORKOUT_TEMPLATE', payload: template })
      lastId = template.id
    })
    handleClose()
    if (lastId) onImported(lastId)
  }

  const handleImport = () => {
    const id = importCurrentWorkout()
    handleClose()
    if (id) onImported(id)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Workout from PDF">
      {/* UPLOAD STEP */}
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Upload a PDF containing your workout plan. The app will detect exercises, sets, reps, and weights automatically.
          </p>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-[#2d3f55] hover:border-blue-500/60 hover:bg-[#1f2937]'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Upload size={24} className="text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-slate-200 font-medium">Drop your PDF here</p>
              <p className="text-slate-500 text-sm mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-slate-600">PDF files up to 20 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          <div className="bg-[#1f2937] rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-medium text-slate-300">PDF formats that work best:</p>
            {[
              '"Bench Press — 3x10 @ 135lbs"',
              '"Squat\\n3 sets of 5 reps\\n225 lbs"',
              '"Pull-Up 4×8"',
            ].map((ex) => (
              <p key={ex} className="text-xs text-slate-500 font-mono pl-2">
                {ex}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* PARSING STEP */}
      {step === 'parsing' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 size={40} className="text-blue-400 animate-spin" />
          <div className="text-center">
            <p className="text-slate-200 font-medium">Parsing "{fileName}"</p>
            <p className="text-slate-500 text-sm mt-1">Detecting exercises, sets, and reps…</p>
          </div>
        </div>
      )}

      {/* ERROR STEP */}
      {step === 'error' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <AlertCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-300 font-medium text-sm">Import failed</p>
              <p className="text-red-400/80 text-sm mt-1">{errorMsg}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={reset} className="w-full">
            Try Another File
          </Button>
        </div>
      )}

      {/* PREVIEW STEP */}
      {step === 'preview' && parsed && (
        <div className="space-y-4">
          {/* Success banner */}
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-green-300 text-sm font-medium">
              {parsedWorkouts.length > 1
                ? `${parsedWorkouts.length} workouts detected (${parsedWorkouts.reduce((s, w) => s + w.exercises.length, 0)} exercises total)`
                : `${parsed.exercises.length} exercise${parsed.exercises.length !== 1 ? 's' : ''} detected`}
            </span>
          </div>

          {/* Multi-workout tabs */}
          {parsedWorkouts.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {parsedWorkouts.map((w, i) => (
                <button
                  key={i}
                  onClick={() => switchWorkout(i)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    i === activeWorkoutIdx
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-[#2d3f55] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers size={11} />
                  {w.name} <span className="opacity-60">({w.exercises.length})</span>
                </button>
              ))}
            </div>
          )}

          {/* Workout name */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Workout Name
            </label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedNameForCurrent(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#2d3f55] text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Exercise list */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Exercises — review & edit
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {parsed.exercises.map((ex, ei) => (
                <ExercisePreviewRow
                  key={`${activeWorkoutIdx}-${ei}`}
                  exercise={ex}
                  index={ei}
                  expanded={expandedEx.has(ei)}
                  onToggle={() => toggleExercise(ei)}
                  onRemove={() => removeExercise(ei)}
                  onUpdateReps={(si, reps) => updateSetReps(ei, si, reps)}
                  onUpdateWeight={(si, w) => updateSetWeight(ei, si, w)}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={reset} className="flex-1">
              ← Re-upload
            </Button>
            {parsedWorkouts.length > 1 ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleImport}
                  disabled={parsed.exercises.length === 0 || !editedName.trim()}
                >
                  This one
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImportAll}
                  className="flex-1"
                >
                  Import All ({parsedWorkouts.length})
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={parsed.exercises.length === 0 || !editedName.trim()}
                className="flex-1"
              >
                Add to Library
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── Exercise Preview Row ─────────────────────────────────────────────────────

function ExercisePreviewRow({
  exercise,
  index,
  expanded,
  onToggle,
  onRemove,
  onUpdateReps,
  onUpdateWeight,
}: {
  exercise: ParsedExercise
  index: number
  expanded: boolean
  onToggle: () => void
  onRemove: () => void
  onUpdateReps: (setIndex: number, reps: number) => void
  onUpdateWeight: (setIndex: number, weight: number | undefined) => void
}) {
  const matched = exercise.matchedExercise

  return (
    <div className="bg-[#1f2937] border border-[#2d3f55] rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-[#263040]"
        onClick={onToggle}
      >
        <span className="text-slate-500 text-xs w-5 shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="text-slate-100 text-sm font-medium truncate">{exercise.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {matched ? (
              <MuscleGroupBadge muscle={matched.primaryMuscle} />
            ) : (
              <span className="text-xs text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
                Custom
              </span>
            )}
            <span className="text-xs text-slate-500">
              {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-1 text-slate-600 hover:text-red-400 transition-colors"
          title="Remove exercise"
        >
          <X size={14} />
        </button>
        {expanded ? (
          <ChevronUp size={14} className="text-slate-500 shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-slate-500 shrink-0" />
        )}
      </div>

      {/* Sets detail */}
      {expanded && (
        <div className="border-t border-[#1e2d40] px-3 py-2 space-y-1.5">
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium px-1">
            <span>Set</span>
            <span>Reps</span>
            <span>Weight</span>
          </div>
          {exercise.sets.map((s, si) => (
            <div key={si} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-xs text-slate-500 px-1">{si + 1}</span>
              <input
                type="number"
                value={s.reps}
                min={1}
                onChange={(e) => onUpdateReps(si, parseInt(e.target.value) || 1)}
                className="bg-[#111827] border border-[#2d3f55] text-slate-100 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full"
              />
              <input
                type="number"
                value={s.weight ?? ''}
                min={0}
                placeholder="—"
                onChange={(e) => onUpdateWeight(si, e.target.value ? parseFloat(e.target.value) : undefined)}
                className="bg-[#111827] border border-[#2d3f55] text-slate-100 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 w-full placeholder:text-slate-600"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
