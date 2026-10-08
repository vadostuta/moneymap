'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

interface DatePickerProps {
  date?: Date
  onSelect?: (date?: Date) => void
  placeholder?: string
  className?: string
}

export function DatePicker ({
  date,
  onSelect,
  placeholder = 'Pick a date',
  className
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant={'outline'}
          className={cn(
            'w-[240px] justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          <span className='truncate'>
            {date ? format(date, 'PPP') : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
