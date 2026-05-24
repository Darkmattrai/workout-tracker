import * as pdfjsLib from 'pdfjs-dist'
import type { Exercise, ExerciseTemplate, SetTemplate, WorkoutTemplate, MuscleGroup } from '../types'
import { generateId } from './utils'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedSet {
  reps: number
  weight?: number
}

export interface ParsedExercise {
  name: string
  matchedExercise?: Exercise
  sets: ParsedSet[]
}

export interface ParsedWorkout {
  name: string
  exercises: ParsedExercise[]
}

// ─── PDF Text Extraction ──────────────────────────────────────────────────────

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageTexts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    // Sort by Y desc then X asc to reconstruct natural reading order
    const items = content.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => 'str' in item)
      .sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5]
        if (Math.abs(yDiff) > 3) return yDiff
        return a.transform[4] - b.transform[4]
      })
    // Group into lines by Y position
    const lines: string[] = []
    let currentLine = ''
    let lastY = -1
    for (const item of items) {
      const y = Math.round(item.transform[5])
      if (lastY !== -1 && Math.abs(y - lastY) > 3) {
        if (currentLine.trim()) lines.push(currentLine.trim())
        currentLine = item.str
      } else {
        currentLine += (currentLine && item.str && !currentLine.endsWith(' ') ? ' ' : '') + item.str
      }
      lastY = y
    }
    if (currentLine.trim()) lines.push(currentLine.trim())
    pageTexts.push(lines.join('\n'))
  }
  return pageTexts.join('\n')
}

// ─── Patterns ────────────────────────────────────────────────────────────────

// "EXERCISE 01", "EXERCISE 02", …
const EXERCISE_ANCHOR = /^EXERCISE\s+\d+$/i

// "WORKOUT A Posterior chain…", "DAY 1:", "PHASE 1 –", "A)", "Day A:"
const SECTION_HEADER = /^(?:WORKOUT\s+([A-Z])|DAY\s+(\d+)|PHASE\s+\d|[A-Z]\s*[):–-]|SESSION\s+[A-Z\d])/i

// 3×10, 3 x 10, 3X10, 3 × 10
const SETS_X_REPS = /(\d+)\s*[xX×]\s*(\d+)/

// "3 sets of 10", "3 sets x 10 reps"
const SETS_OF_REPS = /(\d+)\s*sets?\s*(?:of|x)?\s*(\d+)\s*(?:reps?)?/i

// "10 reps", "10 repetitions"
const REPS_ONLY = /(\d+)\s*(?:reps?|repetitions?)/i

// Timed: "3 × 30 sec", "3 × 30–45 sec", "3 × 45s"
const TIMED_SETS = /(\d+)\s*[xX×]\s*(\d+)(?:[-–]\d+)?\s*s(?:ec(?:onds?)?)?/i

// Weight: "135 lbs", "60 kg", "100lb"
const WEIGHT = /(\d+\.?\d*)\s*(?:lbs?|kgs?|pounds?|kilograms?)/i

const EXERCISE_KEYWORDS = [
  'press', 'curl', 'squat', 'deadlift', 'row', 'pull', 'push', 'fly', 'flye',
  'raise', 'extension', 'kickback', 'dip', 'plank', 'crunch', 'lunge', 'thrust',
  'swing', 'jump', 'carry', 'pulldown', 'chin', 'bench', 'overhead', 'incline',
  'decline', 'cable', 'barbell', 'dumbbell', 'machine', 'bodyweight', 'kettlebell',
  // common named exercises that lack generic keywords
  'dead bug', 'bird dog', 'glute bridge', 'hip bridge', 'good morning',
  'face pull', 'shrug', 'calf raise', 'leg press', 'leg curl', 'leg extension',
  'rdl', 'sumo', 'split squat', 'step up', 'march', 'hold', 'bridge',
]

// Lines that are definitely not exercise names
const IGNORE_PATTERNS = [
  /^(overview|warmup|cooldown|cool down|warm up|cardio|notes?|rest|week\s+\d|day\s+\d|phase\s+\d|the golden|page\s+\d|copyright|session)/i,
  /^\d+\s*(?:min|sec|kcal|kg|lbs|sets?|reps?|percent|%)/i,
  /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)$/i,
]

function shouldIgnoreLine(line: string): boolean {
  return IGNORE_PATTERNS.some((p) => p.test(line.trim()))
}

