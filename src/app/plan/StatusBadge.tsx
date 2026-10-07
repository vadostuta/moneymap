'use client'

import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlanLineFlow } from '@/lib/types/plan'
import { LineStatus, isFavourable } from './plan'

const ICON = {
  open: Circle,
  on: CheckCircle2,
  under: ArrowDown,
  over: ArrowUp
}

// Status is never colour alone: every badge has an icon and a word. Colour
// says whether it is good news for this kind of line (less spent, more saved).
export function StatusBadge ({
  status,
  flow
}: {
  status: LineStatus
  flow: PlanLineFlow
}) {
  const { t } = useTranslation('common')
  const Icon = ICON[status]
  const good = isFavourable(status, flow)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        good === null && 'text-muted-foreground bg-muted',
        good === true && 'text-green-700 bg-green-500/10 dark:text-green-400',
        good === false && 'text-amber-700 bg-amber-500/10 dark:text-amber-400'
      )}
    >
      <Icon className='h-3 w-3' />
      {t(`plan.status.${status}`)}
    </span>
  )
}
