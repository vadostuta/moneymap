'use client'

import { Template } from '@/types/template'
import { TemplateViewer } from './TemplateViewer'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface TemplateViewModalProps {
  template: Template | null
  isOpen: boolean
  onClose: () => void
}

export function TemplateViewModal ({
  template,
  isOpen,
  onClose
}: TemplateViewModalProps) {
  if (!template) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-7xl max-h-[90vh] overflow-y-auto'>
        <div className='mt-4'>
          <TemplateViewer template={template} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
