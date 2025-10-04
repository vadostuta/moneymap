export type TemplateComponentId =
  | 'expensePieChart'
  | 'recentTransactionsList'
  | 'monthlyExpenseBarChart'

export interface TemplateBlock {
  id: string // uuid
  componentId: TemplateComponentId
  // future: props?: Record<string, unknown>;
}

export interface Template {
  id: string // uuid
  name: string
  blocks: TemplateBlock[]
  createdAt: string
}
