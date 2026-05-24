import { startOfWeek, parseISO, format, subWeeks, isAfter, isBefore, addDays } from 'date-fns'
import { WorkoutSession, PersonalRecord, WeeklyVolume, ExerciseDataPoint } from '../types'

export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  if (reps > 10) return weight // Epley formula unreliable above 10 reps
  return Math.round(weight * (1 + reps / 30))
}

export function getWeeklyVolume(sessions: WorkoutSession[], weeks = 8): WeeklyVolume[] {
  const result: WeeklyVolume[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 7)
    const label = format(weekStart, 'MMM d')

    const weekSessions = sessions.filter((s) => {
      if (s.status !== 'completed') return false
      const d = parseISO(s.startedAt)
      return isAfter(d, weekStart) && isBefore(d, weekEnd)
    })

    result.push({
      weekLabel: label,
      totalVolume: weekSessions.reduce((sum, s) => sum + s.totalVolume, 0),
      sessionCount: weekSessions.length,
    })
  }
  return result
}

export function getExerciseHistory(
  sessions: WorkoutSession[],
  exerciseId: string
): ExerciseDataPoint[] {
  const points: ExerciseDataPoint[] = []

  const sorted = [...sessions]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))

  for (const session of sorted) {
    for (const ex of session.exercises) {
      if (ex.exerciseId !== exerciseId) continue
      const completedSets = ex.sets.filter((s) => s.completed && s.actualWeight > 0)
      if (completedSets.length === 0) continue

      const maxWeight = Math.max(...completedSets.map((s) => s.actualWeight))
      const bestSet = completedSets.find((s) => s.actualWeight === maxWeight)!
      const volume = completedSets.reduce((sum, s) => sum + s.actualReps * s.actualWeight, 0)

      points.push({
        date: format(parseISO(session.startedAt), 'MMM d'),
        weight: maxWeight,
        reps: bestSet.actualReps,
        volume,
        estimated1RM: estimated1RM(maxWeight, bestSet.actualReps),
      })
    }
  }
  return points
}

export function computePersonalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const prMap = new Map<string, PersonalRecord>()

  const sorted = [...sessions]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))

  for (const session of sorted) {
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (!set.completed || set.actualWeight <= 0) continue
        const e1rm = estimated1RM(set.actualWeight, set.actualReps)
        const existing = prMap.get(ex.exerciseId)

        if (!existing || e1rm > existing.bestEstimated1RM || set.actualWeight > existing.maxWeight) {
          prMap.set(ex.exerciseId, {
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            maxWeight: Math.max(set.actualWeight, existing?.maxWeight ?? 0),
            maxReps: Math.max(set.actualReps, existing?.maxReps ?? 0),
            bestEstimated1RM: Math.max(e1rm, existing?.bestEstimated1RM ?? 0),
            achievedAt: session.startedAt,
          })
        }
      }
    }
  }

  return [...prMap.values()].sort((a, b) => b.bestEstimated1RM - a.bestEstimated1RM)
}

export function getCurrentStreak(sessions: WorkoutSession[]): number {
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .map((s) => format(parseISO(s.startedAt), 'yyyy-MM-dd'))
    .sort()
    .reverse()

  if (completed.length === 0) return 0

  const uniqueDays = [...new Set(completed)]
  let streak = 0
  let checkDate = new Date()

  // Allow today or yesterday as starting point
  const todayStr = format(checkDate, 'yyyy-MM-dd')
  const yesterdayStr = format(subWeeks(checkDate, 0), 'yyyy-MM-dd')

  if (!uniqueDays.includes(todayStr) && !uniqueDays.includes(yesterdayStr)) return 0

  for (const day of uniqueDays) {
    const expected = format(addDays(checkDate, -streak), 'yyyy-MM-dd')
    if (day === expected) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function getTotalVolume(sessions: WorkoutSession[]): number {
  return sessions
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.totalVolume, 0)
}

export function getSessionsThisWeek(sessions: WorkoutSession[]): number {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  return sessions.filter((s) => {
    if (s.status !== 'completed') return false
    return isAfter(parseISO(s.startedAt), weekStart)
  }).length
}
