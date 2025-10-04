'use client'

import { LayoutDefinition } from '@/types/template'

interface LayoutPreviewVisualProps {
  layout: LayoutDefinition
  className?: string
}

export function LayoutPreviewVisual ({
  layout,
  className = ''
}: LayoutPreviewVisualProps) {
  // Special handling for side-by-side layout
  if (layout.id === '2-1-side') {
    return (
      <div className={`flex gap-0.5 h-8 ${className}`}>
        {/* Left side - 2 stacked blocks */}
        <div className='flex flex-col gap-0.5'>
          <div className='bg-primary/20 border border-primary/30 rounded-sm flex items-center justify-center text-primary text-xs font-mono w-6 h-3'>
            1
          </div>
          <div className='bg-primary/20 border border-primary/30 rounded-sm flex items-center justify-center text-primary text-xs font-mono w-6 h-3'>
            2
          </div>
        </div>
        {/* Right side - 1 full height block */}
        <div className='bg-primary/20 border border-primary/30 rounded-sm flex items-center justify-center text-primary text-xs font-mono w-6 h-8'>
          3
        </div>
      </div>
    )
  }

  // Standard row-based layout
  return (
    <div className={`space-y-1 ${className}`}>
      {layout.structure.map((blocks, rowIndex) => (
        <div key={rowIndex} className={`flex gap-0.5 justify-center`}>
          {Array.from({ length: blocks }).map((_, blockIndex) => (
            <div
              key={blockIndex}
              className={`bg-primary/20 border border-primary/30 rounded-sm flex items-center justify-center text-primary text-xs font-mono ${
                blocks === 1 ? 'w-12 h-6' : blocks === 2 ? 'w-6 h-6' : 'w-4 h-6'
              }`}
            >
              {blockIndex + 1}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
