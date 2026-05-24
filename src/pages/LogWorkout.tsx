import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Timer, StopCircle, X } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { ActiveSetRow } from '../components/session/ActiveSetRow'
import { RestTimer } from '../components/session/RestTimer'
import { WorkoutSummaryModal } from '../components/session/WorkoutSummaryModal'
import { ExercisePickerModal } from '../components/workout/ExercisePickerModal'
import { MuscleGroupBadge } from '../components/workout/MuscleGroupBadge'
import { useAppContext } from '../context/AppContext'
import {
  WorkoutSession,
  LoggedExercise,
  LoggedSet,
  Exercise,
  ExerciseTemplate,
} from '../types'
import { generateId, formatDuration, muscleGroupLabel } from '../lib/utils'
import { estimated1RM, computePersonalRecords } from '../lib/analytics'

function buildSessionFromTemplate(
  templateId: string,
  templates: { id: string; name: string; exercises: ExerciseTemplate[] }[],
  exercises: Exercise[]
): WorkoutSession {
  const template = templates.find((t) => t.id === templateId)
  const loggedExercises: LoggedExercise[] = template
    ? template.exercises.map((et, ei) => {
        const ex = exercises.find((e) => e.id === et.exerciseId)
        return {
          id: generateId(),
          exerciseId: et.exerciseId,
          exerciseName: ex?.name ?? 'Unknown',
          order: ei,
          sets: et.sets.map((s, si) => ({
            id: generateId(),
            templateSetId: s.id,
            setNumber: si + 1,
            type: s.type,
            targetReps: s.targetReps,
            targetWeight: s.targetWeight,
            actualReps: s.targetReps,
            actualWeight: s.targetWeight ?? 0,
            completed: false,
          })),
        }
      })
    : []

  return {
    id: generateId(),
    workoutTemplateId: templateId,
    workoutName: template?.name ?? 'Custom Workout',
    startedAt: new Date().toISOString(),
    durationSeconds: 0,
    exercises: loggedExercises,
    totalVolume: 0,
    totalSets: 0,
    status: 'active',
  }
}

function buildEmptySession(): WorkoutSession {
  return {
    id: generateId(),
    workoutName: 'Custom Workout',
    startedAt: new Date().toISOString(),
    durationSeconds: 0,
    exercises: [],
    totalVolume: 0,
    totalSets: 0,
    status: 'active',
  }
}

