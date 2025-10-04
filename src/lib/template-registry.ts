import { TemplateComponentId } from '@/types/template'

export interface ComponentMetadata {
  id: TemplateComponentId
  name: string
  description: string
  category: string
  icon?: string
  previewImage: string
}

export const COMPONENT_REGISTRY: Record<
  TemplateComponentId,
  ComponentMetadata
> = {
  expensePieChart: {
    id: 'expensePieChart',
    name: 'Expense Pie Chart',
    description: 'Visualize expense distribution by category',
    category: 'Charts',
    icon: '📊',
    previewImage: '/preview-images/expense_pie_chart.png'
  },
  recentTransactionsList: {
    id: 'recentTransactionsList',
    name: 'Recent Transactions',
    description: 'Display list of recent transactions',
    category: 'Lists',
    icon: '📋',
    previewImage: '/preview-images/recent_transactions.png'
  },
  monthlyExpenseBarChart: {
    id: 'monthlyExpenseBarChart',
    name: 'Monthly Expense Bar Chart',
    description: 'Show monthly expense trends over time',
    category: 'Charts',
    icon: '📈',
    previewImage: '/preview-images/monthly_expense_bar_chart.png'
  }
}

export const getComponentsByCategory = () => {
  const components = Object.values(COMPONENT_REGISTRY)
  const categories = [...new Set(components.map(c => c.category))]

  return categories.map(category => ({
    category,
    components: components.filter(c => c.category === category)
  }))
}

export const getComponentById = (
  id: TemplateComponentId
): ComponentMetadata | undefined => {
  return COMPONENT_REGISTRY[id]
}
