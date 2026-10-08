'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { templateService } from '@/lib/services/template'
import { TemplateViewer } from '@/components/template/TemplateViewer'
import { TemplateBuilderModal } from '@/components/template/TemplateBuilderModal'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function TemplatePage () {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation('common')
  const [isEditing, setIsEditing] = useState(false)

  const templateId = params.id as string

  // Fetch template data
  const {
    data: template,
    isLoading,
    error
  } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => templateService.getById(templateId),
    enabled: !!templateId
  })

  if (isLoading) {
    return (
      <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-4 md:p-24 w-full'>
        <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
          <div className='flex items-center gap-4 mb-6'>
            <Logo size='lg' />

            <h1 className='text-4xl font-bold text-foreground'>
              {t('common.loading')}
            </h1>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-4 md:p-24 w-full'>
        <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
          <div className='flex items-center gap-4 mb-6'>
            <h1 className='text-4xl font-bold text-foreground'>
              {t('templates.notFoundTitle')}
            </h1>
          </div>

          <p className='text-lg text-muted-foreground mb-6'>
            {t('templates.notFoundText')}
          </p>

          <Button onClick={() => router.push('/start')} className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            {t('templates.backToTemplates')}
          </Button>
        </div>
      </main>
    )
  }

  if (!template) {
    return null
  }

  return (
    <main className='flex min-h-screen mt-[-5rem] flex-col items-start justify-start p-6 sm:p-8 md:p-4 lg:p-24 w-full'>
      <div className='w-full max-w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto'>
        {/* Template Content */}
        <TemplateViewer
          template={template}
          backButton={
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push('/start')}
              className='gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              {t('common.back')}
            </Button>
          }
          actions={
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsEditing(true)}
              className='gap-2 shrink-0'
            >
              <Pencil className='h-4 w-4' />
              {t('common.edit')}
            </Button>
          }
        />
      </div>

      <TemplateBuilderModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={() => setIsEditing(false)}
        template={template}
      />
    </main>
  )
}
