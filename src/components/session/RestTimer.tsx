import React, { useState, useEffect } from 'react'
import { SkipForward } from 'lucide-react'
import { Button } from '../ui/Button'

interface RestTimerProps {
  seconds: number
  onComplete: () => void
  onSkip: () => void
}

export function RestTimer({ seconds, onComplete, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      onComplete()
      return
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining, onComplete])

  const pct = ((seconds - remaining) / seconds) * 100
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDash = (pct / 100) * circumference

  const minutes = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="flex items-center gap-4 bg-[#1f2937] border border-[#1e2d40] rounded-xl px-5 py-4">
      {/* Circular progress */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke="#1e2d40"
            strokeWidth="6"
          />
          <circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="6"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-100 tabular-nums">
            {minutes > 0 ? `${minutes}:${secs.toString().padStart(2, '0')}` : secs}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200">Rest Timer</p>
        <p className="text-xs text-slate-500">
          {remaining > 0 ? `${remaining}s remaining` : 'Rest complete!'}
        </p>
      </div>

      <Button variant="ghost" size="sm" onClick={onSkip} className="flex-shrink-0">
        <SkipForward size={14} />
        Skip
      </Button>
    </div>
  )
}
