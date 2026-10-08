'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { displayName } from '@/lib/auth/username'
import { useWallet } from '@/contexts/wallet-context'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LogIn, Plus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Template } from '@/types/template'
import { TemplateBuilderModal } from '@/components/template/TemplateBuilderModal'
import { TemplateTile } from '@/components/template/TemplateTile'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateService } from '@/lib/services/template'
import { toastService } from '@/lib/services/toast'
import { Logo } from '@/components/ui/Logo'

export default function StartPage () {
  const { user, loading } = useAuth()
  const { wallets, isLoading: walletsLoading } = useWallet()
  const { t } = useTranslation('common')
  const queryClient = useQueryClient()
  // Template state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  // Fetch templates using React Query
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError
  } = useQuery({
    queryKey: ['templates'],
    queryFn: templateService.getAll,
    enabled: !!user
  })

  // Pinned first, then newest first (the order getAll returns)
  const sortedTemplates = [...templates].sort(
    (a, b) => Number(!!b.is_pinned) - Number(!!a.is_pinned)
  )

  const invalidateTemplates = () =>
    queryClient.invalidateQueries({ queryKey: ['templates'] })

  const restoreTemplateMutation = useMutation({
    mutationFn: templateService.restore,
    onSuccess: invalidateTemplates,
    onError: error => {
      toastService.error(t('templates.restoreError'))
      console.error('Template restore failed:', error)
    }
  })

  // Soft delete, with an undo button in the toast
  const deleteTemplateMutation = useMutation({
    mutationFn: (template: Template) => templateService.delete(template.id),
    onSuccess: (_, template) => {
      invalidateTemplates()
      toast(
        toastItem => (
          <span className='flex items-center gap-3 text-sm'>
            {t('templates.deletedNamed', { name: template.name })}
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                toast.dismiss(toastItem.id)
                restoreTemplateMutation.mutate(template.id)
              }}
            >
              {t('common.undo')}
            </Button>
          </span>
        ),
        { position: 'bottom-center', duration: 6000 }
      )
    },
    onError: error => {
      toastService.error(t('templates.deleteError'))
      console.error('Template deletion failed:', error)
    }
  })

  const duplicateTemplateMutation = useMutation({
    mutationFn: (template: Template) =>
      templateService.duplicate(
        template,
        t('templates.copyName', { name: template.name })
      ),
    onSuccess: copy => {
      invalidateTemplates()
      toastService.success(t('templates.duplicated', { name: copy?.name }))
    },
    onError: error => {
      toastService.error(t('templates.duplicateError'))
      console.error('Template duplication failed:', error)
    }
  })

  const pinTemplateMutation = useMutation({
    mutationFn: (template: Template) =>
      templateService.update(template.id, { is_pinned: !template.is_pinned }),
    onSuccess: invalidateTemplates,
    onError: error => {
      toastService.error(t('templates.pinError'))
      console.error('Template pin failed:', error)
    }
  })

  const openBuilder = (template: Template | null) => {
    setEditingTemplate(template)
    setIsTemplateModalOpen(true)
  }

  if (loading || walletsLoading || templatesLoading) {
    return (
      <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-4 md:p-24 w-full'>
        <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
          <div className='flex items-center gap-4 mb-6'>
            <Logo size='lg' />

            <h1 className='text-4xl font-bold text-foreground'>
              {t('common.loading')}
            </h1>
          </div>

          <p className='text-lg text-muted-foreground'>
            {t('start.loadingData')}
          </p>

          <div className='space-y-8 flex flex-col items-center w-full'>
            {/* Templates Section with Create Button */}
            <div className='w-full space-y-4'>
              <div className='flex flex-wrap justify-start gap-4'>
                {/* Loading skeleton for template cards */}
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 h-[88px] animate-pulse w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] lg:max-w-[400px]'
                  >
                    <div className='relative z-10 pr-8 flex flex-col justify-center h-full'>
                      <div className='h-5 w-32 bg-muted/40 rounded mb-2'></div>
                      <div className='flex items-center gap-3'>
                        <div className='h-3 w-16 bg-muted/40 rounded'></div>
                        <div className='h-4 w-12 bg-muted/40 rounded'></div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading skeleton for create button (now last) */}
                <div className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 h-[88px] animate-pulse w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] lg:max-w-[400px]'>
                  <div className='flex items-center justify-center h-full text-center gap-2'>
                    <div className='p-2 rounded-full bg-muted/20'>
                      <div className='h-4 w-4 bg-muted/40 rounded'></div>
                    </div>
                    <div className='h-4 w-24 bg-muted/40 rounded'></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (templatesError) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-4 md:p-24'>
        <div className='text-center'>
          <p className='text-destructive'>
            {t('templates.loadError', { message: templatesError.message })}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-2 md:p-24 w-full'>
      <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
        <div className='flex items-center gap-4 mb-6'>
          <Logo size='lg' />

          <h1 className='text-4xl font-bold text-foreground'>
            {user
              ? t('start.heyUser', { username: displayName(user).split('@')[0] })
              : t('start.heyLogin')}
          </h1>
        </div>

        <p className='text-lg text-muted-foreground'>
          {user ? '' : t('start.welcome')}
        </p>

        {!user && (
          <Button asChild size='lg' className='gap-2'>
            <Link href='/login'>
              <LogIn className='h-5 w-5' />
              {t('auth.signIn')}
            </Link>
          </Button>
        )}

        {user && wallets.length === 0 && (
          <p className='text-sm text-muted-foreground mb-6'>
            {t('start.createFirstWallet')}{' '}
            <Link
              href='/wallets'
              className='text-primary hover:underline font-medium'
            >
              {t('start.wallet')}
            </Link>
          </p>
        )}

        {user && (
          <div className='space-y-8 flex flex-col items-center w-full'>
            {/* Templates Section with Create Button */}
            <div className='w-full space-y-4'>
              <div className='flex flex-wrap justify-start gap-4'>
                {/* Existing Templates */}
                {sortedTemplates.map(template => (
                  <TemplateTile
                    key={template.id}
                    template={template}
                    onEdit={openBuilder}
                    onDuplicate={duplicateTemplateMutation.mutate}
                    onTogglePin={pinTemplateMutation.mutate}
                    onDelete={deleteTemplateMutation.mutate}
                  />
                ))}

                {/* Create Template Button - styled like template cards (now last) */}
                <button
                  type='button'
                  className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden h-[88px] w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] lg:max-w-[400px]'
                  onClick={() => openBuilder(null)}
                >
                  {/* Subtle background pattern */}
                  <div className='absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-primary/1 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />

                  <div className='relative z-10 flex items-center justify-center h-full text-center gap-2'>
                    <div className='p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors'>
                      <Plus className='h-4 w-4 text-primary' />
                    </div>
                    <span className='font-semibold text-foreground text-sm group-hover:text-primary transition-colors duration-200'>
                      {t('templates.create')}
                    </span>
                  </div>
                </button>
              </div>

              {templates.length === 0 && (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground mb-4'>
                    {t('templates.noTemplatesYet')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Template Builder Modal */}
      <TemplateBuilderModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSave={() => setIsTemplateModalOpen(false)}
        template={editingTemplate}
      />
    </main>
  )
}
