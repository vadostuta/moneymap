'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Plus,
  Trash2
} from 'lucide-react'
import { planService, DUPLICATE_PLAN_MONTH } from '@/lib/services/plan'
import { toastService } from '@/lib/services/toast'
import { fxService, ResolvedRate } from '@/lib/services/fx'
import { usePrivacy } from '@/contexts/privacy-context'
import { cn } from '@/lib/utils'
import { CurrencyType } from '@/lib/types/wallet'
import {
  CreatePlanIncomeDTO,
  CreatePlanLineDTO,
  DEFAULT_PLAN_CURRENCY,
  MonthlyPlan,
  PlanLineFlow,
  PlanLineKind
} from '@/lib/types/plan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { CURRENCIES, formatRate } from '@/app/wealth/utils'
import { PlanTabs } from '../PlanTabs'
import { StatusBadge } from '../StatusBadge'
import { Breakdown } from '../Breakdown'
import { formatMonth } from '../format'
import {
  copyForNewMonth,
  currentMonth,
  lineAmount,
  lineStatus,
  monthDate,
  planTotals
} from '../plan'

// Accepts "1 234,56" as well as "1234.56"
function parseNumber (value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  if (normalized === '') return NaN
  return Number(normalized)
}

const isAmount = (value: string) => parseNumber(value) >= 0
const isOptionalAmount = (value: string) =>
  value.trim() === '' || isAmount(value)

const incomeSchema = z.object({
  label: z.string().trim().min(1, 'plan.validation.labelRequired'),
  currency: z.enum(CURRENCIES as [CurrencyType, ...CurrencyType[]]),
  amount: z.string().refine(isAmount, 'plan.validation.amountInvalid'),
  // plan-currency units per 1 income-currency unit
  rate: z.string(),
  // 'ecb' / 'nbu' while the rate is the fetched default; null once typed
  rateSource: z.string().nullable(),
  rateTouched: z.boolean()
})

const lineSchema = z.object({
  label: z.string().trim().min(1, 'plan.validation.labelRequired'),
  kind: z.enum(['fixed', 'percent']),
  value: z.string().refine(isAmount, 'plan.validation.amountInvalid'),
  flow: z.enum(['spend', 'save']),
  // Blank = not checked yet
  actual: z.string().refine(isOptionalAmount, 'plan.validation.amountInvalid')
})

const formSchema = z
  .object({
    currency: z.enum(CURRENCIES as [CurrencyType, ...CurrencyType[]]),
    note: z.string(),
    closed: z.boolean(),
    incomes: z.array(incomeSchema).min(1, 'plan.validation.noIncome'),
    lines: z.array(lineSchema)
  })
  .superRefine((values, ctx) => {
    values.incomes.forEach((income, index) => {
      if (income.currency === values.currency) return
      if (!(parseNumber(income.rate) > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['incomes', index, 'rate'],
          message: 'plan.validation.rateInvalid'
        })
      }
    })
    values.lines.forEach((line, index) => {
      if (line.kind === 'percent' && parseNumber(line.value) > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lines', index, 'value'],
          message: 'plan.validation.percentTooHigh'
        })
      }
    })
  })

type FormValues = z.infer<typeof formSchema>
type IncomeValues = FormValues['incomes'][number]
type LineValues = FormValues['lines'][number]

const emptyIncome = (currency: CurrencyType): IncomeValues => ({
  label: '',
  currency,
  amount: '',
  rate: '',
  rateSource: null,
  rateTouched: false
})

const emptyLine = (): LineValues => ({
  label: '',
  kind: 'fixed',
  value: '',
  flow: 'spend',
  actual: ''
})

const toIncomeValues = (
  income: Pick<CreatePlanIncomeDTO, 'label' | 'currency' | 'amount' | 'rate' | 'rate_source'>,
  planCurrency: CurrencyType,
  carried: boolean
): IncomeValues => ({
  label: income.label,
  currency: income.currency,
  amount: String(income.amount),
  rate: income.currency === planCurrency ? '' : String(income.rate),
  // A copied rate is only a stand-in until this month's one is fetched
  rateSource: carried ? null : income.rate_source,
  rateTouched: !carried
})

const toLineValues = (line: CreatePlanLineDTO): LineValues => ({
  label: line.label,
  kind: line.kind,
  value: String(line.value),
  flow: line.flow,
  actual: line.actual_amount === null ? '' : String(line.actual_amount)
})