function looksLikeExercise(line: string, exercises: Exercise[]): boolean {
  const lower = line.toLowerCase().trim()
  if (shouldIgnoreLine(line)) return false
  if (lower.length < 3 || lower.length > 80) return false
  if (/^\d+$/.test(lower)) return false
  if (EXERCISE_KEYWORDS.some((kw) => lower.includes(kw))) return true
  // Also accept if it matches a library exercise name
  return exercises.some((e) => {
    const exLower = e.name.toLowerCase()
    return lower.includes(exLower) || exLower.includes(lower)
  })
}

function matchLibrary(name: string, exercises: Exercise[]): Exercise | undefined {
  const lower = name.toLowerCase().trim()
  // Exact
  const exact = exercises.find((e) => e.name.toLowerCase() === lower)
  if (exact) return exact
  // Contains
  const contains = exercises.find(
    (e) => lower.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(lower)
  )
  if (contains) return contains
  // Word overlap (2+ meaningful words)
  const words = lower.split(/\s+/).filter((w) => w.length > 3)
  let best: Exercise | undefined
  let bestScore = 1
  for (const ex of exercises) {
    const exWords = ex.name.toLowerCase().split(/\s+/)
    const score = words.filter((w) => exWords.includes(w)).length
    if (score > bestScore) { bestScore = score; best = ex }
  }
  return best
}

function parseSetsFromLine(line: string): { sets: number; reps: number; weight?: number } | null {
  const weightMatch = line.match(WEIGHT)
  const weight = weightMatch ? parseFloat(weightMatch[1]) : undefined

  // Timed first (to avoid "3 × 30" matching SETS_X_REPS when it means 30 seconds)
  const timed = line.match(TIMED_SETS)
  if (timed) return { sets: parseInt(timed[1]), reps: parseInt(timed[2]), weight }

  const sxr = line.match(SETS_X_REPS)
  if (sxr) return { sets: parseInt(sxr[1]), reps: parseInt(sxr[2]), weight }

  const sof = line.match(SETS_OF_REPS)
  if (sof && sof[2]) return { sets: parseInt(sof[1]), reps: parseInt(sof[2]), weight }

  const repsOnly = line.match(REPS_ONLY)
  if (repsOnly) return { sets: 1, reps: parseInt(repsOnly[1]), weight }

  return null
}

// ─── Multi-Workout Split ──────────────────────────────────────────────────────

interface RawSection {
  name: string
  lines: string[]
}

function splitIntoSections(lines: string[]): RawSection[] {
  const sections: RawSection[] = []
  let current: RawSection | null = null

  for (const line of lines) {
    const m = line.match(SECTION_HEADER)
    if (m) {
      if (current) sections.push(current)
      // Build a friendly section name
      const label = m[1] ? `Workout ${m[1]}` : m[2] ? `Day ${m[2]}` : line.slice(0, 40)
      current = { name: label, lines: [line] }
    } else {
      if (!current) current = { name: 'Imported Workout', lines: [] }
      current.lines.push(line)
    }
  }
  if (current) sections.push(current)
  return sections.filter((s) => s.lines.length > 1)
}

// ─── Parse a Single Section ───────────────────────────────────────────────────

