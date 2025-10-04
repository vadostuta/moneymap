import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'transparent' | 'monochrome'
}

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 60,
  xl: 80
}

export function Logo ({
  size = 'md',
  className,
  variant = 'default'
}: LogoProps) {
  const sizeValue = sizeMap[size]

  if (variant === 'transparent') {
    return (
      <svg
        width={sizeValue}
        height={sizeValue}
        viewBox='0 0 200 200'
        xmlns='http://www.w3.org/2000/svg'
        className={cn('text-primary', className)}
      >
        {/* Pie Chart Segments with transparency */}
        <circle cx='100' cy='100' r='70' fill='currentColor' opacity='0.1' />
        <path
          d='M100,30 A70,70 0 0,1 170,100 L140,100 A40,40 0 0,0 100,60 Z'
          fill='#57C6E1'
          opacity='0.8'
        />
        <path
          d='M170,100 A70,70 0 0,1 100,170 L100,140 A40,40 0 0,0 140,100 Z'
          fill='#4DA3FF'
          opacity='0.8'
        />
        <path
          d='M100,170 A70,70 0 0,1 30,100 L60,100 A40,40 0 0,0 100,140 Z'
          fill='#FF6B6B'
          opacity='0.8'
        />
        <path
          d='M30,100 A70,70 0 0,1 100,30 L100,60 A40,40 0 0,0 60,100 Z'
          fill='#FFD93D'
          opacity='0.8'
        />
        {/* Inner Circle - transparent */}
        <circle cx='100' cy='100' r='40' fill='transparent' />
      </svg>
    )
  }

  if (variant === 'monochrome') {
    return (
      <svg
        width={sizeValue}
        height={sizeValue}
        viewBox='0 0 200 200'
        xmlns='http://www.w3.org/2000/svg'
        className={cn('text-foreground', className)}
      >
        {/* Pie Chart Segments - monochrome using currentColor */}
        <circle cx='100' cy='100' r='70' fill='currentColor' />
        <path
          d='M100,30 A70,70 0 0,1 170,100 L140,100 A40,40 0 0,0 100,60 Z'
          fill='currentColor'
          opacity='0.8'
        />
        <path
          d='M170,100 A70,70 0 0,1 100,170 L100,140 A40,40 0 0,0 140,100 Z'
          fill='currentColor'
          opacity='0.6'
        />
        <path
          d='M100,170 A70,70 0 0,1 30,100 L60,100 A40,40 0 0,0 100,140 Z'
          fill='currentColor'
          opacity='0.4'
        />
        <path
          d='M30,100 A70,70 0 0,1 100,30 L100,60 A40,40 0 0,0 60,100 Z'
          fill='currentColor'
          opacity='0.2'
        />
        {/* Inner Circle - theme-aware background */}
        <circle cx='100' cy='100' r='40' fill='hsl(var(--background))' />
      </svg>
    )
  }

  return (
    <svg
      width={sizeValue}
      height={sizeValue}
      viewBox='0 0 200 200'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('text-primary', className)}
    >
      {/* Pie Chart Segments */}
      <circle cx='100' cy='100' r='70' fill='currentColor' />
      <path
        d='M100,30 A70,70 0 0,1 170,100 L140,100 A40,40 0 0,0 100,60 Z'
        fill='#57C6E1'
      />
      <path
        d='M170,100 A70,70 0 0,1 100,170 L100,140 A40,40 0 0,0 140,100 Z'
        fill='#4DA3FF'
      />
      <path
        d='M100,170 A70,70 0 0,1 30,100 L60,100 A40,40 0 0,0 100,140 Z'
        fill='#FF6B6B'
      />
      <path
        d='M30,100 A70,70 0 0,1 100,30 L100,60 A40,40 0 0,0 60,100 Z'
        fill='#FFD93D'
      />
      {/* Inner Circle - theme-aware background */}
      <circle cx='100' cy='100' r='40' fill='hsl(var(--background))' />
    </svg>
  )
}