function defaultValuesFrom (
  editing: MonthlyPlan | null,
  previous: MonthlyPlan | null
): FormValues {
  if (editing) {
    return {
      currency: editing.currency,
      note: editing.note ?? '',
      closed: editing.closed_at !== null,
      incomes: (editing.incomes ?? []).map(income =>
        toIncomeValues(income, editing.currency, false)
      ),
      lines: (editing.lines ?? []).map(toLineValues)
    }
  }
  if (previous) {
    const copy = copyForNewMonth(previous)
    return {
      currency: previous.currency,
      note: '',
      closed: false,
      incomes: copy.incomes.map(income =>
        toIncomeValues(income, previous.currency, true)
      ),
      lines: copy.lines.map(toLineValues)
    }
  }
  return {
    currency: DEFAULT_PLAN_CURRENCY,
    note: '',
    closed: false,
    incomes: [emptyIncome(DEFAULT_PLAN_CURRENCY)],
    lines: [emptyLine()]
  }
}

// plan-currency units per 1 income-currency unit
function effectiveRate (income: IncomeValues, planCurrency: CurrencyType) {
  if (income.currency === planCurrency) return 1
  const rate = parseNumber(income.rate)
  return rate > 0 ? rate : NaN
}

function convertedIncome (income: IncomeValues, planCurrency: CurrencyType) {
  return parseNumber(income.amount) * effectiveRate(income, planCurrency)
}

const finite = (value: number) => (Number.isFinite(value) ? value : 0)

// Rates for the month: today's for the current or a future month, else the
// last day of that month
function rateDate (month: string): Date {
  const today = new Date()
  if (month >= currentMonth(today)) return today
  const first = monthDate(month)
  return new Date(first.getFullYear(), first.getMonth() + 1, 0)
}

function settledRates (
  results: { isSuccess: boolean; data?: ResolvedRate | null }[]
) {
  return results.map(result => ({
    settled: result.isSuccess,
    rate: result.data ?? null
  }))
}

