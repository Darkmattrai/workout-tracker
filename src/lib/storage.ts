import { AppState } from '../types'
import { userStateKey } from './auth'

function getKey(userId?: string): string {
  return userId ? userStateKey(userId) : 'trainerize_state'
}

export function loadState(userId?: string): AppState | null {
  try {
    const raw = localStorage.getItem(getKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

export function saveState(state: AppState, userId?: string): void {
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(state))
  } catch {
    // Storage might be full
  }
}

export function exportState(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trainerize-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importState(json: string): AppState {
  const parsed = JSON.parse(json) as AppState
  if (!parsed.profile || !Array.isArray(parsed.workoutTemplates) || !Array.isArray(parsed.workoutSessions)) {
    throw new Error('Invalid backup file format')
  }
  return parsed
}

export function clearState(userId?: string): void {
  localStorage.removeItem(getKey(userId))
}