export function LogWorkout() {
  const { state, dispatch } = useAppContext()
  const navigate = useNavigate()
  const { workoutId } = useParams<{ workoutId: string }>()

  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null)
  const [resumePrompt, setResumePrompt] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check for existing active session on mount
  useEffect(() => {
    if (state.activeSession) {
      setResumePrompt(true)
    } else if (workoutId) {
      const newSession = buildSessionFromTemplate(workoutId, state.workoutTemplates, state.exercises)
      setSession(newSession)
      dispatch({ type: 'START_SESSION', payload: newSession })
    } else {
      const newSession = buildEmptySession()
      setSession(newSession)
      dispatch({ type: 'START_SESSION', payload: newSession })
    }
  }, [])

  // Timer
  useEffect(() => {
    if (!session) return
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [session?.id])

  const handleResume = () => {
    setSession(state.activeSession)
    setResumePrompt(false)
  }

  const handleDiscard = () => {
    dispatch({ type: 'ABANDON_SESSION' })
    setResumePrompt(false)
    if (workoutId) {
      const newSession = buildSessionFromTemplate(workoutId, state.workoutTemplates, state.exercises)
      setSession(newSession)
      dispatch({ type: 'START_SESSION', payload: newSession })
    } else {
      const newSession = buildEmptySession()
      setSession(newSession)
      dispatch({ type: 'START_SESSION', payload: newSession })
    }
  }

  const updateSession = useCallback((updated: WorkoutSession) => {
    setSession(updated)
    dispatch({ type: 'UPDATE_ACTIVE_SESSION', payload: updated })
  }, [dispatch])

  const handleUpdateSet = (exerciseId: string, updatedSet: LoggedSet) => {
    if (!session) return

    // Detect PR
    const prs = computePersonalRecords(state.workoutSessions)
    const existingPR = prs.find((pr) => {
      const ex = session.exercises.find((e) => e.id === exerciseId)
      return ex && pr.exerciseId === ex.exerciseId
    })
    const e1rm = estimated1RM(updatedSet.actualWeight, updatedSet.actualReps)
    const isPR = updatedSet.completed && updatedSet.actualWeight > 0 &&
      (!existingPR || e1rm > existingPR.bestEstimated1RM)

    const setWithPR = { ...updatedSet, isPR }

    const updated: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((s) => (s.id === updatedSet.id ? setWithPR : s)) }
          : ex
      ),
    }

    // Start rest timer when set is completed
    if (updatedSet.completed && !session.exercises
      .find((e) => e.id === exerciseId)
      ?.sets.find((s) => s.id === updatedSet.id)?.completed) {
      const exTemplate = state.workoutTemplates
        .flatMap((t) => t.exercises)
        .find((et) => {
          const ex = session.exercises.find((e) => e.id === exerciseId)
          return ex && et.exerciseId === ex.exerciseId
        })
      const restSecs = exTemplate?.sets.find((s) => s.id === updatedSet.templateSetId)?.restSeconds ?? 90
      setRestTimer({ seconds: restSecs })
    }

    updateSession(updated)
  }

  const handleAddExercise = (exercise: Exercise) => {
    if (!session) return
    const newEx: LoggedExercise = {
      id: generateId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      order: session.exercises.length,
      sets: [
        {
          id: generateId(),
          templateSetId: '',
          setNumber: 1,
          type: 'normal',
          targetReps: 10,
          actualReps: 10,
          actualWeight: 0,
          completed: false,
        },
      ],
    }
    updateSession({ ...session, exercises: [...session.exercises, newEx] })
  }

  const handleAddSet = (exerciseId: string) => {
    if (!session) return
    const ex = session.exercises.find((e) => e.id === exerciseId)
    if (!ex) return
    const lastSet = ex.sets[ex.sets.length - 1]
    const newSet: LoggedSet = {
      id: generateId(),
      templateSetId: '',
      setNumber: ex.sets.length + 1,
      type: 'normal',
      targetReps: lastSet?.targetReps ?? 10,
      targetWeight: lastSet?.targetWeight,
      actualReps: lastSet?.actualReps ?? 10,
      actualWeight: lastSet?.actualWeight ?? 0,
      completed: false,
    }
    updateSession({
      ...session,
      exercises: session.exercises.map((e) =>
        e.id === exerciseId ? { ...e, sets: [...e.sets, newSet] } : e
      ),
    })
  }

  const handleRemoveExercise = (exerciseId: string) => {
    if (!session) return
    updateSession({
      ...session,
      exercises: session.exercises.filter((e) => e.id !== exerciseId),
    })
  }

  const handleFinish = () => {
    if (!session) return
    const completedSets = session.exercises.flatMap((e) => e.sets).filter((s) => s.completed)
    const totalVolume = completedSets.reduce((sum, s) => sum + s.actualWeight * s.actualReps, 0)
    const finalSession: WorkoutSession = {
      ...session,
      completedAt: new Date().toISOString(),
      durationSeconds: elapsed,
      totalVolume,
      totalSets: completedSets.length,
      status: 'completed',
    }
    setSession(finalSession)
    setShowSummary(true)
  }

  const handleSave = () => {
    if (!session) return
    const completedSets = session.exercises.flatMap((e) => e.sets).filter((s) => s.completed)
    const totalVolume = completedSets.reduce((sum, s) => sum + s.actualWeight * s.actualReps, 0)
    dispatch({
      type: 'COMPLETE_SESSION',
      payload: {
        ...session,
        completedAt: session.completedAt ?? new Date().toISOString(),
        durationSeconds: elapsed,
        totalVolume,
        totalSets: completedSets.length,
        status: 'completed',
      },
    })
    navigate('/history')
  }

  const handleAbandon = () => {
    dispatch({ type: 'ABANDON_SESSION' })
    navigate('/')
  }

  // Resume prompt
  if (resumePrompt) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Active Workout" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-[#111827] border border-[#1e2d40] rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="p-4 bg-blue-500/10 rounded-full inline-flex">
              <Timer size={32} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Resume Workout?</h2>
            <p className="text-sm text-slate-400">
              You have an active workout: <strong className="text-slate-200">{state.activeSession?.workoutName}</strong>
            </p>
            <div className="flex gap-3">
              <Button variant="danger" size="md" onClick={handleDiscard} className="flex-1">
                Discard
              </Button>
              <Button variant="primary" size="md" onClick={handleResume} className="flex-1">
                Resume
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  const isPRForExercise = (exerciseId: string, set: LoggedSet) => {
    if (!set.completed || set.actualWeight <= 0) return false
    const prs = computePersonalRecords(state.workoutSessions)
    const ex = session.exercises.find((e) => e.id === exerciseId)
    if (!ex) return false
    const existingPR = prs.find((pr) => pr.exerciseId === ex.exerciseId)
    const e1rm = estimated1RM(set.actualWeight, set.actualReps)
    return !existingPR || e1rm > existingPR.bestEstimated1RM
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={session.workoutName}
        subtitle={`Elapsed: ${formatDuration(elapsed)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleAbandon}>
              <X size={14} />
              Abandon
            </Button>
            <Button variant="danger" size="sm" onClick={handleFinish}>
              <StopCircle size={14} />
              Finish
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-5 pb-24 md:pb-6 max-w-3xl mx-auto w-full">
        {/* Rest timer */}
        {restTimer && (
          <RestTimer
            seconds={restTimer.seconds}
            onComplete={() => setRestTimer(null)}
            onSkip={() => setRestTimer(null)}
          />
        )}

        {/* Exercises */}
        {session.exercises.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 text-sm mb-4">No exercises in this workout yet.</p>
            <Button variant="secondary" onClick={() => setShowPicker(true)}>
              <Plus size={14} />
              Add Exercise
            </Button>
          </div>
        ) : (
          session.exercises.map((loggedEx) => {
            const exercise = state.exercises.find((e) => e.id === loggedEx.exerciseId)
            return (
              <div
                key={loggedEx.id}
                className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 space-y-4"
              >
                {/* Exercise header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-100">{loggedEx.exerciseName}</h3>
                    {exercise && (
                      <div className="mt-1">
                        <MuscleGroupBadge muscle={exercise.primaryMuscle} />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(loggedEx.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Column headers */}
                <div className="flex items-center gap-3 px-3 text-xs text-slate-600">
                  <span className="w-5">#</span>
                  <span className="w-10">Type</span>
                  <span className="flex-1 text-center">Weight</span>
                  <span className="flex-1 text-center">Reps</span>
                  <span className="w-7" />
                </div>

                {/* Set rows */}
                <div className="space-y-2">
                  {loggedEx.sets.map((set, si) => (
                    <ActiveSetRow
                      key={set.id}
                      set={set}
                      setIndex={si}
                      onUpdate={(updated) => handleUpdateSet(loggedEx.id, updated)}
                      isPR={isPRForExercise(loggedEx.id, set)}
                    />
                  ))}
                </div>

                <button
                  onClick={() => handleAddSet(loggedEx.id)}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus size={13} />
                  Add Set
                </button>
              </div>
            )
          })
        )}

        {/* Add Exercise */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowPicker(true)}
          className="w-full"
        >
          <Plus size={14} />
          Add Exercise
        </Button>

        {/* Finish button */}
        <Button variant="danger" size="lg" onClick={handleFinish} className="w-full">
          <StopCircle size={16} />
          Finish Workout
        </Button>
      </div>

      <ExercisePickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddExercise}
      />

      {showSummary && session && (
        <WorkoutSummaryModal
          session={session}
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
