'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Target,
  Trash2,
  X
} from 'lucide-react'
import { claimService } from '@/lib/services/claim'
import { toastService } from '@/lib/services/toast'
import { usePrivacy } from '@/contexts/privacy-context'
import { Claim, UpdateClaimDTO } from '@/lib/types/claim'
import { CurrencyType } from '@/lib/types/wallet'
import { DEFAULT_DISPLAY_CURRENCY } from '@/lib/types/wealth'
import {
  CURRENCIES,
  formatSnapshotDate
} from '@/app/wealth/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

const parseNumber = (value: string) =>
  Number(value.replace(/\s/g, '').replace(',', '.'))

const claimSchema = z
  .object({
  name: z.string().trim().min(1, 'claims.validation.nameRequired'),
  target: z
    .string()
    .refine(
      value =>
        value.trim() === '' ||
        (Number.isFinite(parseNumber(value)) && parseNumber(value) > 0),
      'claims.validation.targetInvalid'
    ),
  targetCurrency: z.enum(CURRENCIES as [CurrencyType, ...CurrencyType[]]),
  // A date turns the claim into a goal. Past dates are allowed so an overdue
  // goal stays editable.
  // 'yyyy-MM-dd' from the native date input; '' = no deadline
  targetDate: z.string()
})
  .refine(values => !values.targetDate || values.target.trim() !== '', {
    message: 'claims.validation.dateNeedsTarget',
    path: ['targetDate']
  })

type ClaimFormValues = z.infer<typeof claimSchema>

// null: dialog closed · 'new': adding · Claim: editing that claim
type DialogState = null | 'new' | Claim

