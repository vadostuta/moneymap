'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useWallet } from '@/contexts/wallet-context'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LogIn, Plus } from 'lucide-react'
import Link from 'next/link'
import { Template } from '@/types/template'
import { TemplateBuilderModal } from '@/components/template/TemplateBuilderModal'
import { TemplateCard } from '@/components/template/TemplateCard'

export default function StartPage () {
  const { user, signInWithGoogle, loading } = useAuth()
  const { wallets, isLoading: walletsLoading } = useWallet()
  const { t } = useTranslation('common')

  // Template state
  const [templates, setTemplates] = useState<Template[]>([])
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  const handleCreateTemplate = (template: Template) => {
    setTemplates(prev => [...prev, template])
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  if (loading || walletsLoading) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-24 w-full'>
      <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
        <div>
          <svg
            width='80'
            height='80'
            viewBox='0 0 200 200'
            xmlns='http://www.w3.org/2000/svg'
            className='text-primary mx-auto mb-6'
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
        </div>

        <h1 className='text-4xl font-bold mb-6 text-foreground'>
          {user ? `Hey ${user.email?.split('@')[0]}!` : 'Hey! Login here'}
        </h1>

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
            <div className='pt-4'>
              <Button
                size='lg'
                className='gap-2'
                onClick={() => setIsTemplateModalOpen(true)}
              >
                <Plus className='h-5 w-5' />
                Create Template
              </Button>
            </div>

            {/* Templates Section */}
            {templates.length > 0 && (
              <div className='w-full space-y-4'>
                <h2 className='text-2xl font-semibold text-foreground text-left w-full'>
                  Your Templates
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full'>
                  {templates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onDelete={handleDeleteTemplate}
                    />
                  ))}
                </div>
              </div>
            )}

            {templates.length === 0 && (
              <div className='text-center py-8'>
                <p className='text-muted-foreground mb-4'>
                  No templates created yet. Create your first template to get
                  started!
                </p>
              </div>
            )}
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