function parseSectionExercises(lines: string[], allExercises: Exercise[]): ParsedExercise[] {
  const exercises: ParsedExercise[] = []
  let current: ParsedExercise | null = null
  let nextLineIsExercise = false   // triggered by "EXERCISE XX" anchor

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // "EXERCISE 01" anchor → treat next non-trivial line as exercise name
    if (EXERCISE_ANCHOR.test(line)) {
      nextLineIsExercise = true
      continue
    }

    // Try to parse as sets
    const setInfo = parseSetsFromLine(line)

    if (setInfo) {
      if (current) {
        for (let s = 0; s < setInfo.sets; s++) {
          current.sets.push({ reps: setInfo.reps, weight: setInfo.weight })
        }
      }
      nextLineIsExercise = false
      continue
    }

    // Determine if this is an exercise name
    const isExercise =
      nextLineIsExercise ||
      looksLikeExercise(line, allExercises)

    if (isExercise && line.length < 80 && !shouldIgnoreLine(line)) {
      // Check for inline sets on the same line: "Bench Press — 3×10 @ 135lbs"
      const inlineDash = line.match(/[-–—]\s*(.+)$/)
      const inlineSetStr = inlineDash ? inlineDash[1] : null
      const inlineSets = inlineSetStr ? parseSetsFromLine(inlineSetStr) : null

      // Also check if the line itself contains a set pattern with an exercise prefix
      const directInline = !inlineDash ? parseSetsFromLine(line) : null

      const cleanName = line
        .replace(/[-–—].*$/, '')
        .replace(SETS_X_REPS, '')
        .replace(/\d+\s*[xX×]\s*\d+.*/, '')
        .replace(/\s*[,;]\s*$/, '')
        .replace(/\s+/g, ' ')
        .trim()

      if (!cleanName) { nextLineIsExercise = false; continue }

      if (current) exercises.push(current)

      current = {
        name: cleanName,
        matchedExercise: matchLibrary(cleanName, allExercises),
        sets: [],
      }

      const setsToAdd = inlineSets ?? (directInline && line !== cleanName ? directInline : null)
      if (setsToAdd) {
        for (let s = 0; s < setsToAdd.sets; s++) {
          current.sets.push({ reps: setsToAdd.reps, weight: setsToAdd.weight })
        }
      }

      nextLineIsExercise = false
      continue
    }

    nextLineIsExercise = false
  }

  if (current) exercises.push(current)

  // Fill in default sets if none detected
  for (const ex of exercises) {
    if (ex.sets.length === 0) ex.sets = [{ reps: 10 }, { reps: 10 }, { reps: 10 }]
  }

  return exercises
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export function parseWorkoutFromText(rawText: string, exercises: Exercise[]): ParsedWorkout {
  const lines = rawText
    .split(/[\n\r]+/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 1)

  const sections = splitIntoSections(lines)

  // If only one section, parse it as-is
  if (sections.length <= 1) {
    const allLines = sections[0]?.lines ?? lines
    const workoutExercises = parseSectionExercises(allLines, exercises)
    const name = sections[0]?.name ?? 'Imported Workout'
    return { name, exercises: workoutExercises }
  }

  // Multiple sections → return the first one with the most exercises
  // (caller can import each; for now return the largest section)
  let best = sections[0]
  let bestExercises = parseSectionExercises(best.lines, exercises)

  for (const section of sections.slice(1)) {
    const parsed = parseSectionExercises(section.lines, exercises)
    if (parsed.length > bestExercises.length) {
      best = section
      bestExercises = parsed
    }
  }

  return { name: best.name, exercises: bestExercises }
}

export function parseAllWorkoutsFromText(rawText: string, exercises: Exercise[]): ParsedWorkout[] {
  const lines = rawText
    .split(/[\n\r]+/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 1)

  const sections = splitIntoSections(lines)

  if (sections.length <= 1) {
    return [parseWorkoutFromText(rawText, exercises)]
  }

  return sections
    .map((section) => ({
      name: section.name,
      exercises: parseSectionExercises(section.lines, exercises),
    }))
    .filter((w) => w.exercises.length > 0)
}

// ─── Convert to WorkoutTemplate ───────────────────────────────────────────────

export function convertToWorkoutTemplate(
  parsed: ParsedWorkout,
  exercises: Exercise[]
): WorkoutTemplate {
  const now = new Date().toISOString()

  const exerciseTemplates: ExerciseTemplate[] = parsed.exercises.map((pe, order) => {
    const matched = pe.matchedExercise ?? matchLibrary(pe.name, exercises)
    const exerciseId = matched?.id ?? `custom-${generateId()}`

    const sets: SetTemplate[] = pe.sets.map((s) => ({
      id: generateId(),
      type: 'normal' as const,
      targetReps: s.reps,
      targetWeight: s.weight,
      restSeconds: 90,
    }))

    return { id: generateId(), exerciseId, order, sets }
  })

  const tags = [
    ...new Set(
      parsed.exercises.flatMap((pe) => pe.matchedExercise?.muscleGroups ?? []).slice(0, 4)
    ),
  ] as MuscleGroup[]

  const totalSets = exerciseTemplates.reduce((sum, ex) => sum + ex.sets.length, 0)

  return {
    id: generateId(),
    name: parsed.name,
    description: 'Imported from PDF',
    tags,
    exercises: exerciseTemplates,
    estimatedMinutes: Math.round(totalSets * 2.5),
    createdAt: now,
    updatedAt: now,
    isArchived: false,
  }
}
