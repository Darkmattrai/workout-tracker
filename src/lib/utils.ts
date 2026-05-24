import { format, formatDistanceToNow, parseISO, startOfWeek, addWeeks } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MuscleGroup, Equipment, WeightUnit } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy')
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'MMM d')
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy · h:mm a')
}

export function timeAgo(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ''}`
  return `${s}s`
}

export function formatWeight(weight: number, unit: WeightUnit): string {
  return `${weight} ${unit}`
}

export function getWeekLabel(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  return format(start, 'MMM d')
}

export function getWeekStart(weeksAgo: number): Date {
  return startOfWeek(addWeeks(new Date(), -weeksAgo), { weekStartsOn: 1 })
}

export function muscleGroupLabel(mg: MuscleGroup): string {
  const labels: Record<MuscleGroup, string> = {
    chest: 'Chest',
    back: 'Back',
    shoulders: 'Shoulders',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Forearms',
    core: 'Core',
    quadriceps: 'Quads',
    hamstrings: 'Hamstrings',
    glutes: 'Glutes',
    calves: 'Calves',
    cardio: 'Cardio',
    full_body: 'Full Body',
  }
  return labels[mg]
}

export function equipmentLabel(eq: Equipment): string {
  const labels: Record<Equipment, string> = {
    barbell: 'Barbell',
    dumbbell: 'Dumbbell',
    cable: 'Cable',
    machine: 'Machine',
    bodyweight: 'Bodyweight',
    kettlebell: 'Kettlebell',
    band: 'Band',
    other: 'Other',
  }
  return labels[eq]
}

export function muscleGroupColor(mg: MuscleGroup): string {
  const colors: Record<MuscleGroup, string> = {
    chest: 'bg-red-500/20 text-red-400',
    back: 'bg-blue-500/20 text-blue-400',
    shoulders: 'bg-orange-500/20 text-orange-400',
    biceps: 'bg-purple-500/20 text-purple-400',
    triceps: 'bg-pink-500/20 text-pink-400',
    forearms: 'bg-yellow-500/20 text-yellow-400',
    core: 'bg-cyan-500/20 text-cyan-400',
    quadriceps: 'bg-green-500/20 text-green-400',
    hamstrings: 'bg-teal-500/20 text-teal-400',
    glutes: 'bg-indigo-500/20 text-indigo-400',
    calves: 'bg-lime-500/20 text-lime-400',
    cardio: 'bg-rose-500/20 text-rose-400',
    full_body: 'bg-violet-500/20 text-violet-400',
  }
  return colors[mg]
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
