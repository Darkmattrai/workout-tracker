import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, BarChart2, Flame, Trophy, Dumbbell, Play } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { StatCard } from '../components/ui/StatCard'
import { Button } from '../components/ui/Button'
import { VolumeChart } from '../components/charts/VolumeChart'
import { WorkoutFrequencyChart } from '../components/charts/WorkoutFrequencyChart'
import { useAppContext } from '../context/AppContext'
import {
  getTotalVolume,
  getCurrentStreak,
  computePersonalRecords,
  getWeeklyVolume,
} from '../lib/analytics'
import { formatDate, formatDuration } from '../lib/utils'

export function Dashboard() {
  const { state } = useAppContext()
  const navigate = useNavigate()

  const completed = state.workoutSessions.filter((s) => s.status === 'completed')
  const totalVolume = getTotalVolume(state.workoutSessions)
  const streak = getCurrentStreak(state.workoutSessions)
  const prs = computePersonalRecords(state.workoutSessions)
  const weeklyData = getWeeklyVolume(state.workoutSessions, 8)
  const recentSessions = completed.slice(0, 3)

  const hasData = completed.length > 0

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Dashboard"
        subtitle="Track your fitness journey"
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/log')}>
            <Play size={14} />
            Quick Start
          </Button>
        }
      />

      <div className="p-6 space-y-6 pb-24 md:pb-6">
        {/* Welcome banner if no data */}
        {!hasData && (
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 mb-1">
                Welcome, {state.profile.name}!
              </h2>
              <p className="text-sm text-slate-400">
                Start tracking your workouts to see insights and progress here.
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate('/log')}>
              <Play size={16} />
              Log Your First Workout
            </Button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sessions"
            value={completed.length}
            sublabel="workouts completed"
            icon={Activity}
            color="blue"
          />
          <StatCard
            label="Total Volume"
            value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            sublabel="lbs lifted"
            icon={BarChart2}
            color="purple"
          />
          <StatCard
            label="Current Streak"
            value={streak}
            sublabel={streak === 1 ? 'day' : 'days'}
            icon={Flame}
            color="orange"
          />
          <StatCard
            label="Personal Records"
            value={prs.length}
            sublabel="exercises PR'd"
            icon={Trophy}
            color="green"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Weekly Volume (lbs)</h3>
            <VolumeChart data={weeklyData} />
          </div>
          <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Workout Frequency</h3>
            <WorkoutFrequencyChart data={weeklyData} />
          </div>
        </div>

        {/* Recent workouts */}
        {recentSessions.length > 0 && (
          <div className="bg-[#111827] border border-[#1e2d40] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300">Recent Workouts</h3>
              <button
                onClick={() => navigate('/history')}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3 border-b border-[#1e2d40] last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Dumbbell size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{session.workoutName}</p>
                      <p className="text-xs text-slate-500">{formatDate(session.startedAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-300">
                      {formatDuration(session.durationSeconds)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {session.totalVolume.toLocaleString()} lbs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
