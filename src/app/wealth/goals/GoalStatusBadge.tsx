'use client'

import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GoalStatus } from './goals'

// Status is never colour alone: every badge has an icon and a word
const STATUS: Record<
  GoalStatus,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  reached: {
    icon: CheckCircle2,
    className: 'text-positive bg-positive-subtle'
  },
  onTrack: {
    icon: TrendingUp,
    className: 'text-positive bg-positive-subtle'
  },
  behind: {
    icon: AlertTriangle,
    className: 'text-warning bg-warning-subtle'
  },
  overdue: {
    icon: AlertCircle,
    className: 'text-negative bg-negative-subtle'
  },
  tooEarly: { icon: Clock, className: 'text-muted-foreground bg-muted' },
  notStarted: { icon: Circle, className: 'text-muted-foreground bg-muted' }
}

export function GoalStatusBadge ({ status }: { status: GoalStatus }) {
  const { t } = useTranslation('common')
  const { icon: Icon, className } = STATUS[status]

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      <Icon className='h-3.5 w-3.5' />
      {t(`wealth.goals.status.${status}`)}
    </span>
  )
}
