import type { Meta, StoryObj } from '@storybook/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from './card'
import { Button } from './button'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible card component with header, content, and footer sections.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  )
}

export const WithActions: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className='grid w-full items-center gap-4'>
            <div className='flex flex-col space-y-1.5'>
              <label htmlFor='name'>Name</label>
              <input
                id='name'
                placeholder='Name of your project'
                className='px-3 py-2 border border-gray-300 rounded-md'
              />
            </div>
            <div className='flex flex-col space-y-1.5'>
              <label htmlFor='framework'>Framework</label>
              <select
                id='framework'
                className='px-3 py-2 border border-gray-300 rounded-md'
              >
                <option value=''>Select</option>
                <option value='next'>Next.js</option>
                <option value='sveltekit'>SvelteKit</option>
                <option value='astro'>Astro</option>
                <option value='nuxt'>Nuxt.js</option>
              </select>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className='flex justify-between'>
        <Button variant='outline'>Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  )
}

export const Notification: Story = {
  render: () => (
    <Card className='w-[380px]'>
      <CardHeader className='pb-3'>
        <CardTitle>Your Order</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-1'>
        <div className='flex items-center -mx-2 space-x-4 rounded-md p-2 hover:bg-accent'>
          <div className='space-y-1'>
            <p className='text-sm font-medium leading-none'>
              Your order has been confirmed
            </p>
            <p className='text-sm text-muted-foreground'>
              We&apos;ll send you a shipping confirmation when your item ships.
            </p>
          </div>
        </div>
        <div className='flex items-center -mx-2 space-x-4 rounded-md p-2 hover:bg-accent'>
          <div className='space-y-1'>
            <p className='text-sm font-medium leading-none'>
              Payment successful
            </p>
            <p className='text-sm text-muted-foreground'>
              Your payment has been processed successfully.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className='w-full'>
          <span>Mark all as read</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

export const Stats: Story = {
  render: () => (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'
          >
            <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>$45,231.89</div>
          <p className='text-xs text-muted-foreground'>
            +20.1% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Subscriptions</CardTitle>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'
          >
            <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
            <circle cx='9' cy='7' r='4' />
            <path d='m22 21-3-3m0 0a2 2 0 1 0-2.828-2.828A2 2 0 0 0 19 18Z' />
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>+2350</div>
          <p className='text-xs text-muted-foreground'>
            +180.1% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export const OnlyContent: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardContent className='pt-6'>
        <p>This is a card with only content, no header or footer.</p>
      </CardContent>
    </Card>
  )
}

export const OnlyHeader: Story = {
  render: () => (
    <Card className='w-[350px]'>
      <CardHeader>
        <CardTitle>Card with only header</CardTitle>
        <CardDescription>This card has no content or footer.</CardDescription>
      </CardHeader>
    </Card>
  )
}
