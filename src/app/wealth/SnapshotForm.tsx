'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  useQueries,
  useMutation,
  useQueryClient
} from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Trash2,
  ArrowLeftRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { wealthService, DUPLICATE_SNAPSHOT_DATE } from '@/lib/services/wealth'
import { toastService } from '@/lib/services/toast'
import { usePrivacy } from '@/contexts/privacy-context'
import { fxService, ResolvedRate } from '@/lib/services/fx'
import { Claim } from '@/lib/types/claim'
import { CurrencyType, WalletType } from '@/lib/types/wallet'
import {
  CreateSnapshotAllocationDTO,
  CreateSnapshotLineDTO,
  DEFAULT_DISPLAY_CURRENCY,
  LIQUID_BY_DEFAULT,
  WealthSnapshot,
  computeTotals,
  sumAllocations
} from '@/lib/types/wealth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  CURRENCIES,
  WALLET_TYPES,
  formatShortDate,
  formatSnapshotDate,
  parseSnapshotDate
} from './utils'

// Accepts "1 234,56" as well as "1234.56"
function parseNumber (value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  if (normalized === '') return NaN
  return Number(normalized)
}

const isFiniteNumber = (value: string) => Number.isFinite(parseNumber(value))

// Blank means "nothing promised"; otherwise a non-negative number
const isOptionalAmount = (value: string) =>
  value.trim() === '' || parseNumber(value) >= 0

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd')

const lineSchema = z.object({
  label: z.string().trim().min(1, 'wealth.validation.labelRequired'),
  type: z.enum(WALLET_TYPES as [WalletType, ...WalletType[]]),
  currency: z.enum(CURRENCIES as [CurrencyType, ...CurrencyType[]]),
  amount: z.string().refine(isFiniteNumber, 'wealth.validation.amountInvalid'),
  // The rate as typed, in the direction the user picked (see rateInverted)
  rate: z.string(),
  // false: "1 line currency = rate display currency" (stored as-is)
  // true:  "1 display currency = rate line currency" (stored as 1 / rate)
  rateInverted: z.boolean(),
  // Where the current rate came from ('ecb' / 'nbu') and its publication
  // date; null once the user types a rate. rateTouched stops auto-fill.
  rateSource: z.string().nullable(),
  rateDate: z.string().nullable(),
  rateTouched: z.boolean(),
  is_liquid: z.boolean(),
  // Form state only, never stored: the amount was copied from the previous
  // snapshot and hasn't been edited yet
  carried: z.boolean(),
  previousAmount: z.number().nullable()
})

// One row per active claim. Blank or zero saves no allocation.
const allocationSchema = z.object({
  claimId: z.string(),
  name: z.string(),
  amount: z
    .string()
    .refine(isOptionalAmount, 'wealth.validation.claimAmountInvalid'),
  carried: z.boolean(),
  previousAmount: z.number().nullable()
})

const formSchema = z
  .object({
    snapshot_date: z
      .date({ required_error: 'wealth.validation.dateRequired' })
      .refine(
        date => toDateKey(date) <= toDateKey(new Date()),
        'wealth.validation.futureDate'
      ),
    display_currency: z.enum(CURRENCIES as [CurrencyType, ...CurrencyType[]]),
    note: z.string(),
    lines: z.array(lineSchema).min(1, 'wealth.validation.noLines'),
    allocations: z.array(allocationSchema)
  })
  .superRefine((values, ctx) => {
    values.lines.forEach((line, index) => {
      if (line.currency === values.display_currency) return
      const rate = parseNumber(line.rate)
      if (!Number.isFinite(rate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lines', index, 'rate'],
          message: 'wealth.validation.rateInvalid'
        })
      } else if (rate === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lines', index, 'rate'],
          message: 'wealth.validation.rateZero'
        })
      }
    })
  })

type FormValues = z.infer<typeof formSchema>
type LineValues = FormValues['lines'][number]
type AllocationValues = FormValues['allocations'][number]

const emptyLine = (): LineValues => ({
  label: '',
  type: 'bank',
  currency: DEFAULT_DISPLAY_CURRENCY,
  amount: '',
  rate: '',
  rateInverted: false,
  rateSource: null,
  rateDate: null,
  rateTouched: false,
  is_liquid: LIQUID_BY_DEFAULT.bank,
  carried: false,
  previousAmount: null
})

