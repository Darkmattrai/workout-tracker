import React, { useState } from 'react'
import { Download, Upload, Trash2, Save, User } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useAppContext } from '../context/AppContext'
import { exportState, importState } from '../lib/storage'
import { formatDate, formatDuration } from '../lib/utils'
import { getTotalVolume } from '../lib/analytics'
import { WeightUnit, UserProfile } from '../types'

type FitnessGoal = UserProfile['fitnessGoal']

const GOAL_OPTIONS: { value: FitnessGoal; label: string; description: string }[] = [
  { value: 'strength',     label: 'Strength',     description: 'Maximize max lifts' },
  { value: 'hypertrophy',  label: 'Hypertrophy',  description: 'Build muscle size' },
  { value: 'endurance',    label: 'Endurance',    description: 'Improve stamina' },
  { value: 'general',      label: 'General',      description: 'Overall fitness' },
]

export function Profile() {
  const { state, dispatch } = useAppContext()
  const [name, setName] = useState(state.profile.name)
  const [goal, setGoal] = useState<FitnessGoal>(state.profile.fitnessGoal)
  const [unit, setUnit] = useState<WeightUnit>(state.profile.weightUnit)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [saved, setSaved] = useState(false)

  const completed = state.workoutSessions.filter((s) => s.status === 'completed')
  const totalVolume = getTotalVolume(state.workoutSessions)
  const totalDuration = completed.reduce((sum, s) => sum + s.durationSeconds, 0)

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: {
        name: name.trim() || 'Athlete',
        avatarInitials: initials || 'AT',
        fitnessGoal: goal,
        weightUnit: unit,
      },
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = () => {
    exportState(state)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (parsed && typeof parsed === 'object') {
          dispatch({ type: 'IMPORT_STATE', payload: parsed })
        }
      } catch {
        alert('Invalid JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearData = () => {
    dispatch({ type: 'CLEAR_ALL_DATA' })
    setShowClearConfirm(false)
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Profile & Settings" />

      <div className="p-6 space-y-6 pb-24 md:pb-6 max-w-2xl mx-auto w-full">
        {/* Avatar + summary */}
        <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials || <User size={28} />}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-100">{state.profile.name}</p>
            <p className="text-sm text-slate-400 capitalize">{state.profile.fitnessGoal}</p>
            <p className="text-xs text-slate-600 mt-1">
              Member since {formatDate(state.profile.joinedAt)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">{completed.length}</p>
            <p className="text-xs text-slate-500 mt-1">Workouts</p>
          </div>
          <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(0)}k` : totalVolume}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Vol.</p>
          </div>
          <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">{formatDuration(totalDuration)}</p>
            <p className="text-xs text-slate-500 mt-1">Total Time</p>
          </div>
        </div>

        {/* Edit profile */}
        <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Profile</h3>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {/* Fitness goal */}
        <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Fitness Goal</h3>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGoal(opt.value)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  goal === opt.value
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'border-[#1e2d40] text-slate-400 hover:border-[#2d3f55]'
                }`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Weight unit */}
        <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Weight Unit</h3>
          <div className="flex bg-[#0a0f1e] rounded-lg p-1 gap-1">
            {(['lbs', 'kg'] as WeightUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  unit === u
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <Button variant="primary" size="lg" onClick={handleSave} className="w-full">
          <Save size={16} />
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>

        {/* Data management */}
        <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Data Management</h3>

          <Button
            variant="secondary"
            size="md"
            onClick={handleExport}
            className="w-full"
          >
            <Download size={16} />
            Export Data (JSON)
          </Button>

          <label className="w-full">
            <div className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#111827] hover:bg-[#1f2937] text-slate-200 border border-[#1e2d40] transition-colors cursor-pointer">
              <Upload size={16} />
              Import Data (JSON)
            </div>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          <div className="pt-2 border-t border-[#1e2d40]">
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowClearConfirm(true)}
              className="w-full"
            >
              <Trash2 size={16} />
              Clear All Data
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearData}
        title="Clear All Data"
        message="This will permanently delete all your workouts, sessions, and personal records. This action cannot be undone."
        confirmLabel="Clear Everything"
        variant="danger"
      />
    </div>
  )
}
