import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ExpensePieChart } from './ExpensePieChart'

const meta: Meta<typeof ExpensePieChart> = {
  title: 'Overview/ExpensePieChart',
  component: ExpensePieChart,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A pie chart component that displays expense, income, or net data by category with interactive features.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onCategorySelect: {
      action: 'categorySelected',
      description: 'Callback when a category is selected'
    },
    selectedCategory: {
      control: { type: 'text' },
      description: 'Currently selected category ID'
    },
    wallet: {
      control: { type: 'object' },
      description: 'Wallet object to display data for'
    },
    showWalletName: {
      control: { type: 'boolean' },
      description: 'Whether to show wallet name in header'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onCategorySelect: () => {},
    selectedCategory: undefined,
    showWalletName: false
  }
}

export const WithWalletName: Story = {
  args: {
    onCategorySelect: () => {},
    selectedCategory: undefined,
    wallet: {
      id: '1',
      name: 'Main Wallet',
      currency: 'UAH',
      balance: 10000,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'user-1'
    },
    showWalletName: true
  }
}

export const WithSelectedCategory: Story = {
  args: {
    onCategorySelect: () => {},
    selectedCategory: '1',
    showWalletName: false
  }
}

export const Interactive: Story = {
  args: {
    onCategorySelect: categoryId => {
      console.log('Category selected:', categoryId)
    },
    selectedCategory: undefined,
    showWalletName: true,
    wallet: {
      id: '1',
      name: 'Main Wallet',
      currency: 'UAH',
      balance: 10000,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_id: 'user-1'
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive version where clicking categories logs to console'
      }
    }
  }
}