// Rates below 1 (e.g. UAH → USD) read better as the familiar inverse quote
function rateToInput (rate: number): Pick<LineValues, 'rate' | 'rateInverted'> {
  if (rate !== 0 && Math.abs(rate) < 1) {
    return { rate: String(Number((1 / rate).toPrecision(12))), rateInverted: true }
  }
  return { rate: String(rate), rateInverted: false }
}

// Active claims only, carrying the previous snapshot's amounts; claims added
// since then start blank. Ordered by amount descending, then name.
function allocationsFrom (
  previous: WealthSnapshot | null,
  claims: Claim[]
): AllocationValues[] {
  const previousAmounts = new Map(
    (previous?.allocations ?? []).map(a => [a.claim_id, a.amount])
  )
  return claims
    .filter(claim => !claim.is_archived)
    .map(claim => {
      const amount = previousAmounts.get(claim.id) ?? null
      return {
        claimId: claim.id,
        name: claim.name,
        amount: amount === null ? '' : String(amount),
        carried: amount !== null,
        previousAmount: amount
      }
    })
    .sort(
      (a, b) =>
        (b.previousAmount ?? 0) - (a.previousAmount ?? 0) ||
        a.name.localeCompare(b.name)
    )
}

// Editing: the snapshot's own values, no carried-forward state. Its stored
// rates count as typed (no auto-fill) and keep their source. Claims it has
// amounts for stay listed even if archived or deleted since.
function editValuesFrom (editing: WealthSnapshot, claims: Claim[]): FormValues {
  const saved = editing.allocations ?? []
  const savedIds = new Set(saved.map(a => a.claim_id))
  const allocations: AllocationValues[] = [
    ...saved.map(allocation => ({
      claimId: allocation.claim_id,
      name: allocation.claim?.name ?? '',
      amount: String(allocation.amount),
      carried: false,
      previousAmount: null
    })),
    ...claims
      .filter(claim => !claim.is_archived && !savedIds.has(claim.id))
      .map(claim => ({
        claimId: claim.id,
        name: claim.name,
        amount: '',
        carried: false,
        previousAmount: null
      }))
  ].sort(
    (a, b) =>
      (Number(b.amount) || 0) - (Number(a.amount) || 0) ||
      a.name.localeCompare(b.name)
  )

  return {
    snapshot_date: parseSnapshotDate(editing.snapshot_date),
    display_currency: editing.display_currency,
    note: editing.note ?? '',
    lines: (editing.lines ?? []).map(line => ({
      label: line.label,
      type: line.type,
      currency: line.currency,
      amount: String(line.amount),
      ...rateToInput(line.rate),
      rateSource: line.rate_source,
      rateDate: null,
      rateTouched: true,
      is_liquid: line.is_liquid,
      carried: false,
      previousAmount: null
    })),
    allocations
  }
}

function defaultValuesFrom (
  previous: WealthSnapshot | null,
  claims: Claim[]
): FormValues {
  const allocations = allocationsFrom(previous, claims)
  if (!previous?.lines?.length) {
    return {
      snapshot_date: new Date(),
      display_currency: DEFAULT_DISPLAY_CURRENCY,
      note: '',
      lines: [emptyLine()],
      allocations
    }
  }
  return {
    allocations,
    snapshot_date: new Date(),
    display_currency: previous.display_currency,
    note: '',
    lines: previous.lines.map(line => ({
      label: line.label,
      type: line.type,
      currency: line.currency,
      amount: String(line.amount),
      // Last snapshot's rate until a fetched one for the new date replaces it
      ...rateToInput(line.rate),
      rateSource: null,
      rateDate: null,
      rateTouched: false,
      is_liquid: line.is_liquid,
      carried: true,
      previousAmount: line.amount
    }))
  }
}

// Stable reference, so useQueries can memoise the combined result
function settledRates (
  results: { isSuccess: boolean; data?: ResolvedRate | null }[]
) {
  return results.map(result => ({
    settled: result.isSuccess,
    rate: result.data ?? null
  }))
}

