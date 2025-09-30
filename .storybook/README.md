# Storybook Setup for MoneyMap

This project uses Storybook 9.1.9 with the latest best practices for 2025.

## 🚀 Quick Start

```bash
# Start Storybook in development mode
npm run storybook

# Build Storybook for production
npm run build-storybook

# Build Storybook for CI (quiet mode)
npm run storybook:ci
```

## 📁 Project Structure

```
.storybook/
├── main.ts          # Main Storybook configuration
├── preview.ts       # Global decorators and parameters
├── manager.ts       # Storybook UI configuration
├── theme.ts         # Custom theme configuration
└── README.md        # This file

src/components/ui/
├── button.tsx
├── button.stories.tsx
├── card.tsx
├── card.stories.tsx
└── ...
```

## 🎨 Features

### ✅ What's Included

- **Hot Reload**: Changes in components automatically reflect in Storybook
- **TypeScript Support**: Full TypeScript integration with proper type checking
- **Tailwind CSS**: Complete Tailwind CSS support with your custom theme
- **Accessibility Testing**: Built-in a11y addon for accessibility checks
- **Responsive Design**: Viewport addon for testing different screen sizes
- **Interactive Controls**: Live editing of component props
- **Documentation**: Auto-generated docs from your stories
- **Dark/Light Theme**: Theme switcher in the toolbar

### 🔧 Addons

- `@storybook/addon-essentials` - Core addons (controls, actions, viewport, docs)
- `@storybook/addon-interactions` - Testing interactions
- `@storybook/addon-a11y` - Accessibility testing
- `@storybook/addon-viewport` - Responsive design testing
- `@storybook/addon-controls` - Live prop editing
- `@storybook/addon-actions` - Action logging
- `@storybook/addon-docs` - Documentation generation

## 📝 Creating Stories

### Basic Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}
```

### Story Best Practices

1. **Use descriptive titles**: `UI/Button` instead of just `Button`
2. **Include argTypes**: Document all props with proper controls
3. **Add parameters**: Use layout, docs, and other parameters
4. **Create multiple variants**: Show different states and use cases
5. **Use tags**: Add `['autodocs']` for auto-generated documentation

## 🎯 Component Organization

### Story Categories

- **UI**: Basic UI components (Button, Input, Card, etc.)
- **Layout**: Layout components (Sidebar, Header, etc.)
- **Forms**: Form-related components
- **Charts**: Data visualization components
- **Pages**: Full page components

### Naming Convention

- Component files: `ComponentName.tsx`
- Story files: `ComponentName.stories.tsx`
- Story titles: `Category/ComponentName`

## 🔄 Hot Reload Setup

The setup includes automatic hot reload for both:

1. **Component Changes**: When you modify a component, Storybook updates instantly
2. **Story Changes**: When you modify a story, it updates without page refresh
3. **Style Changes**: Tailwind CSS changes are reflected immediately

## 🎨 Theming

### Custom Theme

The project includes a custom Storybook theme that matches your app's design system:

- Brand colors from your Tailwind config
- Custom typography (Inter font)
- Consistent spacing and borders
- Light/dark mode support

### Theme Switching

Use the theme switcher in the toolbar to test components in both light and dark modes.

## 📱 Responsive Testing

### Viewport Presets

- **Mobile**: 375px × 667px
- **Tablet**: 768px × 1024px
- **Desktop**: 1024px × 768px

### Custom Viewports

Add custom viewports in `.storybook/preview.ts`:

```typescript
viewport: {
  viewports: {
    custom: {
      name: 'Custom',
      styles: {
        width: '1200px',
        height: '800px',
      },
    },
  },
},
```

## 🧪 Testing

### Accessibility Testing

The a11y addon automatically checks for:
- Color contrast issues
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes

### Interaction Testing

Use the interactions addon to test user interactions:

```typescript
export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    await userEvent.click(button)
  },
}
```

## 🚀 Deployment

### Static Build

```bash
npm run build-storybook
```

This creates a `storybook-static` folder that can be deployed to any static hosting service.

### CI Integration

```bash
npm run storybook:ci
```

Use this command in CI/CD pipelines for automated testing and deployment.

## 🔧 Configuration Files

### main.ts
- Story discovery patterns
- Addon configuration
- Framework settings
- TypeScript configuration

### preview.ts
- Global decorators
- Parameters
- Backgrounds
- Viewport settings

### manager.ts
- UI configuration
- Theme settings
- Toolbar configuration

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Next.js Integration](https://storybook.js.org/docs/nextjs/get-started/introduction)
- [TypeScript Guide](https://storybook.js.org/docs/typescript/get-started/introduction)
- [Tailwind CSS Integration](https://storybook.js.org/docs/nextjs/get-started/introduction#tailwind-css)

## 🤝 Contributing

When adding new components:

1. Create the component in `src/components/ui/`
2. Create a corresponding `.stories.tsx` file
3. Follow the established naming conventions
4. Include comprehensive argTypes
5. Add multiple story variants
6. Test in different viewports and themes

## 🐛 Troubleshooting

### Common Issues

1. **Tailwind styles not loading**: Ensure `globals.css` is imported in `preview.ts`
2. **TypeScript errors**: Check `tsconfig.json` includes Storybook files
3. **Hot reload not working**: Restart the Storybook dev server
4. **Stories not appearing**: Check the story file naming and location

### Getting Help

- Check the [Storybook Discord](https://discord.gg/storybook)
- Review the [GitHub Issues](https://github.com/storybookjs/storybook/issues)
- Consult the [Documentation](https://storybook.js.org/docs)
