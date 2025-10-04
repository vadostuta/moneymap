'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useWallet } from '@/contexts/wallet-context'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogIn, Plus, Calendar, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Template } from '@/types/template'
import { TemplateBuilderModal } from '@/components/template/TemplateBuilderModal'
import { TemplateViewModal } from '@/components/template/TemplateViewModal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templateService } from '@/lib/services/template'
import { toast } from '@/components/ui/use-toast'
import { getLayoutById } from '@/lib/layout-registry'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export default function StartPage () {
  const { user, signInWithGoogle, loading } = useAuth()
  const { wallets, isLoading: walletsLoading } = useWallet()
  const { t } = useTranslation('common')
  const queryClient = useQueryClient()

  // Template state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  )
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

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
        title: 'Template Deleted',
        description: 'Template has been deleted successfully.'
      })
    },
    onError: error => {
      toast({
        title: 'Error',
        description: 'Failed to delete template. Please try again.',
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
    setSelectedTemplate(template)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedTemplate(null)
  }

  if (loading || walletsLoading || templatesLoading) {
    return (
      <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-24 w-full'>
        <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
          <div className='flex items-center gap-4 mb-6'>
            <svg
              width='60'
              height='60'
              viewBox='0 0 200 200'
              xmlns='http://www.w3.org/2000/svg'
              className='text-primary'
            >
              {/* Pie Chart Segments */}
              <circle cx='100' cy='100' r='70' fill='currentColor' />
              <path
                d='M100,30 A70,70 0 0,1 170,100 L140,100 A40,40 0 0,0 100,60 Z'
                fill='#57C6E1'
              />
              <path
                d='M170,100 A70,70 0 0,1 100,170 L100,140 A40,40 0 0,0 140,100 Z'
                fill='#4DA3FF'
              />
              <path
                d='M100,170 A70,70 0 0,1 30,100 L60,100 A40,40 0 0,0 100,140 Z'
                fill='#FF6B6B'
              />
              <path
                d='M30,100 A70,70 0 0,1 100,30 L100,60 A40,40 0 0,0 60,100 Z'
                fill='#FFD93D'
              />
              {/* Inner Circle (White Center) */}
              <circle cx='100' cy='100' r='40' fill='#fff' />
            </svg>

            <h1 className='text-4xl font-bold text-foreground'>Loading...</h1>
          </div>

          <p className='text-lg text-muted-foreground'>
            Please wait while we load your data...
          </p>

          <div className='space-y-8 flex flex-col items-center w-full'>
            {/* Templates Section with Create Button */}
            <div className='w-full space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {/* Loading skeleton for create button */}
                <div className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 h-[80px] animate-pulse'>
                  <div className='flex items-center justify-center h-full text-center gap-2'>
                    <div className='p-2 rounded-full bg-muted/20'>
                      <div className='h-4 w-4 bg-muted/40 rounded'></div>
                    </div>
                    <div className='h-4 w-24 bg-muted/40 rounded'></div>
                  </div>
                </div>

                {/* Loading skeleton for template cards */}
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 h-[80px] animate-pulse'
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
            Error loading templates: {templatesError.message}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-24 w-full'>
      <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
        <div className='flex items-center gap-4 mb-6'>
          <svg
            width='60'
            height='60'
            viewBox='0 0 200 200'
            xmlns='http://www.w3.org/2000/svg'
            className='text-primary'
          >
            {/* Pie Chart Segments */}
            <circle cx='100' cy='100' r='70' fill='currentColor' />
            <path
              d='M100,30 A70,70 0 0,1 170,100 L140,100 A40,40 0 0,0 100,60 Z'
              fill='#57C6E1'
            />
            <path
              d='M170,100 A70,70 0 0,1 100,170 L100,140 A40,40 0 0,0 140,100 Z'
              fill='#4DA3FF'
            />
            <path
              d='M100,170 A70,70 0 0,1 30,100 L60,100 A40,40 0 0,0 100,140 Z'
              fill='#FF6B6B'
            />
            <path
              d='M30,100 A70,70 0 0,1 100,30 L100,60 A40,40 0 0,0 60,100 Z'
              fill='#FFD93D'
            />
            {/* Inner Circle (White Center) */}
            <circle cx='100' cy='100' r='40' fill='#fff' />
          </svg>

          <h1 className='text-4xl font-bold text-foreground'>
            {user ? `Hey ${user.email?.split('@')[0]}!` : 'Hey! Login here'}
          </h1>
        </div>

        <p className='text-lg text-muted-foreground'>
          {user
            ? ''
            : 'Welcome to MoneyMap! Sign in to start tracking your finances.'}
        </p>

        {user && wallets.length === 0 && (
          <p className='text-sm text-muted-foreground mb-6'>
            First you need to create your first{' '}
            <Link
              href='/wallets'
              className='text-primary hover:underline font-medium'
            >
              wallet
            </Link>
          </p>
        )}

        {!user && (
          <Button onClick={signInWithGoogle} size='lg' className='gap-2'>
            <LogIn className='h-5 w-5' />
            {t('auth.signInWithGoogle')}
          </Button>
        )}

        {user && (
          <div className='space-y-8 flex flex-col items-center w-full'>
            {/* Templates Section with Create Button */}
            <div className='w-full space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {/* Create Template Button - styled like template cards */}
                <div
                  className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden h-[80px]'
                  onClick={() => setIsTemplateModalOpen(true)}
                >
                  {/* Subtle background pattern */}
                  <div className='absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-primary/1 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />

                  <div className='relative z-10 flex items-center justify-center h-full text-center gap-2'>
                    <div className='p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors'>
                      <Plus className='h-4 w-4 text-primary' />
                    </div>
                    <h3 className='font-semibold text-foreground text-sm group-hover:text-primary transition-colors duration-200'>
                      Create Template
                    </h3>
                  </div>
                </div>

                {/* Existing Templates */}
                {templates.map(template => {
                  const layoutDef = getLayoutById(template.layout)

                  return (
                    <div
                      key={template.id}
                      className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden h-[80px]'
                      onClick={() => handleViewTemplate(template)}
                    >
                      {/* Subtle background pattern */}
                      <div className='absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-primary/1 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />

                      {/* Delete button - positioned at top right */}
                      <div className='absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={e => e.stopPropagation()}
                              className='h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-40'>
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation()
                                handleDeleteTemplate(template.id)
                              }}
                              className='text-destructive focus:text-destructive focus:bg-destructive/10 text-sm'
                            >
                              <Trash2 className='h-3 w-3 mr-2' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className='relative z-10 pr-8 flex flex-col justify-center h-full'>
                        {/* Template name - aligned to left */}
                        <h3 className='font-semibold text-foreground text-base mb-2 text-left group-hover:text-primary transition-colors duration-200'>
                          {template.name}
                        </h3>

                        {/* Meta information */}
                        <div className='flex items-center justify-between text-sm text-muted-foreground min-w-0'>
                          <div className='flex items-center gap-1.5 flex-shrink-0'>
                            <Calendar className='h-3.5 w-3.5' />
                            <span className='font-medium'>
                              {new Date(template.created_at).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric'
                                }
                              )}
                            </span>
                          </div>

                          <Badge
                            variant='secondary'
                            className='text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors flex-shrink-0 ml-2'
                          >
                            {layoutDef?.name || 'Custom'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {templates.length === 0 && (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground mb-4'>
                    No templates created yet. Create your first template to get
                    started!
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

      {/* Template View Modal */}
      <TemplateViewModal
        template={selectedTemplate}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />
    </main>
  )
}
