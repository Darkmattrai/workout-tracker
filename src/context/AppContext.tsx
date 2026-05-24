import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { AppState, UserProfile, Exercise, WorkoutTemplate, WorkoutSession } from '../types'
import { loadState, saveState } from '../lib/storage'
import { DEFAULT_EXERCISES } from '../constants/exercises'

function makeDefaultState(name = 'Athlete'): AppState {
  const initials = name
    .trim()
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
  return {
    profile: {
      name,
      avatarInitials: initials || 'AT',
      weightUnit: 'lbs',
      fitnessGoal: 'strength',
      joinedAt: new Date().toISOString(),
    },
    exercises: DEFAULT_EXERCISES,
    workoutTemplates: [],
    workoutSessions: [],
    activeSession: null,
  }
}

type AppAction =
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'ADD_CUSTOM_EXERCISE'; payload: Exercise }
  | { type: 'DELETE_EXERCISE'; payload: string }
  | { type: 'SAVE_WORKOUT_TEMPLATE'; payload: WorkoutTemplate }
  | { type: 'DELETE_WORKOUT_TEMPLATE'; payload: string }
  | { type: 'DUPLICATE_WORKOUT_TEMPLATE'; payload: string }
  | { type: 'START_SESSION'; payload: WorkoutSession }
  | { type: 'UPDATE_ACTIVE_SESSION'; payload: WorkoutSession }
  | { type: 'COMPLETE_SESSION'; payload: WorkoutSession }
  | { type: 'ABANDON_SESSION' }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'IMPORT_STATE'; payload: AppState }
  | { type: 'CLEAR_ALL_DATA' }

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } }

    case 'ADD_CUSTOM_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] }

    case 'DELETE_EXERCISE':
      return { ...state, exercises: state.exercises.filter((e) => e.id !== action.payload) }

    case 'SAVE_WORKOUT_TEMPLATE': {
      const exists = state.workoutTemplates.some((t) => t.id === action.payload.id)
      if (exists) {
        return {
          ...state,
          workoutTemplates: state.workoutTemplates.map((t) =>
            t.id === action.payload.id ? action.payload : t
          ),
        }
      }
      return { ...state, workoutTemplates: [action.payload, ...state.workoutTemplates] }
    }

    case 'DELETE_WORKOUT_TEMPLATE':
      return {
        ...state,
        workoutTemplates: state.workoutTemplates.filter((t) => t.id !== action.payload),
      }

    case 'DUPLICATE_WORKOUT_TEMPLATE': {
      const original = state.workoutTemplates.find((t) => t.id === action.payload)
      if (!original) return state
      const copy: WorkoutTemplate = {
        ...original,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: `${original.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return { ...state, workoutTemplates: [copy, ...state.workoutTemplates] }
    }

    case 'START_SESSION':
      return { ...state, activeSession: action.payload }

    case 'UPDATE_ACTIVE_SESSION':
      return { ...state, activeSession: action.payload }

    case 'COMPLETE_SESSION':
      return {
        ...state,
        activeSession: null,
        workoutSessions: [action.payload, ...state.workoutSessions],
      }

    case 'ABANDON_SESSION':
      return { ...state, activeSession: null }

    case 'DELETE_SESSION':
      return {
        ...state,
        workoutSessions: state.workoutSessions.filter((s) => s.id !== action.payload),
      }

    case 'IMPORT_STATE':
      return action.payload

    case 'CLEAR_ALL_DATA':
      return makeDefaultState()

    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

interface AppProviderProps {
  children: React.ReactNode
  userId: string
  userName: string
}

export function AppProvider({ children, userId, userName }: AppProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const loaded = loadState(userId)
    if (loaded) return loaded
    return makeDefaultState(userName)
  })

  useEffect(() => {
    saveState(state, userId)
  }, [state, userId])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
