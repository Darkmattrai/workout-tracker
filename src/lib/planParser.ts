import { format, addDays, nextMonday } from 'date-fns'
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

function extractDayIndex(text: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined {
  const m = text.toLowerCase().trim().match(/^(sun|mon|tue|wed|thu|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/)
  return m ? DAY_MAP[m[1]] : undefined
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
    .map((l) => l.replace(/ {2,}/g, ' ').trim())
    .filter(Boolean)

  const schedule: ParsedScheduleDay[] = []
  const seen = new Set<number>()

  // ── Strategy 0: Horizontal card layout ──────────────────────────────────
  // Handles PDFs where all day names appear on one tab-separated line:
  // "MON\tTUE\tWED\tTHU\tFRI\tSAT\tSUN"
  // "Full Body\tFull Body\tCardio\tFull Body\tFull Body\tRest\tRest"
  // "Workout A\tWorkout B\tNEAT day\tWorkout A\tWorkout B\tWalk / stretch\tMeal prep"
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('\t')) continue
    const cols = lines[i].split('\t').map((c) => c.trim())
    const dayIndices = cols.map((c) => extractDayIndex(c))
    const validDayCount = dayIndices.filter((d) => d !== undefined).length
    if (validDayCount < 2) continue

    // Collect subsequent tab-separated rows as label content.
    // Stop if the row looks like stats (numbers with units, e.g. "4×", "~350 KCAL", "0.8kg").
    const STAT_ROW = /^[~\d]|^\d+\s*[xX×]/
    const labelsByCol: string[][] = cols.map(() => [])
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      if (!lines[j].includes('\t')) break
      const contentCols = lines[j].split('\t').map((c) => c.trim())
      // If the majority of non-empty columns look like stats, stop
      const nonEmpty = contentCols.filter(Boolean)
      const statLike = nonEmpty.filter((c) => STAT_ROW.test(c)).length
      if (nonEmpty.length > 0 && statLike / nonEmpty.length >= 0.5) break
      for (let k = 0; k < Math.min(cols.length, contentCols.length); k++) {
        if (contentCols[k]) labelsByCol[k].push(contentCols[k])
      }
    }

    for (let k = 0; k < cols.length; k++) {
      const dayIdx = dayIndices[k]
      if (dayIdx === undefined || seen.has(dayIdx)) continue
      seen.add(dayIdx)
      const label = labelsByCol[k].join(' ').replace(/\s+/g, ' ').trim() || 'Workout'
      schedule.push({ dayOfWeek: dayIdx, label, isRest: isRestLabel(label) })
    }
    if (schedule.length >= 2) break
  }

  // ── Strategy 1: Vertical layout ─────────────────────────────────────────
  // Each day on its own line: "MON" then "Full Body Workout A"
  if (schedule.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lower = line.toLowerCase().trim()
      const dayMatch = lower.match(/^(sun|mon|tue|wed|thu|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b(.*)/)
      if (!dayMatch) continue
      const dayIndex = DAY_MAP[dayMatch[1]]
      const remainder = dayMatch[2].trim()
      if (seen.has(dayIndex)) continue
      seen.add(dayIndex)

      const labelParts = remainder ? [remainder] : []
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const next = lines[j].toLowerCase()
        if (Object.keys(DAY_MAP).some((d) => next.startsWith(d))) break
        if (lines[j].length < 40) labelParts.push(lines[j])
        else break
      }
      const rawLabel = labelParts.join(' ').replace(/\s+/g, ' ').trim() || 'Workout'
      const label = rawLabel.replace(/^\d+\s*[.)-]\s*/, '').trim()
      schedule.push({ dayOfWeek: dayIndex, label: label || 'Workout', isRest: isRestLabel(label) })
    }
  }

  // ── Strategy 2: "Day 1 / Day 2 / …" numbered format ─────────────────────
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
  let durationWeeks = 8
  const durMatch = rawText.match(/(\d+)\s*[-–]?\s*weeks?/i)
  if (durMatch) durationWeeks = Math.min(Math.max(parseInt(durMatch[1]), 1), 52)

  // Extract plan name: first short meaningful line that isn't a day name, pure numbers, or all-caps run-on
  let name = 'Training Plan'
  for (const line of lines) {
    const clean = line.replace(/\t.*/, '').trim()
    if (
      clean.length > 3 &&
      clean.length < 60 &&
      !Object.keys(DAY_MAP).some((d) => clean.toLowerCase().startsWith(d)) &&
      !/^\d/.test(clean) &&           // skip lines starting with numbers
      !/^[A-Z\s]{10,}$/.test(clean)   // skip all-caps run-on words (like YOURPERSONALFITNESSPLAN)
    ) {
      name = clean
      break
    }
  }

  // Sort Mon → Sun (Sun wraps to 7)
  schedule.sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek))

  return { name, durationWeeks, schedule }
}

// ─── Match schedule labels to workout templates ───────────────────────────────

function matchTemplateForLabel(label: string, templates: WorkoutTemplate[]): WorkoutTemplate | null {
  const lower = label.toLowerCase()
  const exact = templates.find((t) => t.name.toLowerCase() === lower)
  if (exact) return exact
  const contains = templates.find(
    (t) => lower.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(lower)
  )
  if (contains) return contains
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
  const start = startDate ?? nextMonday(new Date())
  const entries = generateEntries(start, parsed.durationWeeks, parsed.schedule, templates)

  const weeklySchedule: WeeklyScheduleDay[] = parsed.schedule.map((s) => {
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
    weeklySchedule,
    entries,
    createdAt: new Date().toISOString(),
  }
}

// Re-export for use in Calendar
export { matchTemplateForLabel }
