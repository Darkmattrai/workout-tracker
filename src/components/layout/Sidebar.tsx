import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  Play,
  History,
  TrendingUp,
  User,
  LogOut,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    path: '/',         icon: LayoutDashboard },
  { label: 'Workouts',     path: '/workouts', icon: ListChecks },
  { label: 'Log Workout',  path: '/log',      icon: Play },
  { label: 'History',      path: '/history',  icon: History },
  { label: 'Progress',     path: '/progress', icon: TrendingUp },
  { label: 'Profile',      path: '/profile',  icon: User },
]

export function Sidebar() {
  const { state } = useAppContext()
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0a0f1e] border-r border-[#1e2d40] h-screen sticky top-0 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e2d40]">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Dumbbell size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-widest">TRAINERIZE</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  active
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2937]'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User profile + logout at bottom */}
        <div className="border-t border-[#1e2d40]">
          <div
            className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[#1f2937] transition-colors"
            onClick={() => navigate('/profile')}
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {state.profile.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">{state.profile.name}</p>
              <p className="text-xs text-slate-500 capitalize">{state.profile.fitnessGoal}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm border-t border-[#1e2d40]"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0f1e] border-t border-[#1e2d40] z-40 flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
                active ? 'text-blue-400' : 'text-slate-500'
              )}
            >
              <item.icon size={20} />
              <span className="hidden xs:block">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
