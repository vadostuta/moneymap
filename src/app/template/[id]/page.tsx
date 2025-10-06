'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { templateService } from '@/lib/services/template'
import { TemplateViewer } from '@/components/template/TemplateViewer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function TemplatePage () {
  const params = useParams()
  const router = useRouter()

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
      <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-24 w-full'>
        <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
          <div className='flex items-center gap-4 mb-6'>
            <Logo size='lg' />

            <h1 className='text-4xl font-bold text-foreground'>
              Loading Template...
            </h1>
          </div>

          <p className='text-lg text-muted-foreground'>
            Please wait while we load your template...
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className='flex min-h-screen mt-[-5rem] flex-col items-center justify-center p-24 w-full'>
        <div className='text-center max-w-4xl mx-auto flex flex-col items-center w-full'>
          <div className='flex items-center gap-4 mb-6'>
            <h1 className='text-4xl font-bold text-foreground'>
              Template Not Found
            </h1>
          </div>

          <p className='text-lg text-muted-foreground mb-6'>
            The template you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>

          <Button onClick={() => router.push('/start')} className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Back to Templates
          </Button>
        </div>
      </main>
    )
  }

  if (!template) {
    return null
  }

  return (
    <main className='flex min-h-screen mt-[-5rem] flex-col items-start justify-start p-24 w-full'>
      <div className='max-w-7xl mx-auto w-full'>
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
              Back
            </Button>
          }
        />
      </div>
    </main>
  )
}
