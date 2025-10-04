'use client'

import { Template } from '@/types/template'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getComponentById } from '@/lib/template-registry'
import { getLayoutById } from '@/lib/layout-registry'
import { Calendar, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface TemplateCardProps {
  template: Template
  onDelete?: (templateId: string) => void
  onEdit?: (template: Template) => void
}

export function TemplateCard ({
  template,
  onDelete,
  onEdit
}: TemplateCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-lg'>{template.name}</CardTitle>
            <CardDescription className='flex items-center gap-1 text-sm'>
              <Calendar className='h-3 w-3' />
              Created {formatDate(template.createdAt)}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  Edit Template
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(template.id)}
                  className='text-destructive focus:text-destructive'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Components ({template.blocks.length})
            </p>
            <Badge variant='secondary' className='text-xs'>
              {getLayoutById(template.layout)?.name || 'Custom'} Layout
            </Badge>
          </div>
          <div className='flex flex-wrap gap-1'>
            {template.blocks.map(block => {
              const component = getComponentById(block.componentId)
              return (
                <Badge key={block.id} variant='outline' className='text-xs'>
                  {component?.icon} {component?.name}
                </Badge>
              )
            })}
          </div>

          {template.blocks.length === 0 && (
            <p className='text-sm text-muted-foreground italic'>
              No components selected
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
