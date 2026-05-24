export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'cardio'
  | 'full_body'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other'

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure'

export type WeightUnit = 'lbs' | 'kg'

export interface Exercise {
  id: string
  name: string
  muscleGroups: MuscleGroup[]
  primaryMuscle: MuscleGroup
  equipment: Equipment
  instructions?: string
  isCustom: boolean
}

export interface SetTemplate {
  id: string
  type: SetType
  targetReps: number
  targetWeight?: number
  restSeconds: number
}

export interface ExerciseTemplate {
  id: string
  exerciseId: string
  order: number
  sets: SetTemplate[]
  notes?: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  tags: MuscleGroup[]
  exercises: ExerciseTemplate[]
  estimatedMinutes: number
  createdAt: string
  updatedAt: string
  isArchived: boolean
}

export interface LoggedSet {
  id: string
  templateSetId: string
  setNumber: number
  type: SetType
  targetReps: number
  targetWeight?: number
  actualReps: number
  actualWeight: number
  completed: boolean
  completedAt?: string
  isPR?: boolean
}

export interface LoggedExercise {
  id: string
  exerciseId: string
  exerciseName: string
  order: number
  sets: LoggedSet[]
  notes?: string
}

export interface WorkoutSession {
  id: string
  workoutTemplateId?: string
  workoutName: string
  startedAt: string
  completedAt?: string
  durationSeconds: number
  exercises: LoggedExercise[]
  totalVolume: number
  totalSets: number
  notes?: string
  status: 'active' | 'completed' | 'abandoned'
}

export interface PersonalRecord {
  exerciseId: string
  exerciseName: string
  maxWeight: number
  maxReps: number
  bestEstimated1RM: number
  achievedAt: string
}

export interface WeeklyVolume {
  weekLabel: string
  totalVolume: number
  sessionCount: number
}

export interface ExerciseDataPoint {
  date: string
  weight: number
  reps: number
  volume: number
  estimated1RM: number
}

export interface UserProfile {
  name: string
  avatarInitials: string
  weightUnit: WeightUnit
  fitnessGoal: 'strength' | 'hypertrophy' | 'endurance' | 'general'
  joinedAt: string
}

// ─── Training Plans & Calendar ───────────────────────────────────────────────

export interface WeeklyScheduleDay {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6   // 0 = Sunday
  workoutTemplateId: string | null          // null = rest day
  label: string                             // "Workout A", "Cardio", "Rest"
  color?: string                            // optional color hint from PDF
}

export interface ScheduledEntry {
  id: string
  date: string                              // YYYY-MM-DD
  workoutTemplateId: string | null
  label: string
  completedSessionId?: string
  status: 'scheduled' | 'completed' | 'rest' | 'skipped'
}

export interface TrainingPlan {
  id: string
  name: string
  startDate: string                         // YYYY-MM-DD
  durationWeeks: number
  weeklySchedule: WeeklyScheduleDay[]
  entries: ScheduledEntry[]
  createdAt: string
}

export interface AppState {
  profile: UserProfile
  exercises: Exercise[]
  workoutTemplates: WorkoutTemplate[]
  workoutSessions: WorkoutSession[]
  activeSession: WorkoutSession | null
  trainingPlans: TrainingPlan[]
  activePlanId: string | null
}