// A month's plan: new (seeded from `previous`) or, with `editing`, an
// existing one. `month` is 'yyyy-MM-01'.
export function MonthPlanForm ({
  month,
  editing,
  previous
}: {
  month: string
  editing: MonthlyPlan | null
  previous: MonthlyPlan | null
}) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const router = useRouter()
  const queryClient = useQueryClient()

  const defaultValues = useMemo(
    () => defaultValuesFrom(editing, previous),
    [editing, previous]
  )
  // Actuals start visible once there is something to check: a past month, a
  // closed one, or one with actuals already
  const [checkpoint, setCheckpoint] = useState(
    () =>
      month < currentMonth() ||
      defaultValues.closed ||
      defaultValues.lines.some(line => line.actual.trim() !== '')
  )

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues
  })

  const incomeFields = useFieldArray({ control, name: 'incomes' })
  const lineFields = useFieldArray({ control, name: 'lines' })
  const incomes = useWatch({ control, name: 'incomes' })
  const lines = useWatch({ control, name: 'lines' })
  const planCurrency = useWatch({ control, name: 'currency' })
  const closed = useWatch({ control, name: 'closed' })

  // A default rate per foreign currency. Only a default: incomes the user
  // typed a rate into are never overwritten.
  const day = rateDate(month)
  const foreignCurrencies = [
    ...new Set(
      incomes.map(income => income.currency).filter(c => c !== planCurrency)
    )
  ].sort()
  const fetchedRates = useQueries({
    queries: foreignCurrencies.map(currency => ({
      queryKey: ['fx-rate', format(day, 'yyyy-MM-dd'), currency, planCurrency],
      queryFn: () => fxService.getRate(day, currency, planCurrency),
      staleTime: 5 * 60 * 1000
    })),
    combine: settledRates
  })
  const foreignKey = foreignCurrencies.join(',')
  const rateByCurrency = useMemo(
    () =>
      new Map(
        foreignKey
          .split(',')
          .map((currency, i) => [currency, fetchedRates[i]] as const)
      ),
    [foreignKey, fetchedRates]
  )

  useEffect(() => {
    incomes.forEach((income, index) => {
      if (income.currency === planCurrency || income.rateTouched) return
      const fetched = rateByCurrency.get(income.currency)
      if (!fetched?.settled || !fetched.rate) return
      const rate = String(Number(fetched.rate.rate.toPrecision(8)))
      if (income.rate === rate && income.rateSource === fetched.rate.source) {
        return
      }
      setValue(`incomes.${index}.rate`, rate, { shouldValidate: true })
      setValue(`incomes.${index}.rateSource`, fetched.rate.source)
    })
  }, [incomes, planCurrency, rateByCurrency, setValue])

  const converted = incomes.map(income =>
    convertedIncome(income, planCurrency)
  )
  const parsedLines = lines.map(line => ({
    kind: line.kind,
    value: finite(parseNumber(line.value)),
    flow: line.flow,
    actual_amount: line.actual.trim() === '' ? null : finite(parseNumber(line.actual))
  }))
  const totals = planTotals(
    converted.map(amount => ({ converted_amount: finite(amount) })),
    parsedLines
  )

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const incomeDTOs: CreatePlanIncomeDTO[] = values.incomes.map(
        (income, index) => {
          const amount = parseNumber(income.amount)
          const rate = effectiveRate(income, values.currency)
          return {
            label: income.label.trim(),
            currency: income.currency,
            amount,
            rate,
            rate_source:
              income.currency === values.currency ? null : income.rateSource,
            converted_amount: amount * rate,
            sort_order: index
          }
        }
      )
      const lineDTOs: CreatePlanLineDTO[] = values.lines.map((line, index) => ({
        label: line.label.trim(),
        kind: line.kind,
        value: parseNumber(line.value),
        flow: line.flow,
        actual_amount:
          line.actual.trim() === '' ? null : parseNumber(line.actual),
        sort_order: index
      }))
      return planService.save(
        editing?.id ?? null,
        {
          month,
          currency: values.currency,
          note: values.note.trim() || null,
          closed_at: values.closed
            ? editing?.closed_at ?? new Date().toISOString()
            : null
        },
        incomeDTOs,
        lineDTOs
      )
    },
    onSuccess: () => {
      // exact: the form's own ['plans', 'form', …] copy must not refetch and remount it
      queryClient.invalidateQueries({ queryKey: ['plans'], exact: true })
      toastService.success(
        t(editing ? 'plan.success.updated' : 'plan.success.created')
      )
      router.push('/plan')
    },
    onError: (error: Error) => {
      console.error('Failed to save plan:', error)
      toastService.error(
        error.message === DUPLICATE_PLAN_MONTH
          ? t('plan.errors.duplicateMonth')
          : t('plan.errors.saveFailed')
      )
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () => planService.softDelete(editing!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'], exact: true })
      toastService.success(t('plan.success.deleted'))
      router.push('/plan')
    },
    onError: () => {
      toastService.error(t('plan.errors.deleteFailed'))
    }
  })

  // Checkpoint shortcut: every unchecked line gets its planned amount
  const fillActuals = () => {
    getValues('lines').forEach((line, index) => {
      if (line.actual.trim() !== '') return
      const planned = lineAmount(
        { kind: line.kind, value: finite(parseNumber(line.value)) },
        totals.income
      )
      setValue(`lines.${index}.actual`, String(Math.round(planned * 100) / 100), {
        shouldValidate: true
      })
    })
  }

  const fieldError = (message?: string) =>
    message ? <p className='text-xs text-destructive mt-1'>{t(message)}</p> : null

  const percentOfIncome = (amount: number) =>
    totals.income > 0 ? `${Math.round((amount / totals.income) * 100)}%` : '—'

  return (
    <form
      onSubmit={handleSubmit(values => saveMutation.mutate(values))}
      className='space-y-4 sm:space-y-6'
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <h1 className='text-lg sm:text-xl md:text-2xl font-bold capitalize'>
            {formatMonth(month, i18n.language)}
          </h1>
          {!editing && (
            <p className='text-sm text-muted-foreground'>
              {previous
                ? t('plan.form.copiedFrom', {
                  month: formatMonth(previous.month, i18n.language)
                })
                : t('plan.form.firstPlan')}
            </p>
          )}
        </div>
        <PlanTabs />
      </div>

      <Card>
        <CardContent className='pt-6 grid gap-4 sm:grid-cols-[auto_1fr]'>
          <div>
            <Label className='block mb-1'>{t('plan.form.currency')}</Label>
            <Controller
              control={control}
              name='currency'
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className='w-full sm:w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor='note' className='block mb-1'>
              {t('plan.form.note')}
            </Label>
            <Input
              id='note'
              placeholder={t('plan.form.notePlaceholder')}
              {...register('note')}
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Income ─────────────────────────────────────────────────── */}
      <section className='space-y-3'>
        <div>
          <h2 className='text-base sm:text-lg font-semibold'>
            {t('plan.form.incomes')}
          </h2>
          <p className='text-xs text-muted-foreground'>
            {t('plan.form.incomesHint')}
          </p>
        </div>

        {incomeFields.fields.map((field, index) => {
          const income = incomes[index] ?? field
          const same = income.currency === planCurrency
          const incomeErrors = errors.incomes?.[index]
          const rate = parseNumber(income.rate)

          return (
            <Card key={field.id}>
              <CardContent className='pt-4 grid gap-3 grid-cols-2 lg:grid-cols-[2fr_6rem_1fr_1.2fr_auto] lg:items-start'>
                <div className='col-span-2 lg:col-span-1'>
                  <Label className='block mb-1 text-xs'>
                    {t('plan.form.label')}
                  </Label>
                  <Input
                    placeholder={t('plan.form.incomePlaceholder')}
                    {...register(`incomes.${index}.label`)}
                  />
                  {fieldError(incomeErrors?.label?.message)}
                </div>

                <div>
                  <Label className='block mb-1 text-xs'>
                    {t('plan.form.currency')}
                  </Label>
                  <Controller
                    control={control}
                    name={`incomes.${index}.currency`}
                    render={({ field: currencyField }) => (
                      <Select
                        value={currencyField.value}
                        onValueChange={currencyField.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(currency => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label className='block mb-1 text-xs'>
                    {t('plan.form.amount')}
                  </Label>
                  <Input
                    inputMode='decimal'
                    placeholder='0'
                    className='tabular-nums'
                    {...register(`incomes.${index}.amount`)}
                  />
                  {fieldError(incomeErrors?.amount?.message)}
                </div>

                <div>
                  <Label className='block mb-1 text-xs'>
                    {t('plan.form.rate')}
                  </Label>
                  {same ? (
                    <Input value='1' readOnly disabled className='tabular-nums' />
                  ) : (
                    <>
                      <Input
                        inputMode='decimal'
                        placeholder='0'
                        className='tabular-nums'
                        {...register(`incomes.${index}.rate`, {
                          onChange: () => {
                            setValue(`incomes.${index}.rateTouched`, true)
                            setValue(`incomes.${index}.rateSource`, null)
                          }
                        })}
                      />
                      <p className='text-xs text-muted-foreground mt-1'>
                        {rate > 0
                          ? t('plan.form.rateHint', {
                            from: income.currency,
                            to: planCurrency,
                            rate: formatRate(rate),
                            inverse: formatRate(Number((1 / rate).toPrecision(6)))
                          })
                          : t('plan.form.rateMissing')}
                      </p>
                      {income.rateSource && (
                        <p className='text-xs text-muted-foreground'>
                          {t('plan.form.rateFrom', {
                            source: t(`wealth.sources.${income.rateSource}`, {
                              defaultValue: income.rateSource
                            })
                          })}
                        </p>
                      )}
                      {fieldError(incomeErrors?.rate?.message)}
                    </>
                  )}
                </div>

                <div className='col-span-2 lg:col-span-1 flex items-center justify-end gap-2 lg:pt-6'>
                  <span className='text-sm tabular-nums text-muted-foreground whitespace-nowrap'>
                    {Number.isFinite(converted[index])
                      ? formatBalance(converted[index], planCurrency)
                      : '—'}
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    aria-label={t('plan.form.removeIncome')}
                    onClick={() => incomeFields.remove(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {incomeFields.fields.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            {t('plan.validation.noIncome')}
          </p>
        )}

        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => incomeFields.append(emptyIncome(getValues('currency')))}
          >
            <Plus className='h-4 w-4 mr-1' />
            {t('plan.form.addIncome')}
          </Button>
          <p className='text-sm font-medium'>
            {t('plan.totals.income')}:{' '}
            <span className='tabular-nums'>
              {formatBalance(totals.income, planCurrency)}
            </span>
          </p>
        </div>
      </section>

      {/* ─── Where it goes ─────────────────────────────────────────── */}
      <section className='space-y-3'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-base sm:text-lg font-semibold'>
              {t('plan.form.lines')}
            </h2>
            <p className='text-xs text-muted-foreground'>
              {t('plan.form.linesHint')}
            </p>
          </div>
          <Button
            type='button'
            variant={checkpoint ? 'secondary' : 'outline'}
            size='sm'
            aria-pressed={checkpoint}
            onClick={() => setCheckpoint(on => !on)}
          >
            <ClipboardCheck className='h-4 w-4 mr-1' />
            {t('plan.form.checkpoint')}
          </Button>
        </div>

        {lineFields.fields.map((field, index) => {
          const line = lines[index] ?? field
          const parsed = parsedLines[index]
          const planned = parsed ? lineAmount(parsed, totals.income) : 0
          const lineErrors = errors.lines?.[index]

          return (
            <Card key={field.id}>
              <CardContent
                className={
                  'pt-4 grid gap-3 grid-cols-2 lg:items-start ' +
                  (checkpoint
                    ? 'lg:grid-cols-[2fr_1.5fr_8rem_1fr_auto]'
                    : 'lg:grid-cols-[2fr_1.5fr_8rem_auto]')
                }
              >
                <div className='col-span-2 lg:col-span-1'>
                  <Label className='block mb-1 text-xs'>
                    {t('plan.form.label')}
                  </Label>
                  <Input
                    placeholder={t('plan.form.linePlaceholder')}
                    {...register(`lines.${index}.label`)}
                  />
                  {fieldError(lineErrors?.label?.message)}
                </div>

                <div className='col-span-2 sm:col-span-1'>
                  <Label className='block mb-1 text-xs'>
                    {line.kind === 'percent'
                      ? t('plan.form.percent')
                      : t('plan.form.amount')}
                  </Label>
                  <div className='flex gap-1'>
                    <Input
                      inputMode='decimal'
                      placeholder='0'
                      className='tabular-nums min-w-0'
                      {...register(`lines.${index}.value`)}
                    />
                    {/* Fixed amount or share of income; the typed number stays */}
                    <Controller
                      control={control}
                      name={`lines.${index}.kind`}
                      render={({ field: kindField }) => (
                        <div
                          role='radiogroup'
                          aria-label={t('plan.form.kind')}
                          className='inline-flex shrink-0 rounded-md border bg-muted p-0.5 text-sm'
                        >
                          {(['fixed', 'percent'] as PlanLineKind[]).map(kind => (
                            <button
                              key={kind}
                              type='button'
                              role='radio'
                              aria-checked={kindField.value === kind}
                              title={
                                kind === 'percent'
                                  ? t('plan.kinds.percent')
                                  : t('plan.kinds.fixed', { currency: planCurrency })
                              }
                              onClick={() => {
                                kindField.onChange(kind)
                                trigger(`lines.${index}.value`)
                              }}
                              className={cn(
                                'rounded px-2.5 font-medium transition-colors',
                                kindField.value === kind
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {kind === 'percent' ? '%' : planCurrency}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                  <p className='text-xs text-muted-foreground mt-1 tabular-nums'>
                    {line.kind === 'percent'
                      ? `= ${formatBalance(planned, planCurrency)}`
                      : t('plan.form.ofIncome', {
                        percent: percentOfIncome(planned)
                      })}
                  </p>
                  {fieldError(lineErrors?.value?.message)}
                </div>

                <div>
                  <Label className='block mb-1 text-xs'>
                    {t('plan.form.flow')}
                  </Label>
                  <Controller
                    control={control}
                    name={`lines.${index}.flow`}
                    render={({ field: flowField }) => (
                      <Select
                        value={flowField.value}
                        onValueChange={value =>
                          flowField.onChange(value as PlanLineFlow)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='spend'>
                            {t('plan.flows.spend')}
                          </SelectItem>
                          <SelectItem value='save'>
                            {t('plan.flows.save')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {checkpoint && (
                  <div>
                    <Label className='block mb-1 text-xs'>
                      {t('plan.form.actual')}
                    </Label>
                    <Input
                      inputMode='decimal'
                      placeholder={String(Math.round(planned * 100) / 100)}
                      className='tabular-nums'
                      {...register(`lines.${index}.actual`)}
                    />
                    <div className='mt-1'>
                      {parsed && (
                        <StatusBadge
                          status={lineStatus(parsed, totals.income)}
                          flow={line.flow}
                        />
                      )}
                    </div>
                    {fieldError(lineErrors?.actual?.message)}
                  </div>
                )}

                <div className='col-span-2 lg:col-span-1 flex items-center justify-end gap-1 lg:pt-6'>
                  <div className='flex flex-col'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-5 w-8'
                      aria-label={t('plan.form.moveUp')}
                      disabled={index === 0}
                      onClick={() => lineFields.move(index, index - 1)}
                    >
                      <ChevronUp className='h-4 w-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-5 w-8'
                      aria-label={t('plan.form.moveDown')}
                      disabled={index === lineFields.fields.length - 1}
                      onClick={() => lineFields.move(index, index + 1)}
                    >
                      <ChevronDown className='h-4 w-4' />
                    </Button>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    aria-label={t('plan.form.removeLine')}
                    onClick={() => lineFields.remove(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => lineFields.append(emptyLine())}
          >
            <Plus className='h-4 w-4 mr-1' />
            {t('plan.form.addLine')}
          </Button>
          {checkpoint && lineFields.fields.length > 0 && (
            <Button type='button' variant='outline' onClick={fillActuals}>
              {t('plan.form.fillActuals')}
            </Button>
          )}
        </div>
      </section>

      {/* ─── Result ────────────────────────────────────────────────── */}
      <Card>
        <CardContent className='pt-6 space-y-4'>
          <Breakdown
            currency={planCurrency}
            income={totals.income}
            items={lines.map((line, index) => ({
              label: line.label || t('plan.form.untitled'),
              amount: parsedLines[index]
                ? lineAmount(parsedLines[index], totals.income)
                : 0
            }))}
          />
          <div className='grid gap-3 sm:grid-cols-3'>
            <div>
              <p className='text-sm text-muted-foreground'>
                {t('plan.totals.income')}
              </p>
              <p className='text-xl font-semibold tabular-nums'>
                {formatBalance(totals.income, planCurrency)}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>
                {t('plan.totals.allocated')}
              </p>
              <p className='text-xl font-semibold tabular-nums'>
                {formatBalance(totals.allocated, planCurrency)}
              </p>
              <p className='text-xs text-muted-foreground tabular-nums'>
                {t('plan.totals.split', {
                  spend: formatBalance(totals.spend, planCurrency),
                  save: formatBalance(totals.save, planCurrency)
                })}
              </p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>
                {t('plan.totals.leftover')}
              </p>
              <p
                className={
                  'text-2xl font-bold tabular-nums ' +
                  (totals.leftover < 0 ? 'text-destructive' : '')
                }
              >
                {formatBalance(totals.leftover, planCurrency)}
              </p>
              {checkpoint && totals.checked > 0 && (
                <p className='text-xs text-muted-foreground tabular-nums'>
                  {t('plan.totals.actualLeftover', {
                    amount: formatBalance(totals.actualLeftover, planCurrency)
                  })}
                </p>
              )}
            </div>
          </div>
          {totals.leftover < 0 && (
            <p className='flex items-center gap-1.5 text-sm text-destructive'>
              <AlertTriangle className='h-4 w-4 shrink-0' />
              {t('plan.totals.overAllocated', {
                amount: formatBalance(-totals.leftover, planCurrency)
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {checkpoint && (
        <div className='flex items-start gap-2'>
          <Controller
            control={control}
            name='closed'
            render={({ field }) => (
              <Checkbox
                id='closed'
                checked={field.value}
                onCheckedChange={checked => field.onChange(checked === true)}
                className='mt-0.5'
              />
            )}
          />
          <div>
            <Label htmlFor='closed'>{t('plan.form.closeMonth')}</Label>
            <p className='text-xs text-muted-foreground'>
              {closed
                ? t('plan.form.closedHint')
                : t('plan.form.closeHint', {
                  checked: totals.checked,
                  total: totals.lineCount
                })}
            </p>
          </div>
        </div>
      )}

      <div className='flex flex-col-reverse sm:flex-row sm:justify-between gap-2'>
        <div>
          {editing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type='button' variant='ghost' className='text-destructive'>
                  <Trash2 className='h-4 w-4 mr-1' />
                  {t('plan.delete.button')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('plan.delete.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('plan.delete.description', {
                      month: formatMonth(month, i18n.language)
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className='flex flex-col-reverse sm:flex-row gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/plan')}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type='submit'
            disabled={!isValid || saveMutation.isPending}
          >
            {saveMutation.isPending ? t('plan.form.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </form>
  )
}
