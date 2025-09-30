import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RecentTransactions } from './RecentTransactions'

const meta: Meta<typeof RecentTransactions> = {
  title: 'Overview/RecentTransactions',
  component: RecentTransactions,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A component that displays a list of recent transactions with filtering and pagination capabilities.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    selectedCategory: {
      control: { type: 'text' },
      description: 'Currently selected category for filtering'
    },
    onResetCategory: {
      action: 'resetCategory',
      description: 'Callback to reset category filter'
    },
    selectedWalletId: {
      control: { type: 'text' },
      description: 'ID of the selected wallet'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    selectedCategory: undefined,
    onResetCategory: () => {},
    selectedWalletId: '1'
  }
}

export const WithCategoryFilter: Story = {
  args: {
    selectedCategory: '1',
    onResetCategory: () => {},
    selectedWalletId: '1'
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows transactions filtered by a specific category with reset button'
      }
    }
  }
}