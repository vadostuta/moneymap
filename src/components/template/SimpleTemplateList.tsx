'use client'

import { Template } from '@/types/template'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { Calendar, Trash2 } from 'lucide-react'

interface SimpleTemplateListProps {
  templates: Template[]
  onView: (template: Template) => void
  onDelete: (templateId: string) => void
}

export function SimpleTemplateList ({
  templates,
  onView,
  onDelete
}: SimpleTemplateListProps) {
  const { t, i18n } = useTranslation('common')
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      i18n.language === 'ua' ? 'uk-UA' : 'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    )
  }

  return (
    <div className='w-full space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {templates.map(template => {
          const layoutDef = getLayoutById(template.layout)

          return (
            <div
              key={template.id}
              className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden'
              onClick={() => onView(template)}
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
                    onDelete(template.id)
                  }}
                  className='h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </div>

              <div className='relative z-10 pr-8'>
                {/* Template name - aligned to left */}
                <h3 className='font-semibold text-foreground text-base mb-2 text-left group-hover:text-primary transition-colors duration-200'>
                  {template.name}
                </h3>

                {/* Meta information */}
                <div className='flex items-center text-sm text-muted-foreground'>
                  <div className='flex items-center gap-1.5'>
                    <Calendar className='h-3.5 w-3.5' />
                    <span className='font-medium'>
                      {formatDate(template.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
