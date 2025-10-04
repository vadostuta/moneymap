export type TemplateComponentId =
  | 'expensePieChart'
  | 'recentTransactionsList'
  | 'monthlyExpenseBarChart'

export interface TemplateBlock {
  id: string // uuid
  componentId: TemplateComponentId
  // future: props?: Record<string, unknown>;
}

export type LayoutType =
  | '2-1' // First row: 2 blocks, Second row: 1 full width block
  | '1-2' // First row: 1 full width block, Second row: 2 blocks
  | '1-1-1' // Three rows with one block each
  | '2-2' // Two rows with two blocks each
  | '1-2-1' // First row: 1 block, Second row: 2 blocks, Third row: 1 block
  | '3-1' // First row: 3 blocks, Second row: 1 full width block
  | '1-3' // First row: 1 full width block, Second row: 3 blocks

export interface LayoutDefinition {
  id: LayoutType
  name: string
  description: string
  rows: number
  totalBlocks: number
  structure: number[]
  preview: string
}

export interface Template {
  id: string // uuid
  name: string
  blocks: TemplateBlock[]
  layout: LayoutType
  created_at: string
  user_id?: string
  is_deleted?: boolean
}

export interface CreateTemplateDTO {
  name: string
  blocks: TemplateBlock[]
  layout: LayoutType
}