export default function ClaimsClient () {
  const { t, i18n } = useTranslation('common')
  const { formatBalance } = usePrivacy()
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDelete, setPendingDelete] = useState<Claim | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: claimService.getAll
  })

  const active = claims.filter(claim => !claim.is_archived)
  const archived = claims.filter(claim => claim.is_archived)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['claims'] })
    // The snapshot form lists active claims
    queryClient.invalidateQueries({ queryKey: ['wealth-snapshots'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (values: ClaimFormValues) => {
      const hasTarget = values.target.trim() !== ''
      const input = {
        name: values.name.trim(),
        target_amount: hasTarget ? parseNumber(values.target) : null,
        target_currency: hasTarget ? values.targetCurrency : null,
        target_date:
          hasTarget && values.targetDate ? values.targetDate : null
      }
      return dialog && dialog !== 'new'
        ? claimService.update(dialog.id, input)
        : claimService.create(input)
    },
    onSuccess: () => {
      invalidate()
      toastService.success(t('claims.success.saved'))
      setDialog(null)
    },
    onError: () => {
      toastService.error(t('claims.errors.saveFailed'))
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClaimDTO }) =>
      claimService.update(id, input),
    onSuccess: invalidate,
    onError: () => {
      toastService.error(t('claims.errors.saveFailed'))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: claimService.softDelete,
    onSuccess: () => {
      invalidate()
      toastService.success(t('claims.success.deleted'))
    },
    onError: () => {
      toastService.error(t('claims.errors.deleteFailed'))
    },
    onSettled: () => setPendingDelete(null)
  })

  const renderRow = (claim: Claim) => (
    <div
      key={claim.id}
      className='flex items-center justify-between gap-2 p-3 border-t first:border-t-0'
    >
      <div className='min-w-0'>
        <div className='flex items-center gap-2'>
          <span className='font-medium truncate'>{claim.name}</span>
          {claim.is_archived && (
            <Badge variant='secondary'>{t('claims.archived')}</Badge>
          )}
        </div>
        {claim.target_amount !== null && (
          <p className='text-xs text-muted-foreground tabular-nums'>
            {t('claims.targetValue', {
              amount: formatBalance(
                claim.target_amount,
                claim.target_currency ?? undefined
              )
            })}
            {claim.target_date &&
              ` · ${t('claims.dueValue', {
                date: formatSnapshotDate(claim.target_date, i18n.language)
              })}`}
          </p>
        )}
      </div>
      <div className='flex shrink-0'>
        <Button
          variant='ghost'
          size='icon'
          aria-label={t('common.edit')}
          title={t('common.edit')}
          onClick={() => setDialog(claim)}
        >
          <Pencil className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          aria-label={t(claim.is_archived ? 'claims.unarchive' : 'claims.archive')}
          title={t(claim.is_archived ? 'claims.unarchive' : 'claims.archive')}
          onClick={() =>
            updateMutation.mutate({
              id: claim.id,
              input: { is_archived: !claim.is_archived }
            })
          }
        >
          {claim.is_archived ? (
            <ArchiveRestore className='h-4 w-4' />
          ) : (
            <Archive className='h-4 w-4' />
          )}
        </Button>
        <Button
          variant='ghost'
          size='icon'
          aria-label={t('common.delete')}
          title={t('common.delete')}
          onClick={() => setPendingDelete(claim)}
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )

  return (
    <div className='container px-3 sm:px-4 md:px-6 ml-0 sm:ml-2 max-w-3xl py-4 space-y-4 sm:space-y-6'>
      <div className='flex items-center justify-between gap-2'>
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold'>
          {t('claims.title')}
        </h1>
        {claims.length > 0 && (
          <Button onClick={() => setDialog('new')}>
            <Plus className='h-4 w-4 mr-1' />
            {t('claims.add')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-12 bg-muted animate-pulse rounded-lg' />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center text-center gap-3 py-10'>
            <Target className='h-10 w-10 text-muted-foreground' />
            <h2 className='text-lg font-semibold'>{t('claims.emptyTitle')}</h2>
            <p className='text-sm text-muted-foreground max-w-md'>
              {t('claims.emptyDescription')}
            </p>
            <Button onClick={() => setDialog('new')}>
              <Plus className='h-4 w-4 mr-1' />
              {t('claims.add')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className='border rounded-lg'>{active.map(renderRow)}</div>
          )}

          {archived.length > 0 && (
            <div className='space-y-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? (
                  <ChevronDown className='h-4 w-4 mr-1' />
                ) : (
                  <ChevronRight className='h-4 w-4 mr-1' />
                )}
                {t('claims.archivedSection', { count: archived.length })}
              </Button>
              {showArchived && (
                <div className='border rounded-lg bg-muted/30'>
                  {archived.map(renderRow)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={dialog !== null} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(dialog === 'new' ? 'claims.add' : 'claims.edit')}
            </DialogTitle>
          </DialogHeader>
          {dialog !== null && (
            <ClaimForm
              // Remount per claim so the form starts from that claim's values
              key={dialog === 'new' ? 'new' : dialog.id}
              claim={dialog === 'new' ? null : dialog}
              saving={saveMutation.isPending}
              onCancel={() => setDialog(null)}
              onSubmit={values => saveMutation.mutate(values)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={open => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('claims.delete.title', { name: pendingDelete?.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('claims.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() =>
                pendingDelete && deleteMutation.mutate(pendingDelete.id)
              }
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ClaimForm ({
  claim,
  saving,
  onCancel,
  onSubmit
}: {
  claim: Claim | null
  saving: boolean
  onCancel: () => void
  onSubmit: (values: ClaimFormValues) => void
}) {
  const { t } = useTranslation('common')
  const {
    control,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      name: claim?.name ?? '',
      target: claim?.target_amount != null ? String(claim.target_amount) : '',
      targetCurrency: claim?.target_currency ?? DEFAULT_DISPLAY_CURRENCY,
      targetDate: claim?.target_date ?? ''
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div>
        <Label htmlFor='claim-name' className='block mb-1'>
          {t('claims.form.name')}
        </Label>
        <Input
          id='claim-name'
          autoFocus
          placeholder={t('claims.form.namePlaceholder')}
          {...register('name')}
        />
        {errors.name?.message && (
          <p className='text-xs text-destructive mt-1'>
            {t(errors.name.message)}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor='claim-target' className='block mb-1'>
          {t('claims.form.target')}
        </Label>
        <div className='flex gap-2'>
          <Input
            id='claim-target'
            inputMode='decimal'
            placeholder={t('claims.form.targetPlaceholder')}
            className='tabular-nums'
            {...register('target')}
          />
          <Controller
            control={control}
            name='targetCurrency'
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  className='w-24 shrink-0'
                  aria-label={t('claims.form.targetCurrency')}
                >
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
        {errors.target?.message && (
          <p className='text-xs text-destructive mt-1'>
            {t(errors.target.message)}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor='claim-target-date' className='block mb-1'>
          {t('claims.form.targetDate')}
        </Label>
        {/* Native input on purpose: the Radix popover calendar can't be
            clicked inside this Radix dialog (mismatched radix versions) */}
        <Controller
          control={control}
          name='targetDate'
          render={({ field }) => (
            <div className='flex gap-2'>
              <Input
                id='claim-target-date'
                type='date'
                className='w-48'
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
              {field.value && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  aria-label={t('claims.form.clearDate')}
                  title={t('claims.form.clearDate')}
                  onClick={() => field.onChange('')}
                >
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>
          )}
        />
        <p className='text-xs text-muted-foreground mt-1'>
          {t('claims.form.targetDateHint')}
        </p>
        {errors.targetDate?.message && (
          <p className='text-xs text-destructive mt-1'>
            {t(errors.targetDate.message)}
          </p>
        )}
      </div>
      <DialogFooter className='gap-2'>
        <Button type='button' variant='outline' onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type='submit' disabled={saving}>
          {t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}
