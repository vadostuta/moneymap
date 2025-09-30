import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A small status descriptor for UI elements.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'outline', 'selected'],
      description: 'The visual style variant of the badge'
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the badge'
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge'
  }
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary'
  }
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline'
  }
}

export const Selected: Story = {
  args: {
    variant: 'selected',
    children: 'Selected'
  }
}

export const AllVariants: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge>Default</Badge>
      <Badge variant='secondary'>Secondary</Badge>
      <Badge variant='outline'>Outline</Badge>
      <Badge variant='selected'>Selected</Badge>
    </div>
  )
}

export const WithIcons: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge>
        <span className='mr-1'>✓</span>
        Success
      </Badge>
      <Badge variant='secondary'>
        <span className='mr-1'>⚠</span>
        Warning
      </Badge>
      <Badge variant='outline'>
        <span className='mr-1'>ℹ</span>
        Info
      </Badge>
      <Badge variant='selected'>
        <span className='mr-1'>★</span>
        Featured
      </Badge>
    </div>
  )
}

export const StatusBadges: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge variant='selected'>Active</Badge>
      <Badge variant='secondary'>Pending</Badge>
      <Badge variant='outline'>Inactive</Badge>
      <Badge>New</Badge>
    </div>
  )
}

export const CountBadges: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge>1</Badge>
      <Badge variant='secondary'>5</Badge>
      <Badge variant='outline'>12</Badge>
      <Badge variant='selected'>99+</Badge>
    </div>
  )
}

export const LongText: Story = {
  args: {
    children: 'This is a longer badge text'
  }
}

export const CustomColors: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge className='bg-blue-500 text-white hover:bg-blue-600'>Blue</Badge>
      <Badge className='bg-green-500 text-white hover:bg-green-600'>
        Green
      </Badge>
      <Badge className='bg-purple-500 text-white hover:bg-purple-600'>
        Purple
      </Badge>
      <Badge className='bg-orange-500 text-white hover:bg-orange-600'>
        Orange
      </Badge>
    </div>
  )
}
