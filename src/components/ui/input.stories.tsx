import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { Label } from './label'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A styled input component with focus states and proper accessibility.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'The input type'
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text'
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled'
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
    placeholder: 'Enter text...'
  }
}

export const WithLabel: Story = {
  render: () => (
    <div className='grid w-full max-w-sm items-center gap-1.5'>
      <Label htmlFor='email'>Email</Label>
      <Input type='email' id='email' placeholder='Email' />
    </div>
  )
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password'
  }
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true
  }
}

export const WithValue: Story = {
  args: {
    defaultValue: 'Pre-filled value'
  }
}

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...'
  }
}

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter number'
  }
}

export const FormExample: Story = {
  render: () => (
    <div className='grid w-full max-w-sm items-center gap-4'>
      <div className='grid gap-2'>
        <Label htmlFor='first-name'>First name</Label>
        <Input id='first-name' placeholder='John' />
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='last-name'>Last name</Label>
        <Input id='last-name' placeholder='Doe' />
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' type='email' placeholder='john@example.com' />
      </div>
    </div>
  )
}

export const ErrorState: Story = {
  render: () => (
    <div className='grid w-full max-w-sm items-center gap-1.5'>
      <Label htmlFor='error-input'>Email</Label>
      <Input
        id='error-input'
        type='email'
        placeholder='Email'
        className='border-red-500 focus-visible:ring-red-500'
      />
      <p className='text-sm text-red-500'>Please enter a valid email address</p>
    </div>
  )
}
