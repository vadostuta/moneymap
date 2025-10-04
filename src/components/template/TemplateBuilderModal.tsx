'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Template, TemplateComponentId, LayoutType } from '@/types/template'
import {
  getComponentsByCategory,
  getComponentById
} from '@/lib/template-registry'
import { getLayoutById, getPredefinedLayouts } from '@/lib/layout-registry'
import { LayoutPreviewVisual } from './LayoutPreviewVisual'
import Image from 'next/image'
import { templateService } from '@/lib/services/template'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

interface TemplateBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: Template) => void
}

// Sortable Item Component
function SortablePreviewItem ({
  componentId,
  index
}: {
  componentId: TemplateComponentId
  index: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: componentId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const component = getComponentById(componentId)

  return (
    <div ref={setNodeRef} style={style} className='relative group'>
      <div className='absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10'>
        {component?.name}
      </div>
      <div className='border border-border rounded-lg p-2 bg-background shadow-sm'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            {component?.icon && (
              <span className='text-sm'>{component.icon}</span>
            )}
            <span className='text-xs text-muted-foreground'>
              Position {index + 1}
            </span>
          </div>
          <div
            {...attributes}
            {...listeners}
            className='cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded'
          >
            <GripVertical className='h-4 w-4 text-muted-foreground' />
          </div>
        </div>
        <div className='relative w-full h-24 overflow-hidden rounded-md bg-muted/20 flex items-center justify-center'>
          {component?.previewImage ? (
            <Image
              src={component.previewImage}
              alt={component.name}
              fill
              className='object-contain'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            />
          ) : (
            <div className='text-center text-muted-foreground'>
              <div className='text-2xl mb-1'>{component?.icon}</div>
              <div className='text-xs'>{component?.name}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Layout Preview Component
function LayoutPreview ({
  layout,
  components
}: {
  layout: LayoutType
  components: TemplateComponentId[]
}) {
  const layoutDef = getLayoutById(layout)

  if (!layoutDef) return null

  // Special handling for side-by-side layout
  if (layout === '2-1-side') {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 h-80'>
        {/* Left side - 2 stacked blocks */}
        <div className='space-y-4'>
          {components.slice(0, 2).map((componentId, index) => (
            <div
              key={componentId || `empty-${index}`}
              className='h-[calc(50%-0.5rem)]'
            >
              {componentId ? (
                <SortablePreviewItem componentId={componentId} index={index} />
              ) : (
                <div className='border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 h-full flex items-center justify-center text-muted-foreground'>
                  <div className='text-center'>
                    <div className='text-2xl mb-1'>📦</div>
                    <div className='text-xs'>Empty slot</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Right side - 1 full height block */}
        <div>
          {components[2] ? (
            <SortablePreviewItem componentId={components[2]} index={2} />
          ) : (
            <div className='border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 h-full flex items-center justify-center text-muted-foreground'>
              <div className='text-center'>
                <div className='text-2xl mb-1'>📦</div>
                <div className='text-xs'>Empty slot</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Standard row-based layout
  return (
    <div className='space-y-3'>
      {layoutDef.structure.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`grid gap-3 ${
            row === 1
              ? 'grid-cols-1'
              : row === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {Array.from({ length: row }).map((_, blockIndex) => {
            const componentIndex =
              layoutDef.structure
                .slice(0, rowIndex)
                .reduce((acc, r) => acc + r, 0) + blockIndex

            const componentId = components[componentIndex]

            if (!componentId) {
              return (
                <div
                  key={`empty-${rowIndex}-${blockIndex}`}
                  className='border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 h-32 flex items-center justify-center text-muted-foreground'
                >
                  <div className='text-center'>
                    <div className='text-2xl mb-1'>📦</div>
                    <div className='text-xs'>Empty slot</div>
                  </div>
                </div>
              )
            }

            return (
              <SortablePreviewItem
                key={componentId}
                componentId={componentId}
                index={componentIndex}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function TemplateBuilderModal ({
  isOpen,
  onClose,
  onSave
}: TemplateBuilderModalProps) {
  const [templateName, setTemplateName] = useState('')
  const [selectedComponents, setSelectedComponents] = useState<
    TemplateComponentId[]
  >([])
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('2-1')

  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const componentCategories = getComponentsByCategory()
  const predefinedLayouts = getPredefinedLayouts()
  const currentLayout = getLayoutById(selectedLayout)

  const handleComponentToggle = (componentId: TemplateComponentId) => {
    setSelectedComponents(prev =>
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    )
  }

  const handleLayoutChange = (layoutId: LayoutType) => {
    setSelectedLayout(layoutId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setSelectedComponents(items => {
        const oldIndex = items.indexOf(active.id as TemplateComponentId)
        const newIndex = items.indexOf(over?.id as TemplateComponentId)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const createTemplateMutation = useMutation({
    mutationFn: templateService.create,
    onSuccess: newTemplate => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast({
        title: 'Template Created',
        description: `Template "${newTemplate?.name}" has been created successfully.`
      })
      onSave(newTemplate!)
      setTemplateName('')
      setSelectedComponents([])
      setSelectedLayout('2-1')
      onClose()
    },
    onError: error => {
      toast({
        title: 'Error',
        description: 'Failed to create template. Please try again.',
        variant: 'destructive'
      })
      console.error('Template creation failed:', error)
    }
  })

  const handleSave = () => {
    if (!templateName.trim() || selectedComponents.length === 0) {
      return
    }

    const templateData = {
      name: templateName.trim(),
      blocks: selectedComponents.map(componentId => ({
        id: crypto.randomUUID(),
        componentId
      })),
      layout: selectedLayout
    }

    createTemplateMutation.mutate(templateData)
  }

  const handleCancel = () => {
    setTemplateName('')
    setSelectedComponents([])
    setSelectedLayout('2-1')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Template Creation</DialogTitle>
          <DialogDescription>
            Create a new template by selecting components to include.
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Left Column - Configuration */}
          <div className='space-y-6'>
            {/* Template Name Input */}
            <div className='space-y-2'>
              <Label htmlFor='template-name'>Template Name</Label>
              <Input
                id='template-name'
                placeholder='Enter template name...'
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
              />
            </div>

            {/* Layout Selection */}
            <div className='space-y-2'>
              <Label className='text-sm'>Choose Layout</Label>
              <div className='grid grid-cols-3 sm:grid-cols-4 gap-1.5'>
                {predefinedLayouts.map(layout => (
                  <div
                    key={layout.id}
                    className={`cursor-pointer transition-all rounded-md border-2 p-2 ${
                      selectedLayout === layout.id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    onClick={() => handleLayoutChange(layout.id)}
                  >
                    <div className='space-y-1.5'>
                      <div className='flex items-center justify-between'>
                        <h4 className='text-xs font-medium truncate'>
                          {layout.name}
                        </h4>
                        <Badge
                          variant='outline'
                          className='text-xs px-1 py-0 h-3 text-[10px]'
                        >
                          {layout.totalBlocks}
                        </Badge>
                      </div>
                      <div className='flex justify-center'>
                        <LayoutPreviewVisual layout={layout} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Component Selection */}
            <div className='space-y-4'>
              <Label>Select Components</Label>
              <div className='space-y-4'>
                {componentCategories.map(({ category, components }) => (
                  <div key={category} className='space-y-2'>
                    <h4 className='text-sm font-medium text-muted-foreground'>
                      {category}
                    </h4>
                    <div className='grid gap-2'>
                      {components.map(component => (
                        <Card
                          key={component.id}
                          className={`cursor-pointer transition-colors ${
                            selectedComponents.includes(component.id)
                              ? 'ring-2 ring-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleComponentToggle(component.id)}
                        >
                          <CardContent className='p-4'>
                            <div className='flex items-start space-x-3'>
                              <Checkbox
                                checked={selectedComponents.includes(
                                  component.id
                                )}
                                onChange={() =>
                                  handleComponentToggle(component.id)
                                }
                                className='mt-1'
                              />
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center space-x-2'>
                                  {component.icon && (
                                    <span className='text-lg'>
                                      {component.icon}
                                    </span>
                                  )}
                                  <h5 className='text-sm font-medium'>
                                    {component.name}
                                  </h5>
                                </div>
                                <p className='text-xs text-muted-foreground mt-1'>
                                  {component.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Components Summary */}
            {selectedComponents.length > 0 && (
              <div className='space-y-2'>
                <Label>Selected Components ({selectedComponents.length})</Label>
                <div className='flex flex-wrap gap-2'>
                  {selectedComponents.map(componentId => {
                    const component = componentCategories
                      .flatMap(cat => cat.components)
                      .find(comp => comp.id === componentId)
                    return (
                      <Badge
                        key={componentId}
                        variant='secondary'
                        className='gap-1'
                      >
                        {component?.icon} {component?.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className='space-y-4'>
            <Label>Preview</Label>
            <div className='border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 min-h-[400px] bg-muted/20'>
              {selectedComponents.length === 0 ? (
                <div className='flex items-center justify-center h-full text-muted-foreground'>
                  <div className='text-center'>
                    <div className='text-4xl mb-2'>👀</div>
                    <p className='text-sm'>Select components to see preview</p>
                  </div>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='text-sm text-muted-foreground'>
                      Template:{' '}
                      <span className='font-medium'>
                        {templateName || 'Untitled'}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-muted-foreground'>
                        Layout:
                      </span>
                      <Badge variant='outline' className='text-xs'>
                        {currentLayout?.name || 'Custom'}
                      </Badge>
                    </div>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedComponents}
                      strategy={verticalListSortingStrategy}
                    >
                      <LayoutPreview
                        layout={selectedLayout}
                        components={selectedComponents}
                      />
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !templateName.trim() ||
              selectedComponents.length === 0 ||
              createTemplateMutation.isPending
            }
          >
            {createTemplateMutation.isPending ? 'Creating...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
