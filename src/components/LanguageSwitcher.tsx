'use client'
import { useLanguage } from '@/contexts/language-context'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher () {
  const { currentLanguage, changeLanguage } = useLanguage()

  return (
    <div className='flex gap-2'>
      <Button
        variant={currentLanguage === 'en' ? 'default' : 'outline'}
        size='sm'
        onClick={() => changeLanguage('en')}
      >
        EN
      </Button>
      <Button
        variant={currentLanguage === 'ua' ? 'default' : 'outline'}
        size='sm'
        onClick={() => changeLanguage('ua')}
      >
        UA
      </Button>
    </div>
  )
}