// display_currency units per 1 unit of the line currency
function effectiveRate (line: LineValues, displayCurrency: CurrencyType) {
  if (line.currency === displayCurrency) return 1
  const typed = parseNumber(line.rate)
  if (!Number.isFinite(typed) || typed === 0) return NaN
  return line.rateInverted ? 1 / typed : typed
}

function convertedAmount (line: LineValues, displayCurrency: CurrencyType) {
  return parseNumber(line.amount) * effectiveRate(line, displayCurrency)
}

// Under a carried-forward amount: still last time's figure, or what it was
// before the user edited it
function CarriedHint ({
  carried,
  previousAmount,
  currency
}: {
  carried: boolean
  previousAmount: number | null
  currency: CurrencyType
}) {
  const { t } = useTranslation('common')
  const { formatBalance } = usePrivacy()

  if (carried) {
    return (
      <p className='text-xs text-muted-foreground mt-1'>
        {t('wealth.form.carried')}
      </p>
    )
  }
  if (previousAmount === null) return null
  return (
    <p className='text-xs text-primary mt-1'>
      {t('wealth.form.edited', {
        amount: formatBalance(previousAmount, currency)
      })}
    </p>
  )
}

// New snapshot (seeded from `previous`) or, with `editing`, an existing one
export function SnapshotForm ({
  previous,
  claims,
  editing
}: {
  previous: WealthSnapshot | null
  claims: Claim[]
  editing?: WealthSnapshot
}) {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: editing
      ? editValuesFrom(editing, claims)
      : defaultValuesFrom(previous, claims)
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'lines'
  })
  const lines = useWatch({ control, name: 'lines' })
  const allocations = useWatch({ control, name: 'allocations' })
  const displayCurrency = useWatch({ control, name: 'display_currency' })
  const snapshotDate = useWatch({ control, name: 'snapshot_date' })

  // A default rate per foreign currency for the snapshot's date. Only a
  // default: lines the user typed a rate into are never overwritten.
  const foreignCurrencies = [
    ...new Set(
      lines.map(line => line.currency).filter(c => c !== displayCurrency)
    )
  ].sort()
  const fetchedRates = useQueries({
    queries: foreignCurrencies.map(currency => ({
      queryKey: [
        'fx-rate',
        snapshotDate ? toDateKey(snapshotDate) : null,
        currency,
        displayCurrency
      ],
      queryFn: () => fxService.getRate(snapshotDate, currency, displayCurrency),
      enabled: Boolean(snapshotDate),
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
    lines.forEach((line, index) => {
      if (line.currency === displayCurrency || line.rateTouched) return
      const fetched = rateByCurrency.get(line.currency)
      if (!fetched?.settled) return

      if (fetched.rate) {
        const input = rateToInput(fetched.rate.rate)
        // Compare values, not text, so the ⇄ toggle isn't undone
        const current = effectiveRate(line, displayCurrency)
        if (
          line.rateSource === fetched.rate.source &&
          line.rateDate === fetched.rate.date &&
          Math.abs(current - fetched.rate.rate) <=
            1e-9 * Math.abs(fetched.rate.rate)
        ) {
          return
        }
        setValue(`lines.${index}.rate`, input.rate, { shouldValidate: true })
        setValue(`lines.${index}.rateInverted`, input.rateInverted)
        setValue(`lines.${index}.rateSource`, fetched.rate.source)
        setValue(`lines.${index}.rateDate`, fetched.rate.date)
      } else if (line.rateSource) {
        // An earlier auto-filled rate no longer applies (e.g. the date moved):
        // leave the field empty rather than keep a rate for another day
        setValue(`lines.${index}.rate`, '', { shouldValidate: true })
        setValue(`lines.${index}.rateSource`, null)
        setValue(`lines.${index}.rateDate`, null)
      }
    })
  }, [lines, displayCurrency, rateByCurrency, setValue])

  const converted = lines.map(line => convertedAmount(line, displayCurrency))
  const totals = computeTotals(
    lines.map((line, i) => ({
      converted_amount: Number.isFinite(converted[i]) ? converted[i] : 0,
      is_liquid: line.is_liquid
    }))
  )

  const claimed = sumAllocations(
    allocations.map(allocation => {
      const amount = parseNumber(allocation.amount)
      return { amount: Number.isFinite(amount) ? amount : 0 }
    })
  )

  const copiedCount = lines.filter(line => line.previousAmount !== null).length
  const carriedCount = lines.filter(line => line.carried).length

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues): Promise<void> => {
      const lineDTOs: CreateSnapshotLineDTO[] = values.lines.map(
        (line, index) => {
          const amount = parseNumber(line.amount)
          const rate = effectiveRate(line, values.display_currency)
          return {
            label: line.label.trim(),
            type: line.type,
            currency: line.currency,
            amount,
            rate,
            rate_source:
              line.currency === values.display_currency
                ? null
                : line.rateSource,
            converted_amount: amount * rate,
            is_liquid: line.is_liquid,
            sort_order: index
          }
        }
      )
      const allocationDTOs: CreateSnapshotAllocationDTO[] = values.allocations
        .map(allocation => ({
          claim_id: allocation.claimId,
          amount: parseNumber(allocation.amount)
        }))
        .filter(allocation => allocation.amount > 0)
      const snapshot = {
        snapshot_date: toDateKey(values.snapshot_date),
        display_currency: values.display_currency,
        note: values.note.trim() || null
      }
      if (editing) {
        await wealthService.update(editing.id, snapshot, lineDTOs, allocationDTOs)
      } else {
        await wealthService.create(snapshot, lineDTOs, allocationDTOs)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wealth-snapshots'] })
      if (editing) {
        queryClient.invalidateQueries({
          queryKey: ['wealth-snapshot', editing.id]
        })
        toastService.success(t('wealth.success.updated'))
        router.push(`/wealth/${editing.id}`)
      } else {
        toastService.success(t('wealth.success.created'))
        router.push('/wealth')
      }
    },
    onError: (error: Error) => {
      console.error('Failed to save snapshot:', error)
      toastService.error(
        error.message === DUPLICATE_SNAPSHOT_DATE
          ? t('wealth.errors.duplicateDate')
          : t(editing ? 'wealth.errors.updateFailed' : 'wealth.errors.createFailed')
      )
    }
  })

  const toggleRateDirection = (index: number) => {
    const line = getValues(`lines.${index}`)
    const typed = parseNumber(line.rate)
    if (Number.isFinite(typed) && typed !== 0) {
      setValue(`lines.${index}.rate`, String(1 / typed), {
        shouldValidate: true
      })
    }
    setValue(`lines.${index}.rateInverted`, !line.rateInverted)
  }

  const fieldError = (message?: string) =>
    message ? <p className='text-xs text-destructive mt-1'>{t(message)}</p> : null

  return (
    <form
      onSubmit={handleSubmit(values => saveMutation.mutate(values))}
      className='space-y-4 sm:space-y-6'
    >
      <div className='flex items-center justify-between gap-2'>
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
          {t(editing ? 'wealth.form.editTitle' : 'wealth.form.title')}
        </h1>
      </div>

      <Card>
        <CardContent className='pt-6 grid gap-4 sm:grid-cols-[auto_auto_1fr]'>
          <div>
            <Label className='block mb-1'>{t('wealth.form.date')}</Label>
            <Controller
              control={control}
              name='snapshot_date'
              render={({ field }) => (
                <DatePicker
                  date={field.value}
                  onSelect={field.onChange}
                  placeholder={t('wealth.form.pickDate')}
                />
              )}
            />
            {fieldError(errors.snapshot_date?.message)}
          </div>
          <div>
            <Label className='block mb-1'>
              {t('wealth.form.displayCurrency')}
            </Label>
            <Controller
              control={control}
              name='display_currency'
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
              {t('wealth.form.note')}
            </Label>
            <Input
              id='note'
              placeholder={t('wealth.form.notePlaceholder')}
              {...register('note')}
            />
          </div>
        </CardContent>
      </Card>

      <div className='space-y-3'>
        <h2 className='text-base sm:text-lg font-semibold'>
          {t('wealth.form.lines')}
        </h2>

        {fields.map((field, index) => {
          const line = lines[index] ?? field
          const sameCurrency = line.currency === displayCurrency
          const lineErrors = errors.lines?.[index]
          const [from, to] = line.rateInverted
            ? [displayCurrency, line.currency]
            : [line.currency, displayCurrency]

          return (
            <Card key={field.id}>
              <CardContent className='pt-4 grid gap-3 grid-cols-2 lg:grid-cols-[2fr_1fr_6rem_1fr_1.4fr_auto_auto] lg:items-start'>
                <div className='col-span-2 lg:col-span-1'>
                  <Label className='block mb-1 text-xs'>
                    {t('wealth.form.label')}
                  </Label>
                  <Input
                    placeholder={t('wealth.form.labelPlaceholder')}
                    {...register(`lines.${index}.label`)}
                  />
                  {fieldError(lineErrors?.label?.message)}
                </div>

                <div>
                  <Label className='block mb-1 text-xs'>
                    {t('wealth.form.type')}
                  </Label>
                  <Controller
                    control={control}
                    name={`lines.${index}.type`}
                    render={({ field: typeField }) => (
                      <Select
                        value={typeField.value}
                        onValueChange={value => {
                          typeField.onChange(value)
                          setValue(
                            `lines.${index}.is_liquid`,
                            LIQUID_BY_DEFAULT[value as WalletType]
                          )
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WALLET_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {t(`wallets.types.${type}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label className='block mb-1 text-xs'>
                    {t('wealth.form.currency')}
                  </Label>
                  <Controller
                    control={control}
                    name={`lines.${index}.currency`}
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
                    {t('wealth.form.amount')}
                  </Label>
                  <Input
                    inputMode='decimal'
                    placeholder='0'
                    className='tabular-nums'
                    {...register(`lines.${index}.amount`, {
                      onChange: () =>
                        line.carried &&
                        setValue(`lines.${index}.carried`, false)
                    })}
                  />
                  {fieldError(lineErrors?.amount?.message)}
                  <CarriedHint
                    carried={line.carried}
                    previousAmount={line.previousAmount}
                    currency={line.currency}
                  />
                </div>

                <div>
                  <Label className='block mb-1 text-xs'>
                    {t('wealth.form.rate')}
                  </Label>
                  {sameCurrency ? (
                    <Input value='1' readOnly disabled className='tabular-nums' />
                  ) : (
                    <>
                      <div className='flex gap-1'>
                        <Input
                          inputMode='decimal'
                          placeholder='0'
                          className='tabular-nums'
                          {...register(`lines.${index}.rate`, {
                            onChange: () => {
                              setValue(`lines.${index}.rateTouched`, true)
                              setValue(`lines.${index}.rateSource`, null)
                              setValue(`lines.${index}.rateDate`, null)
                            }
                          })}
                        />
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          className='shrink-0'
                          title={t('wealth.form.swapRate')}
                          aria-label={t('wealth.form.swapRate')}
                          onClick={() => toggleRateDirection(index)}
                        >
                          <ArrowLeftRight className='h-4 w-4' />
                        </Button>
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {t('wealth.form.rateDirection', { from, to })}
                      </p>
                      {line.rateSource ? (
                        <p className='text-xs text-muted-foreground'>
                          {line.rateDate
                            ? t('wealth.form.rateFrom', {
                              source: t(`wealth.sources.${line.rateSource}`),
                              date: formatShortDate(
                                line.rateDate,
                                i18n.language
                              )
                            })
                            : t('wealth.form.rateFromStored', {
                              source: t(`wealth.sources.${line.rateSource}`)
                            })}
                        </p>
                      ) : (
                        !line.rateTouched &&
                        rateByCurrency.get(line.currency)?.settled &&
                        !rateByCurrency.get(line.currency)?.rate && (
                          <p className='text-xs text-muted-foreground'>
                            {t('wealth.form.rateMissing')}
                          </p>
                        )
                      )}
                    </>
                  )}
                  {!sameCurrency && fieldError(lineErrors?.rate?.message)}
                </div>

                <div className='flex items-center gap-2 lg:flex-col lg:items-center lg:gap-1'>
                  <Label
                    htmlFor={`liquid-${field.id}`}
                    className='text-xs lg:mb-2'
                  >
                    {t('wealth.form.liquid')}
                  </Label>
                  <Controller
                    control={control}
                    name={`lines.${index}.is_liquid`}
                    render={({ field: liquidField }) => (
                      <Checkbox
                        id={`liquid-${field.id}`}
                        checked={liquidField.value}
                        onCheckedChange={checked =>
                          liquidField.onChange(checked === true)
                        }
                      />
                    )}
                  />
                </div>

                <div className='flex items-center justify-end gap-2 lg:pt-6'>
                  <span className='text-sm tabular-nums text-muted-foreground whitespace-nowrap'>
                    {Number.isFinite(converted[index])
                      ? formatBalance(converted[index], displayCurrency)
                      : '—'}
                  </span>
                  <div className='flex flex-col'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-5 w-8'
                      aria-label={t('wealth.form.moveUp')}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ChevronUp className='h-4 w-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-5 w-8'
                      aria-label={t('wealth.form.moveDown')}
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ChevronDown className='h-4 w-4' />
                    </Button>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    aria-label={t('wealth.form.removeLine')}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {fields.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            {t('wealth.validation.noLines')}
          </p>
        )}

        <Button
          type='button'
          variant='outline'
          onClick={() =>
            append({ ...emptyLine(), currency: getValues('display_currency') })
          }
        >
          <Plus className='h-4 w-4 mr-1' />
          {t('wealth.form.addLine')}
        </Button>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm font-medium'>
              {t('wealth.totals.netWorth')}
            </p>
            <p className='text-xs text-muted-foreground'>
              {t('wealth.totals.netWorthHint')}
            </p>
            <p className='text-2xl font-bold tabular-nums mt-2'>
              {formatBalance(totals.netWorth, displayCurrency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-sm font-medium'>{t('wealth.totals.liquid')}</p>
            <p className='text-xs text-muted-foreground'>
              {t('wealth.totals.liquidHint')}
            </p>
            <p className='text-2xl font-bold tabular-nums mt-2'>
              {formatBalance(totals.liquid, displayCurrency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='space-y-3'>
        <div>
          <h2 className='text-base sm:text-lg font-semibold'>
            {t('wealth.form.claimsSection')}
          </h2>
          <p className='text-xs text-muted-foreground'>
            {t('wealth.form.claimsHint', { currency: displayCurrency })}
          </p>
        </div>

        {allocations.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            {t('wealth.form.noClaims')}{' '}
            <Link href='/claims' className='underline underline-offset-4'>
              {t('wealth.form.manageClaims')}
            </Link>
          </p>
        ) : (
          <Card>
            <CardContent className='pt-4 space-y-3'>
              {allocations.map((allocation, index) => (
                <div
                  key={allocation.claimId}
                  className='grid grid-cols-[1fr_10rem] gap-3 items-start'
                >
                  <Label
                    htmlFor={`allocation-${allocation.claimId}`}
                    className='pt-2.5 truncate'
                  >
                    {allocation.name}
                  </Label>
                  <div>
                    <div className='relative'>
                      <Input
                        id={`allocation-${allocation.claimId}`}
                        inputMode='decimal'
                        placeholder='0'
                        className='tabular-nums pr-12'
                        {...register(`allocations.${index}.amount`, {
                          onChange: () =>
                            allocation.carried &&
                            setValue(`allocations.${index}.carried`, false)
                        })}
                      />
                      <span className='pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground'>
                        {displayCurrency}
                      </span>
                    </div>
                    {fieldError(errors.allocations?.[index]?.amount?.message)}
                    <CarriedHint
                      carried={allocation.carried}
                      previousAmount={allocation.previousAmount}
                      currency={displayCurrency}
                    />
                  </div>
                </div>
              ))}
              <div className='flex justify-between border-t pt-3 text-sm font-medium'>
                <span>{t('wealth.totals.claimed')}</span>
                <span className='tabular-nums'>
                  {formatBalance(claimed, displayCurrency)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {previous && copiedCount > 0 && (
        <p className='text-sm text-muted-foreground sm:text-right'>
          {t('wealth.form.copiedSummary', {
            date: formatSnapshotDate(previous.snapshot_date, i18n.language),
            carried: carriedCount,
            total: copiedCount
          })}
        </p>
      )}

      <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() =>
            router.push(editing ? `/wealth/${editing.id}` : '/wealth')
          }
        >
          {t('common.cancel')}
        </Button>
        <Button
          type='submit'
          disabled={
            fields.length === 0 || !isValid || saveMutation.isPending
          }
        >
          {saveMutation.isPending ? t('wealth.form.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  )
}
