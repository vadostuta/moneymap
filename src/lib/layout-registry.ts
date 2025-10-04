import { LayoutDefinition, LayoutType } from '@/types/template'

export const LAYOUT_REGISTRY: Record<LayoutType, LayoutDefinition> = {
  '2-1': {
    id: '2-1',
    name: 'Two + One',
    description: 'First row with 2 blocks, second row with 1 full-width block',
    rows: 2,
    totalBlocks: 3,
    structure: [2, 1],
    preview: '⬜⬜\n⬜⬜⬜'
  },
  '1-2': {
    id: '1-2',
    name: 'One + Two',
    description: 'First row with 1 full-width block, second row with 2 blocks',
    rows: 2,
    totalBlocks: 3,
    structure: [1, 2],
    preview: '⬜⬜⬜\n⬜⬜'
  },
  '1-1-1': {
    id: '1-1-1',
    name: 'Three Stacked',
    description: 'Three rows with one block each',
    rows: 3,
    totalBlocks: 3,
    structure: [1, 1, 1],
    preview: '⬜⬜⬜\n⬜⬜⬜\n⬜⬜⬜'
  },
  '2-2': {
    id: '2-2',
    name: 'Two by Two',
    description: 'Two rows with two blocks each',
    rows: 2,
    totalBlocks: 4,
    structure: [2, 2],
    preview: '⬜⬜\n⬜⬜'
  },
  '1-2-1': {
    id: '1-2-1',
    name: 'One + Two + One',
    description: 'First row: 1 block, Second row: 2 blocks, Third row: 1 block',
    rows: 3,
    totalBlocks: 4,
    structure: [1, 2, 1],
    preview: '⬜⬜⬜\n⬜⬜\n⬜⬜⬜'
  },
  '3-1': {
    id: '3-1',
    name: 'Three + One',
    description: 'First row with 3 blocks, second row with 1 full-width block',
    rows: 2,
    totalBlocks: 4,
    structure: [3, 1],
    preview: '⬜⬜⬜\n⬜⬜⬜'
  },
  '1-3': {
    id: '1-3',
    name: 'One + Three',
    description: 'First row with 1 full-width block, second row with 3 blocks',
    rows: 2,
    totalBlocks: 4,
    structure: [1, 3],
    preview: '⬜⬜⬜\n⬜⬜⬜'
  },
  '2-1-side': {
    id: '2-1-side',
    name: 'Two Left + One Right',
    description:
      'Left side with 2 stacked blocks, right side with 1 full-height block',
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

export const getPredefinedLayouts = (): LayoutDefinition[] => {
  return Object.values(LAYOUT_REGISTRY)
}
