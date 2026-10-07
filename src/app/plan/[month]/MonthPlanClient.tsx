'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { planService } from '@/lib/services/plan'
import { Button } from '@/components/ui/button'
import { MonthPlanForm } from './MonthPlanForm'
import { monthFromParam, previousPlan } from '../plan'

// /plan/yyyy-MM: edits that month's plan, or starts it from the latest
// earlier one when it has none yet
export default function MonthPlanClient ({
  params
}: {
  params: Promise<{ month: string }>
}) {
  const { month: param } = React.use(params)
  const month = monthFromParam(param)
  const { t } = useTranslation('common')

  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ['plans', 'form', month],
    queryFn: planService.getAll,
    enabled: month !== null,
    // The form seeds once from this; never seed from a cached, outdated copy
    gcTime: 0
  })

  if (!month || isError) {
    return (
      <div className='space-y-4'>
        <p className='text-muted-foreground'>
          {t(month ? 'plan.errors.loadFailed' : 'plan.errors.badMonth')}
        </p>
        <Button variant='outline' asChild>
          <Link href='/plan'>
            <ArrowLeft className='h-4 w-4 mr-1' />
            {t('plan.back')}
          </Link>
        </Button>
      </div>
    )
  }

  if (isLoading || !plans) {
    return (
      <div className='space-y-3'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='h-12 bg-muted animate-pulse rounded-lg' />
        ))}
      </div>
    )
  }

  const editing = plans.find(plan => plan.month === month) ?? null
  const previous = editing ? null : previousPlan(plans, month)

  return (
    <MonthPlanForm
      key={editing?.id ?? month}
      month={month}
      editing={editing}
      previous={previous}
    />
  )
}
