import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Download, Heart, Settings } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component with multiple variants and sizes.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link'
      ],
      description: 'The visual style variant of the button'
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button'
    },
    asChild: {
      control: { type: 'boolean' },
      description:
        'Change the default rendered element for the one passed as a child'
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button'
  }
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary'
  }
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive'
  }
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline'
  }
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost'
  }
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link'
  }
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small'
  }
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large'
  }
}

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <Settings className='h-4 w-4' />
  }
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Download className='mr-2 h-4 w-4' />
        Download
      </>
    )
  }
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled'
  }
}

export const AllVariants: Story = {
  render: () => (
    <div className='flex flex-wrap gap-4'>
      <Button variant='default'>Default</Button>
      <Button variant='secondary'>Secondary</Button>
      <Button variant='destructive'>Destructive</Button>
      <Button variant='outline'>Outline</Button>
      <Button variant='ghost'>Ghost</Button>
      <Button variant='link'>Link</Button>
    </div>
  )
}

export const AllSizes: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <Button size='sm'>Small</Button>
      <Button size='default'>Default</Button>
      <Button size='lg'>Large</Button>
      <Button size='icon'>
        <Heart className='h-4 w-4' />
      </Button>
    </div>
  )
}

export const Interactive: Story = {
  args: {
    children: 'Click me',
    onClick: () => alert('Button clicked!')
  }
}
