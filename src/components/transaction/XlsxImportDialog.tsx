'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { XlsxImportForm } from './XlsxImportForm'
import { useTranslation } from 'react-i18next'

interface XlsxImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function XlsxImportDialog ({
  open,
  onOpenChange
}: XlsxImportDialogProps) {
  const { t } = useTranslation('common')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('xlsxImport.title')}</DialogTitle>
        </DialogHeader>
        <XlsxImportForm
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
