import { useEffect, useState } from 'react'
import { Button } from './button'
import { useTranslation } from 'react-i18next'

interface UndoDeleteToastProps {
  onUndo: () => void
  onClose: () => void
  duration?: number
}

export function UndoDeleteToast ({
  onUndo,
  onClose,
  duration = 5000
}: UndoDeleteToastProps) {
  const { t } = useTranslation('common')
  const [timeLeft, setTimeLeft] = useState(duration / 1000)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onClose])

  const handleUndo = () => {
    onUndo()
    onClose()
  }

  return (
    <div className='fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 z-50'>
      <div className='flex-1'>
        <p className='text-sm'>
          {t('transactions.deleted')} ({timeLeft}s)
        </p>
      </div>
      <Button
        variant='outline'
        size='sm'
        onClick={handleUndo}
        className='whitespace-nowrap'
      >
        {t('common.undo')}
      </Button>
    </div>
  )
}
