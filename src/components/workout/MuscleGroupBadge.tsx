import React from 'react'
import { MuscleGroup } from '../../types'
import { muscleGroupLabel, muscleGroupColor } from '../../lib/utils'

interface MuscleGroupBadgeProps {
  muscle: MuscleGroup
}

export function MuscleGroupBadge({ muscle }: MuscleGroupBadgeProps) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${muscleGroupColor(muscle)}`}
    >
      {muscleGroupLabel(muscle)}
    </span>
  )
}
