import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RecentTransactionItem } from './RecentTransactionItem'

const meta: Meta<typeof RecentTransactionItem> = {
  title: 'Overview/RecentTransactionItem',
  component: RecentTransactionItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An individual transaction item component with interactive features for editing, deleting, and managing transactions.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    transaction: {
      control: { type: 'object' },
      description: 'Transaction object to display'
    },
    activeWalletId: {
      control: { type: 'text' },
      description: 'ID of the currently active wallet'
    },
    onDelete: {
      action: 'deleteTransaction',
      description: 'Callback when transaction is deleted'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    transaction: {
      id: '1',
      description: 'Grocery shopping at Supermarket',
      amount: 250.5,
      type: 'expense',
      category_id: '1',
      date: '2024-01-15T10:30:00Z',
      is_hidden: false,
      user_id: 'user-1',
      wallet_id: '1',
      label: 'Personal',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      wallet: {
        id: '1',
        name: 'Main Wallet',
        currency: 'UAH'
      }
    },
    activeWalletId: '1',
    onDelete: (id: string) => {
      console.log('Transaction deleted:', id)
    }
  }
}

export const IncomeTransaction: Story = {
  args: {
    transaction: {
      id: '2',
      description: 'Salary payment',
      amount: 5000.0,
      type: 'income',
      category_id: '6',
      date: '2024-01-14T09:00:00Z',
      is_hidden: false,
      user_id: 'user-1',
      wallet_id: '1',
      label: 'Personal',
      created_at: '2024-01-14T09:00:00Z',
      updated_at: '2024-01-14T09:00:00Z',
      wallet: {
        id: '1',
        name: 'Main Wallet',
        currency: 'UAH'
      }
    },
    activeWalletId: '1',
    onDelete: (id: string) => {
      console.log('Transaction deleted:', id)
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Income transaction with green color and up arrow'
      }
    }
  }
}
