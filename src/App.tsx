import React from 'react'
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { useAppContext } from './context/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { WorkoutLibrary } from './pages/WorkoutLibrary'
import { CreateWorkout } from './pages/CreateWorkout'
import { LogWorkout } from './pages/LogWorkout'
import { WorkoutHistory } from './pages/WorkoutHistory'
import { ExerciseProgress } from './pages/ExerciseProgress'
import { Profile } from './pages/Profile'
import { AuthPage } from './pages/AuthPage'
import { Timer } from 'lucide-react'

function ActiveSessionBanner() {
  const { state } = useAppContext()
  const location = useLocation()
  const isOnLogPage = location.pathname.startsWith('/log')
  if (!state.activeSession || isOnLogPage) return null
  return (
    <div className="bg-blue-600/20 border-b border-blue-500/40 px-6 py-2.5 flex items-center justify-between text-sm flex-shrink-0">
      <div className="flex items-center gap-2 text-blue-300">
        <Timer size={15} />
        <span>
          You have an active workout:{' '}
          <strong className="text-blue-200">{state.activeSession.workoutName}</strong>
        </span>
      </div>
      <Link
        to="/log"
        className="text-xs font-semibold text-blue-400 hover:text-blue-200 transition-colors border border-blue-500/40 px-3 py-1 rounded-full"
      >
        Resume
      </Link>
    </div>
  )
}

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ActiveSessionBanner />
        <div className="flex-1 overflow-auto bg-[#0a0f1e]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workouts" element={<WorkoutLibrary />} />
            <Route path="/workouts/create" element={<CreateWorkout />} />
            <Route path="/workouts/:id/edit" element={<CreateWorkout />} />
            <Route path="/log" element={<LogWorkout />} />
            <Route path="/log/:workoutId" element={<LogWorkout />} />
            <Route path="/history" element={<WorkoutHistory />} />
            <Route path="/progress" element={<ExerciseProgress />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function AuthenticatedApp() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <AppProvider userId={session.userId} userName={session.name}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}
