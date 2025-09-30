import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import OverviewClient from './OverviewClient'

const meta: Meta<typeof OverviewClient> = {
  title: 'Pages/Overview',
  component: OverviewClient,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The main overview page that displays expense charts and recent transactions for the selected wallet.'
      }
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default overview page with single wallet selected'
      }
    }
  }
}

export const AllWallets: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Overview page showing all wallets with transactions'
      }
    }
  }
}

export const EmptyState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Overview page when no transactions are found'
      }
    }
  }
}
