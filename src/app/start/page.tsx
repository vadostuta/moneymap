'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useWallet } from '@/contexts/wallet-context'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LogIn, Plus, Calendar, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Template } from '@/types/template'
import { TemplateBuilderModal } from '@/components/template/TemplateBuilderModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateService } from '@/lib/services/template'
import { toast } from '@/components/ui/use-toast'
import { Logo } from '@/components/ui/Logo'

export default function StartPage () {
  const { user, signInWithGoogle, loading } = useAuth()
  const { wallets, isLoading: walletsLoading } = useWallet()
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    if (error) {
      setAuthError(message || `Authentication failed: ${error}`)
      console.error('Auth error from URL:', { error, message })
    }
  }, [searchParams])

  // Template state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

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

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: templateService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast({
        title: t('templates.deleted'),
        description: t('templates.deleteSuccess')
      })
    },
    onError: error => {
      toast({
        title: t('common.error'),
        description: t('templates.deleteError'),
        variant: 'destructive'
      })
      console.error('Template deletion failed:', error)
    }
  })

  const handleCreateTemplate = () => {
    // This is now handled by the mutation in TemplateBuilderModal
    // Just close the modal
    setIsTemplateModalOpen(false)
  }

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplateMutation.mutate(templateId)
  }

  const handleViewTemplate = (template: Template) => {
    router.push(`/template/${template.id}`)
  }

  if (loading || walletsLoading || templatesLoading) {
    return (
      <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-24 w-full'>
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
                    className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 h-[80px] animate-pulse w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] lg:max-w-[400px]'
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
                <div className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 h-[80px] animate-pulse w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] lg:max-w-[400px]'>
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
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
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
              ? t('start.heyUser', { username: user.email?.split('@')[0] })
              : t('start.heyLogin')}
          </h1>
        </div>

        <p className='text-lg text-muted-foreground'>
          {user ? '' : t('start.welcome')}
        </p>

        {authError && (
          <div className='mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 max-w-md'>
            <AlertCircle className='h-5 w-5 text-destructive flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <p className='text-sm font-medium text-destructive mb-1'>Authentication Error</p>
              <p className='text-xs text-destructive/90'>{authError}</p>
              <p className='text-xs text-muted-foreground mt-2'>
                Check the terminal/console for detailed error logs.
              </p>
            </div>
          </div>
        )}

        {!user && (
          <Button onClick={signInWithGoogle} size='lg' className='gap-2'>
            <LogIn className='h-5 w-5' />
            {t('auth.signInWithGoogle')}
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
                {templates.map(template => {
                  return (
                    <div
                      key={template.id}
                      className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden h-[80px] w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] lg:max-w-[400px]'
                      onClick={() => handleViewTemplate(template)}
                    >
                      {/* Subtle background pattern */}
                      <div className='absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-primary/1 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />

                      {/* Delete button - positioned at top right */}
                      <div className='absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation()
                            handleDeleteTemplate(template.id)
                          }}
                          className='h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors'
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>

                      <div className='relative z-10 pr-8 flex flex-col justify-center h-full'>
                        {/* Template name - aligned to left */}
                        <h3 className='font-semibold text-foreground text-base mb-2 text-left group-hover:text-primary transition-colors duration-200'>
                          {template.name}
                        </h3>

                        {/* Meta information */}
                        <div className='flex items-center text-sm text-muted-foreground'>
                          <div className='flex items-center gap-1.5'>
                            <Calendar className='h-3.5 w-3.5' />
                            <span className='font-medium'>
                              {new Date(template.created_at).toLocaleDateString(
                                i18n.language === 'ua' ? 'uk-UA' : 'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric'
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Create Template Button - styled like template cards (now last) */}
                <div
                  className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden h-[80px] w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] lg:max-w-[400px]'
                  onClick={() => setIsTemplateModalOpen(true)}
                >
                  {/* Subtle background pattern */}
                  <div className='absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-primary/1 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />

                  <div className='relative z-10 flex items-center justify-center h-full text-center gap-2'>
                    <div className='p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors'>
                      <Plus className='h-4 w-4 text-primary' />
                    </div>
                    <h3 className='font-semibold text-foreground text-sm group-hover:text-primary transition-colors duration-200'>
                      {t('templates.create')}
                    </h3>
                  </div>
                </div>
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
        onSave={handleCreateTemplate}
      />
    </main>
  )
}
