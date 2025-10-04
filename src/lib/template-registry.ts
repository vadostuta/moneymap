import { TemplateComponentId } from '@/types/template'

export interface ComponentMetadata {
  id: TemplateComponentId
  name: string
  description: string
  category: string
  icon?: string
  previewImage: string
}

// Translation keys for components
export const getTranslatedComponentMetadata = (
  id: TemplateComponentId,
  t: (key: string) => string
): ComponentMetadata | undefined => {
  const baseComponent = COMPONENT_REGISTRY[id]
  if (!baseComponent) return undefined

  return {
    ...baseComponent,
    name: t(`components.${id}.name`),
    description: t(`components.${id}.description`),
    category: t(`components.${id}.category`)
  }
}

export const COMPONENT_REGISTRY: Record<
  TemplateComponentId,
  ComponentMetadata
> = {
  expensePieChart: {
    id: 'expensePieChart',
    name: 'Component expensePieChart', // Fallback - will be overridden by translation
    description: 'Chart component for expense visualization', // Fallback - will be overridden by translation
    category: 'Charts', // Fallback - will be overridden by translation
    icon: '📊',
    previewImage: '/preview-images/expense_pie_chart.png'
  },
  recentTransactionsList: {
    id: 'recentTransactionsList',
    name: 'Component recentTransactionsList', // Fallback - will be overridden by translation
    description: 'List component for recent transactions', // Fallback - will be overridden by translation
    category: 'Lists', // Fallback - will be overridden by translation
    icon: '📋',
    previewImage: '/preview-images/recent_transactions.png'
  },
  monthlyExpenseBarChart: {
    id: 'monthlyExpenseBarChart',
    name: 'Component monthlyExpenseBarChart', // Fallback - will be overridden by translation
    description: 'Chart component for monthly expense trends', // Fallback - will be overridden by translation
    category: 'Charts', // Fallback - will be overridden by translation
    icon: '📈',
    previewImage: '/preview-images/monthly_expense_bar_chart.png'
  }
}

export const getComponentsByCategory = (t?: (key: string) => string) => {
  const components = Object.values(COMPONENT_REGISTRY)
  const categories = [...new Set(components.map(c => c.category))]

  return categories.map(category => ({
    category: t ? t(`categories.${category}`) : category,
    components: t
      ? components
          .filter(c => c.category === category)
          .map(comp => getTranslatedComponentMetadata(comp.id, t)!)
      : components.filter(c => c.category === category)
  }))
}

export const getComponentById = (
  id: TemplateComponentId
): ComponentMetadata | undefined => {
  return COMPONENT_REGISTRY[id]
}
