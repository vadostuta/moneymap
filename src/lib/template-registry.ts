import { TemplateComponentId } from '@/types/template'

export interface ComponentMetadata {
  id: TemplateComponentId
  name: string
  description: string
  category: string
  icon?: string
  previewImage?: string
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
    category: 'Spending',
    icon: '📊',
    previewImage: '/preview-images/expense_pie_chart.png'
  },
  recentTransactionsList: {
    id: 'recentTransactionsList',
    name: 'Component recentTransactionsList', // Fallback - will be overridden by translation
    description: 'List component for recent transactions', // Fallback - will be overridden by translation
    category: 'Spending',
    icon: '📋',
    previewImage: '/preview-images/recent_transactions.png'
  },
  monthlyExpenseBarChart: {
    id: 'monthlyExpenseBarChart',
    name: 'Component monthlyExpenseBarChart', // Fallback - will be overridden by translation
    description: 'Chart component for monthly expense trends', // Fallback - will be overridden by translation
    category: 'Spending',
    icon: '📈',
    previewImage: '/preview-images/monthly_expense_bar_chart.png'
  },
  monthSummary: {
    id: 'monthSummary',
    name: 'Month summary',
    description: 'Income, expenses, net and savings rate for the month',
    category: 'Spending',
    icon: '🧾'
  },
  netWorth: {
    id: 'netWorth',
    name: 'Net worth',
    description: 'Latest net worth and its trend across snapshots',
    category: 'Wealth',
    icon: '💰'
  },
  freeToSpend: {
    id: 'freeToSpend',
    name: 'Free to spend',
    description: 'Liquid money minus everything already claimed',
    category: 'Wealth',
    icon: '🪙'
  },
  goalsProgress: {
    id: 'goalsProgress',
    name: 'Goals',
    description: 'Progress towards each goal and whether it is on track',
    category: 'Wealth',
    icon: '🎯'
  },
  monthPlan: {
    id: 'monthPlan',
    name: 'Month plan',
    description: "Where the month's income is meant to go, and how it went",
    category: 'Plan',
    icon: '🗓️'
  },
  planHistory: {
    id: 'planHistory',
    name: 'Plan history',
    description: 'Planned against actual leftover, month by month',
    category: 'Plan',
    icon: '📉'
  }
}

// Widgets that follow the template's month picker
export const MONTH_AWARE_COMPONENTS: TemplateComponentId[] = [
  'expensePieChart',
  'recentTransactionsList',
  'monthlyExpenseBarChart',
  'monthSummary',
  'monthPlan'
]

export const getComponentsByCategory = (t?: (key: string) => string) => {
  const components = Object.values(COMPONENT_REGISTRY)
  const categories = [...new Set(components.map(c => c.category))]

  return categories.map(category => ({
    category: t ? t(`templates.groups.${category}`) : category,
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
