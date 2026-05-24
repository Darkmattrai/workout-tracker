import { format, addDays, nextMonday, parseISO } from 'date-fns'
import type { WorkoutTemplate, TrainingPlan, WeeklyScheduleDay, ScheduledEntry } from '../types'
import { generateId } from './utils'

// ─── Day name → dayOfWeek index ──────────────────────────────────────────────

const DAY_MAP: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

const REST_KEYWORDS = ['rest', 'off', 'recovery', 'active recovery', 'meal prep', 'stretch', 'walk', 'neat', 'cardio day', 'light cardio']

function isRestLabel(label: string): boolean {
  const lower = label.toLowerCase()
  return REST_KEYWORDS.some((k) => lower.includes(k))
}

// ─── Extract weekly schedule ─────────────────────────────────────────────────

export interface ParsedScheduleDay {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  label: string
  isRest: boolean
}

export interface ParsedPlan {
  name: string
  durationWeeks: number
  schedule: ParsedScheduleDay[]
}

export function parsePlanFromText(rawText: string): ParsedPlan {
  const lines = rawText
    .split(/[\n\r]+/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const schedule: ParsedScheduleDay[] = []
  const seen = new Set<number>()

  // Strategy 1: look for day-name lines followed by workout name
  // e.g. "MON\nFull Body\nWorkout A" OR "MON Full Body Workout A"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lower = line.toLowerCase().trim()

    // Check if this line is a day abbreviation/name (possibly followed by content)
    let dayIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined
    let remainder = ''

    // Try "MON", "TUE", etc. at the start
    const dayMatch = lower.match(/^(sun|mon|tue|wed|thu|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b(.*)/)
    if (dayMatch) {
      dayIndex = DAY_MAP[dayMatch[1]]
      remainder = dayMatch[2].trim()
    }

    if (dayIndex === undefined || seen.has(dayIndex)) continue
    seen.add(dayIndex)

    // Collect label: remainder on this line + next 1-2 lines
    let labelParts = remainder ? [remainder] : []
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      const next = lines[j].toLowerCase()
      // Stop if next line is another day name
      if (Object.keys(DAY_MAP).some((d) => next.startsWith(d))) break
      if (lines[j].length < 40) labelParts.push(lines[j])
      else break
    }

    const rawLabel = labelParts.join(' ').replace(/\s+/g, ' ').trim() || 'Workout'
    // Clean up: strip numeric prefixes, keep meaningful words
    const label = rawLabel.replace(/^\d+\s*[.)-]\s*/, '').trim()

    schedule.push({
      dayOfWeek: dayIndex,
      label: label || 'Workout',
      isRest: isRestLabel(label),
    })
  }

  // Strategy 2: Look for "Day 1 / Day 2 / …" patterns if strategy 1 found nothing
  if (schedule.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^day\s*(\d+)\s*[:-]?\s*(.*)/i)
      if (!m) continue
      const n = parseInt(m[1]) - 1
      if (n < 0 || n > 6) continue
      const dayIndex = [1, 2, 3, 4, 5, 6, 0][n] as 0 | 1 | 2 | 3 | 4 | 5 | 6
      if (seen.has(dayIndex)) continue
      seen.add(dayIndex)
      const label = m[2].trim() || lines[i + 1]?.trim() || 'Workout'
      schedule.push({ dayOfWeek: dayIndex, label, isRest: isRestLabel(label) })
    }
  }

  // Extract duration: "8-week", "4 weeks", "12 weeks", etc.
  let durationWeeks = 8  // default
  const durMatch = rawText.match(/(\d+)\s*[-–]?\s*weeks?/i)
  if (durMatch) durationWeeks = Math.min(Math.max(parseInt(durMatch[1]), 1), 52)

  // Extract plan name
  let name = 'Training Plan'
  // First meaningful line that's not a day name and isn't too long
  for (const line of lines) {
    if (line.length > 5 && line.length < 60 && !Object.keys(DAY_MAP).some((d) => line.toLowerCase().startsWith(d))) {
      name = line
      break
    }
  }

  // Sort schedule Mon → Sun
  schedule.sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek))

  return { name, durationWeeks, schedule }
}

// ─── Match schedule labels to workout templates ───────────────────────────────

function matchTemplateForLabel(label: string, templates: WorkoutTemplate[]): WorkoutTemplate | null {
  const lower = label.toLowerCase()

  // Direct name match
  const exact = templates.find((t) => t.name.toLowerCase() === lower)
  if (exact) return exact

  // Contains match: "Workout A" matches template named "Workout A"
  const contains = templates.find(
    (t) => lower.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(lower)
  )
  if (contains) return contains

  // Word overlap
  const labelWords = lower.split(/\s+/).filter((w) => w.length > 2)
  let best: WorkoutTemplate | null = null
  let bestScore = 0
  for (const t of templates) {
    const tWords = t.name.toLowerCase().split(/\s+/)
    const score = labelWords.filter((w) => tWords.includes(w)).length
    if (score > bestScore) { bestScore = score; best = t }
  }
  if (bestScore >= 1) return best

  return null
}

// ─── Generate all dated entries for the plan ─────────────────────────────────

function generateEntries(
  startDate: Date,
  durationWeeks: number,
  schedule: ParsedScheduleDay[],
  templates: WorkoutTemplate[]
): ScheduledEntry[] {
  const entries: ScheduledEntry[] = []
  const totalDays = durationWeeks * 7

  for (let d = 0; d < totalDays; d++) {
    const date = addDays(startDate, d)
    const dow = date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6
    const sched = schedule.find((s) => s.dayOfWeek === dow)
    if (!sched) continue

    const template = sched.isRest ? null : matchTemplateForLabel(sched.label, templates)

    entries.push({
      id: generateId(),
      date: format(date, 'yyyy-MM-dd'),
      workoutTemplateId: template?.id ?? null,
      label: sched.label,
      status: sched.isRest ? 'rest' : 'scheduled',
    })
  }

  return entries
}

// ─── Build a full TrainingPlan ────────────────────────────────────────────────

export function buildTrainingPlan(
  parsed: ParsedPlan,
  templates: WorkoutTemplate[],
  startDate?: Date
): TrainingPlan {
  // Default start: next Monday (clean week start)
  const start = startDate ?? nextMonday(new Date())
  const entries = generateEntries(start, parsed.durationWeeks, parsed.schedule, templates)

  const schedule: WeeklyScheduleDay[] = parsed.schedule.map((s) => {
    const template = s.isRest ? null : matchTemplateForLabel(s.label, templates)
    return {
      dayOfWeek: s.dayOfWeek,
      workoutTemplateId: template?.id ?? null,
      label: s.label,
    }
  })

  return {
    id: generateId(),
    name: parsed.name,
    startDate: format(start, 'yyyy-MM-dd'),
    durationWeeks: parsed.durationWeeks,
    weeklySchedule: schedule,
    entries,
    createdAt: new Date().toISOString(),
  }
}

// Re-export for use in Calendar
export { matchTemplateForLabel }
