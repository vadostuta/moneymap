import { LayoutDefinition, LayoutType } from '@/types/template'

// Translation keys for layouts
export const getTranslatedLayoutMetadata = (
  id: LayoutType,
  t: (key: string) => string
): LayoutDefinition | undefined => {
  const baseLayout = LAYOUT_REGISTRY[id]
  if (!baseLayout) return undefined

  return {
    ...baseLayout,
    name: t(`layouts.${id}.name`),
    description: t(`layouts.${id}.description`)
  }
}

export const LAYOUT_REGISTRY: Record<LayoutType, LayoutDefinition> = {
  '2-1': {
    id: '2-1',
    name: '2-1', // Fallback - will be overridden by translation
    description: 'Layout with 2 blocks in first row, 1 block in second row', // Fallback - will be overridden by translation
    rows: 2,
    totalBlocks: 3,
    structure: [2, 1],
    preview: '⬜⬜\n⬜⬜⬜'
  },
  '1-2': {
    id: '1-2',
    name: '1-2', // Fallback - will be overridden by translation
    description: 'Layout with 1 block in first row, 2 blocks in second row', // Fallback - will be overridden by translation
    rows: 2,
    totalBlocks: 3,
    structure: [1, 2],
    preview: '⬜⬜⬜\n⬜⬜'
  },
  '1-1-1': {
    id: '1-1-1',
    name: '1-1-1', // Fallback - will be overridden by translation
    description: 'Layout with three rows, one block each', // Fallback - will be overridden by translation
    rows: 3,
    totalBlocks: 3,
    structure: [1, 1, 1],
    preview: '⬜⬜⬜\n⬜⬜⬜\n⬜⬜⬜'
  },
  '2-2': {
    id: '2-2',
    name: '2-2', // Fallback - will be overridden by translation
    description: 'Layout with two rows, two blocks each', // Fallback - will be overridden by translation
    rows: 2,
    totalBlocks: 4,
    structure: [2, 2],
    preview: '⬜⬜\n⬜⬜'
  },
  '1-2-1': {
    id: '1-2-1',
    name: '1-2-1', // Fallback - will be overridden by translation
    description: 'Layout with 1 block, then 2 blocks, then 1 block', // Fallback - will be overridden by translation
    rows: 3,
    totalBlocks: 4,
    structure: [1, 2, 1],
    preview: '⬜⬜⬜\n⬜⬜\n⬜⬜⬜'
  },
  '3-1': {
    id: '3-1',
    name: '3-1', // Fallback - will be overridden by translation
    description: 'Layout with 3 blocks in first row, 1 block in second row', // Fallback - will be overridden by translation
    rows: 2,
    totalBlocks: 4,
    structure: [3, 1],
    preview: '⬜⬜⬜\n⬜⬜⬜'
  },
  '1-3': {
    id: '1-3',
    name: '1-3', // Fallback - will be overridden by translation
    description: 'Layout with 1 block in first row, 3 blocks in second row', // Fallback - will be overridden by translation
    rows: 2,
    totalBlocks: 4,
    structure: [1, 3],
    preview: '⬜⬜⬜\n⬜⬜⬜'
  },
  '2-1-side': {
    id: '2-1-side',
    name: '2-1', // Fallback - will be overridden by translation
    description:
      'Layout with 2 stacked blocks on left, 1 full-height block on right', // Fallback - will be overridden by translation
    rows: 1,
    totalBlocks: 3,
    structure: [2, 1],
    preview: '⬜⬜|⬜\n⬜⬜|⬜'
  }
}

export const getLayoutById = (id: LayoutType): LayoutDefinition | undefined => {
  return LAYOUT_REGISTRY[id]
}

export const getAllLayouts = (): LayoutDefinition[] => {
  return Object.values(LAYOUT_REGISTRY)
}

export const getPredefinedLayouts = (
  t?: (key: string) => string
): LayoutDefinition[] => {
  if (!t) return Object.values(LAYOUT_REGISTRY)

  return Object.keys(LAYOUT_REGISTRY).map(
    id =>
      getTranslatedLayoutMetadata(id as LayoutType, t) ||
      LAYOUT_REGISTRY[id as LayoutType]
  )
}
