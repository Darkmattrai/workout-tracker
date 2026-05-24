import React, { useState, useRef } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  parseISO,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Upload,
  Trash2,
  CheckCircle2,
  Clock,
  Minus,
  SkipForward,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { useAppContext } from '../context/AppContext'
import { extractTextFromPDF } from '../lib/pdfParser'
import { parsePlanFromText, buildTrainingPlan } from '../lib/planParser'
import type { TrainingPlan, ScheduledEntry } from '../types'

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ScheduledEntry['status'] }) {
  if (status === 'completed')
    return <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
  if (status === 'skipped')
    return <SkipForward size={12} className="text-yellow-500 flex-shrink-0" />
  if (status === 'rest')
    return <Minus size={12} className="text-slate-600 flex-shrink-0" />
  return <Clock size={12} className="text-blue-400 flex-shrink-0" />
}

// ─── Single day cell ──────────────────────────────────────────────────────────

interface DayCellProps {
  date: Date
  entry: ScheduledEntry | undefined
  onClickEntry: (entry: ScheduledEntry) => void
  onSkip: (entryId: string) => void
}

function DayCell({ date, entry, onClickEntry, onSkip }: DayCellProps) {
  const today = isToday(date)
  const past = isBefore(startOfDay(date), startOfDay(new Date()))

  const bgClass = today
    ? 'bg-blue-600/10 border-blue-500/40'
    : 'bg-[#111827] border-[#1e2d40]'

  if (!entry) {
    return (
      <div className={`rounded-xl border p-3 min-h-[90px] flex flex-col ${bgClass}`}>
        <span className={`text-xs font-semibold ${today ? 'text-blue-400' : 'text-slate-500'}`}>
          {format(date, 'd')}
        </span>
      </div>
    )
  }

  const isRest = entry.status === 'rest'
  const isDone = entry.status === 'completed'
  const isSkipped = entry.status === 'skipped'
  const canSkip = !isRest && !isDone && !isSkipped && past && !today

  return (
    <div
      className={`rounded-xl border p-3 min-h-[90px] flex flex-col gap-2 ${bgClass} ${
        !isRest && !isDone && !isSkipped ? 'cursor-pointer hover:border-blue-500/60 transition-colors' : ''
      }`}
      onClick={() => {
        if (!isRest && !isDone && !isSkipped) onClickEntry(entry)
      }}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${today ? 'text-blue-400' : 'text-slate-500'}`}>
          {format(date, 'd')}
        </span>
        <StatusDot status={entry.status} />
      </div>

      <div className="flex-1">
        <p
          className={`text-xs font-medium leading-tight ${
            isRest
              ? 'text-slate-600'
              : isDone
              ? 'text-emerald-400'
              : isSkipped
              ? 'text-yellow-600 line-through'
              : 'text-slate-200'
          }`}
        >
          {entry.label}
        </p>
        {isDone && (
          <p className="text-[10px] text-emerald-600 mt-0.5">Completed</p>
        )}
      </div>

      {canSkip && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSkip(entry.id)
          }}
          className="text-[10px] text-slate-600 hover:text-yellow-500 transition-colors self-start"
        >
          Skip
        </button>
      )}
    </div>
  )
}

// ─── Import modal ─────────────────────────────────────────────────────────────

interface ImportModalProps {
  onClose: () => void
  onImport: (plan: TrainingPlan) => void
  templates: ReturnType<typeof useAppContext>['state']['workoutTemplates']
}

function ImportModal({ onClose, onImport, templates }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<TrainingPlan | null>(null)
  const [startDate, setStartDate] = useState(
    format(addDays(new Date(), (8 - new Date().getDay()) % 7 || 7), 'yyyy-MM-dd')
  )
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const text = await extractTextFromPDF(file)
      const parsed = parsePlanFromText(text)
      if (parsed.schedule.length === 0) {
        setError('Could not detect a weekly schedule in this PDF. Make sure it has day names (Mon, Tue, …).')
        setLoading(false)
        return
      }
      const plan = buildTrainingPlan(parsed, templates, parseISO(startDate))
      setPreview(plan)
      setStep('preview')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Failed to read PDF: ${msg}`)
    }
    setLoading(false)
  }

  const handleDateChange = (d: string) => {
    setStartDate(d)
    if (preview) {
      const rebuilt = buildTrainingPlan(
        {
          name: preview.name,
          durationWeeks: preview.durationWeeks,
          schedule: preview.weeklySchedule.map((ws) => ({
            dayOfWeek: ws.dayOfWeek,
            label: ws.label,
            isRest: ws.workoutTemplateId === null,
          })),
        },
        templates,
        parseISO(d)
      )
      setPreview(rebuilt)
    }
  }

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#111827] border border-[#1e2d40] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d40]">
          <h2 className="text-lg font-bold text-slate-100">Import Training Plan</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'upload' && (
            <>
              <p className="text-sm text-slate-400">
                Upload a PDF with a weekly training schedule. Day names like "Mon", "Tue", etc. should be present.
              </p>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Plan start date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0a0f1e] border border-[#1e2d40] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div
                className="border-2 border-dashed border-[#1e2d40] rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f?.type === 'application/pdf') handleFile(f)
                }}
              >
                <Upload size={28} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">Drop PDF here or click to upload</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
              </div>

              {loading && (
                <p className="text-center text-sm text-blue-400 animate-pulse">Reading PDF…</p>
              )}
              {error && (
                <p className="text-center text-sm text-red-400">{error}</p>
              )}
            </>
          )}

          {step === 'preview' && preview && (
            <>
              <div className="space-y-1">
                <p className="text-sm text-slate-400">Plan detected:</p>
                <p className="font-semibold text-slate-100">{preview.name}</p>
                <p className="text-xs text-slate-500">{preview.durationWeeks} weeks · starts {format(parseISO(preview.startDate), 'MMM d, yyyy')}</p>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Adjust start date</label>
                <input
                  type="date"
                  value={preview.startDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-[#0a0f1e] border border-[#1e2d40] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium">Weekly schedule</p>
                {preview.weeklySchedule.map((day) => (
                  <div key={day.dayOfWeek} className="flex items-center gap-3 text-sm">
                    <span className="w-10 text-slate-500 text-xs">{DAY_NAMES[day.dayOfWeek]}</span>
                    <span className={day.workoutTemplateId === null && day.label.toLowerCase().includes('rest') ? 'text-slate-600' : 'text-slate-200'}>
                      {day.label}
                    </span>
                    {day.workoutTemplateId && (
                      <span className="ml-auto text-xs text-emerald-500">matched</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" size="md" onClick={() => setStep('upload')} className="flex-1">
                  Back
                </Button>
                <Button variant="primary" size="md" onClick={() => onImport(preview)} className="flex-1">
                  Add Plan
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Plan selector ────────────────────────────────────────────────────────────

interface PlanSelectorProps {
  plans: TrainingPlan[]
  activePlanId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
}

function PlanSelector({ plans, activePlanId, onSelect, onDelete, onNew }: PlanSelectorProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {plans.map((p) => (
        <div
          key={p.id}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
            p.id === activePlanId
              ? 'border-blue-500 bg-blue-600/10 text-blue-300'
              : 'border-[#1e2d40] text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
          onClick={() => onSelect(p.id)}
        >
          <CalendarDays size={13} />
          <span className="max-w-[140px] truncate">{p.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(p.id)
            }}
            className="ml-1 text-slate-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={onNew}>
        <Plus size={13} />
        Import Plan
      </Button>
    </div>
  )
}

// ─── Main Calendar page ───────────────────────────────────────────────────────

export function Calendar() {
  const { state, dispatch } = useAppContext()
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [showImport, setShowImport] = useState(false)

  const activePlan = state.trainingPlans.find((p) => p.id === state.activePlanId) ?? null

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const entriesForDate = (date: Date): ScheduledEntry | undefined => {
    if (!activePlan) return undefined
    return activePlan.entries.find((e) => isSameDay(parseISO(e.date), date))
  }

  const handleClickEntry = (entry: ScheduledEntry) => {
    if (entry.workoutTemplateId) {
      navigate(`/log/${entry.workoutTemplateId}?scheduled=${entry.id}`)
    } else {
      navigate(`/log?scheduled=${entry.id}`)
    }
  }

  const handleSkip = (entryId: string) => {
    dispatch({ type: 'SKIP_SCHEDULED_ENTRY', payload: entryId })
  }

  const handleImport = (plan: TrainingPlan) => {
    dispatch({ type: 'ADD_TRAINING_PLAN', payload: plan })
    setShowImport(false)
  }

  // Progress stats for active plan
  const totalEntries = activePlan?.entries.filter((e) => e.status !== 'rest').length ?? 0
  const completedEntries = activePlan?.entries.filter((e) => e.status === 'completed').length ?? 0
  const progressPct = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Calendar" />

      <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Plan selector row */}
        <PlanSelector
          plans={state.trainingPlans}
          activePlanId={state.activePlanId}
          onSelect={(id) => dispatch({ type: 'SET_ACTIVE_PLAN', payload: id })}
          onDelete={(id) => {
            if (window.confirm('Delete this training plan?')) {
              dispatch({ type: 'DELETE_TRAINING_PLAN', payload: id })
            }
          }}
          onNew={() => setShowImport(true)}
        />

        {/* No plan state */}
        {!activePlan && (
          <div className="py-16 text-center">
            <div className="p-5 bg-blue-600/10 rounded-full inline-flex mb-4">
              <CalendarDays size={36} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">No training plan yet</h2>
            <p className="text-sm text-slate-500 mb-6">
              Import a PDF with your training schedule to get started.
            </p>
            <Button variant="primary" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import Plan from PDF
            </Button>
          </div>
        )}

        {/* Active plan */}
        {activePlan && (
          <>
            {/* Progress bar */}
            <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{activePlan.name}</span>
                <span className="text-slate-300 font-medium">{completedEntries}/{totalEntries} workouts</span>
              </div>
              <div className="w-full bg-[#1e2d40] rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Started {format(parseISO(activePlan.startDate), 'MMM d, yyyy')}</span>
                <span>{progressPct}% complete</span>
              </div>
            </div>

            {/* Week navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWeekStart((w) => subWeeks(w, 1))}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-[#1f2937] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-slate-300">
                {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </span>
              <button
                onClick={() => setWeekStart((w) => addWeeks(w, 1))}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-[#1f2937] transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day name headers */}
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-xs text-slate-600 font-medium py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date) => (
                <DayCell
                  key={date.toISOString()}
                  date={date}
                  entry={entriesForDate(date)}
                  onClickEntry={handleClickEntry}
                  onSkip={handleSkip}
                />
              ))}
            </div>

            {/* Upcoming workouts list */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400">This week's workouts</h3>
              {weekDays.map((date) => {
                const entry = entriesForDate(date)
                if (!entry || entry.status === 'rest') return null
                return (
                  <div
                    key={date.toISOString()}
                    className={`flex items-center gap-4 bg-[#111827] border rounded-xl px-4 py-3 ${
                      entry.status === 'completed'
                        ? 'border-emerald-500/20'
                        : entry.status === 'skipped'
                        ? 'border-yellow-500/20'
                        : 'border-[#1e2d40] cursor-pointer hover:border-blue-500/40 transition-colors'
                    }`}
                    onClick={() => {
                      if (entry.status !== 'completed' && entry.status !== 'skipped') {
                        handleClickEntry(entry)
                      }
                    }}
                  >
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="text-xs text-slate-500">{format(date, 'EEE')}</p>
                      <p className={`text-lg font-bold ${isToday(date) ? 'text-blue-400' : 'text-slate-200'}`}>
                        {format(date, 'd')}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        entry.status === 'completed' ? 'text-emerald-400' :
                        entry.status === 'skipped' ? 'text-yellow-600 line-through' :
                        'text-slate-200'
                      }`}>
                        {entry.label}
                      </p>
                      {entry.status === 'completed' && (
                        <p className="text-xs text-emerald-600">Completed</p>
                      )}
                      {entry.status === 'skipped' && (
                        <p className="text-xs text-yellow-700">Skipped</p>
                      )}
                      {entry.status === 'scheduled' && (
                        <p className="text-xs text-slate-500">Tap to log workout</p>
                      )}
                    </div>
                    <StatusDot status={entry.status} />
                  </div>
                )
              })}
              {weekDays.every((date) => {
                const entry = entriesForDate(date)
                return !entry || entry.status === 'rest'
              }) && (
                <p className="text-sm text-slate-600 text-center py-4">No workouts scheduled this week.</p>
              )}
            </div>
          </>
        )}
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
          templates={state.workoutTemplates}
        />
      )}
    </div>
  )
}
