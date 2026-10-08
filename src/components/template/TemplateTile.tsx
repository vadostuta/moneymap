'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Copy,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2
} from 'lucide-react'
import { Template } from '@/types/template'
import { getTranslatedComponentMetadata } from '@/lib/template-registry'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface TemplateTileProps {
  template: Template
  onEdit: (template: Template) => void
  onDuplicate: (template: Template) => void
  onTogglePin: (template: Template) => void
  onDelete: (template: Template) => void
}

export function TemplateTile ({
  template,
  onEdit,
  onDuplicate,
  onTogglePin,
  onDelete
}: TemplateTileProps) {
  const { t, i18n } = useTranslation('common')

  return (
    <div className='group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-4 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-200 overflow-hidden h-[88px] w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] lg:max-w-[400px]'>
      {/* Subtle background pattern */}
      <div className='absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-primary/1 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />

      <div className='absolute top-3 right-3 z-20 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity duration-200'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 w-7 p-0'
              aria-label={t('templates.actions', { name: template.name })}
            >
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => onEdit(template)}>
              <Pencil className='h-4 w-4 mr-2' />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(template)}>
              <Copy className='h-4 w-4 mr-2' />
              {t('templates.duplicate')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTogglePin(template)}>
              {template.is_pinned ? (
                <PinOff className='h-4 w-4 mr-2' />
              ) : (
                <Pin className='h-4 w-4 mr-2' />
              )}
              {template.is_pinned ? t('templates.unpin') : t('templates.pin')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(template)}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='h-4 w-4 mr-2' />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='relative z-10 pr-8 flex flex-col justify-center h-full gap-2'>
        {/* The whole tile is the link; the menu sits above it */}
        <Link
          href={`/template/${template.id}`}
          className='font-semibold text-foreground text-base text-left truncate group-hover:text-primary transition-colors duration-200 after:absolute after:inset-0 after:-m-4 focus-visible:outline-none'
        >
          {template.is_pinned && (
            <Pin
              className='inline h-3.5 w-3.5 mr-1.5 -mt-0.5 text-primary'
              aria-label={t('templates.pinned')}
            />
          )}
          {template.name}
        </Link>

        <div className='flex items-center gap-3 text-sm text-muted-foreground min-w-0'>
          <span className='flex items-center gap-1.5 shrink-0'>
            <Calendar className='h-3.5 w-3.5' />
            <span className='font-medium'>
              {new Date(template.created_at).toLocaleDateString(
                i18n.language === 'ua' ? 'uk-UA' : 'en-US',
                { month: 'short', day: 'numeric' }
              )}
            </span>
          </span>
          <span className='truncate' aria-hidden>
            {template.blocks
              .map(block => getTranslatedComponentMetadata(block.componentId, t)?.icon)
              .join(' ')}
          </span>
          <span className='sr-only'>
            {template.blocks
              .map(block => getTranslatedComponentMetadata(block.componentId, t)?.name)
              .join(', ')}
          </span>
        </div>
      </div>
    </div>
  )
}
