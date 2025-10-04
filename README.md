# MoneyMap - Personal Finance Management App

## Overview

MoneyMap is a modern, full-stack personal finance management application built with Next.js 14, TypeScript, and Supabase. It helps users track their expenses, manage multiple wallets, analyze spending patterns, and gain insights into their financial habits.

## Key Features

### 🏦 Wallet Management
- Create and manage multiple wallets (cash, bank accounts, credit cards, etc.)
- Track balances across different financial accounts
- Wallet-specific transaction filtering and analysis

### 💰 Transaction Tracking
- Add transactions manually with categories, amounts, and descriptions
- Quick transaction form for fast expense entry
- Support for both income and expense transactions
- Transaction history with search and filtering capabilities

### 📊 Analytics & Insights
- Visual spending analysis with charts and graphs
- Category-based expense breakdowns
- Monthly trend analysis
- Expense vs income comparisons
- Interactive pie charts and bar charts for data visualization

### 🏦 Bank Integration
- **Monobank API Integration** - Connect your Monobank account for automatic transaction sync
- Real-time transaction synchronization with 1-minute cooldown
- Automatic category mapping using MCC (Merchant Category Codes)
- Secure API token storage and management
- Historical transaction import (last 30 days on setup)
- Duplicate transaction prevention
- Wallet-specific integration mapping

### 🔐 User Authentication
- Google OAuth integration for secure login
- User session management
- Protected routes and data privacy

### 🌐 Internationalization
- Multi-language support (English, Ukrainian)
- Dynamic language switching
- Localized content and UI elements

### 📋 Custom Templates
- Create personalized dashboard templates with drag-and-drop builder
- Choose from multiple layout options (2-1, 1-2, 1-1-1, 2-2, etc.)
- Select and arrange components (charts, transaction lists, etc.)
- Preview templates in real-time during creation
- Save and reuse custom dashboard layouts
- Template management with create, view, and delete operations

### 🎨 Modern UI/UX
- Responsive design for mobile and desktop
- Dark/light theme support
- Collapsible sidebar navigation
- Modern component library with shadcn/ui
- Keyboard shortcuts for power users

## Technical Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **React Query** - Server state management
- **React Hook Form** - Form handling
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data protection
- **Real-time subscriptions** - Live data updates
- **Bank Integration APIs** - Monobank API for transaction sync

### Authentication & Security
- **Supabase Auth** - User authentication
- **Google OAuth** - Social login
- **JWT tokens** - Secure session management
- **Privacy controls** - Data visibility toggles

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── start/             # Landing/welcome page
│   ├── overview/          # Dashboard with financial overview
│   ├── transactions/      # Transaction management
│   ├── wallets/           # Wallet management
│   ├── analytics/         # Spending analytics and charts
│   ├── settings/          # User settings and preferences
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── transaction/      # Transaction-specific components
│   ├── wallet/           # Wallet-specific components
│   └── layout/           # Layout components
├── contexts/             # React contexts for state management
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
│   ├── services/         # API service functions
│   ├── types/            # TypeScript type definitions
│   └── locales/          # Internationalization files
└── middleware.ts         # Next.js middleware
```

## Key Components

### Core Pages
- **Start Page** (`/start`) - Welcome page with login prompt, wallet setup, and template management
- **Overview** (`/overview`) - Main dashboard with financial summary
- **Transactions** (`/transactions`) - Transaction list and management
- **Wallets** (`/wallets`) - Wallet creation and management
- **Analytics** (`/analytics`) - Spending analysis and charts
- **Settings** (`/settings`) - User preferences, account management, and bank integrations
- **Template Viewer** (`/template/[id]`) - View and interact with custom dashboard templates

### Important Contexts
- **AuthContext** - User authentication state
- **WalletContext** - Wallet management and selection
- **LanguageContext** - Internationalization
- **PrivacyContext** - Data visibility controls
- **ThemeContext** - Dark/light mode

## Data Models

### Wallet
```typescript
interface Wallet {
  id: string
  name: string
  type: 'cash' | 'bank' | 'credit' | 'investment'
  balance: number
  currency: string
  user_id: string
  created_at: string
  updated_at: string
}
```

### Transaction
```typescript
interface Transaction {
  id: string
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  wallet_id: string
  user_id: string
  date: string
  created_at: string
}
```

### Template
```typescript
interface Template {
  id: string
  name: string
  blocks: TemplateBlock[]
  layout: LayoutType
  created_at: string
  user_id?: string
  is_deleted?: boolean
}

interface TemplateBlock {
  id: string
  componentId: TemplateComponentId
}

type TemplateComponentId = 
  | 'expensePieChart'
  | 'recentTransactionsList'
  | 'monthlyExpenseBarChart'

type LayoutType = 
  | '2-1' | '1-2' | '1-1-1' | '2-2' 
  | '1-2-1' | '3-1' | '1-3' | '2-1-side'
```

### Bank Integration
```typescript
interface BankIntegration {
  id: string
  user_id: string
  provider: 'monobank'
  api_token: string
  wallet_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_sync_at: string | null
}

interface MonobankTransaction {
  id: string
  time: number
  description: string
  mcc: number
  amount: number
  operationAmount: number
  currencyCode: number
  commissionRate: number
  cashbackAmount: number
  balance: number
}
```

## Usage Patterns

### For Users
1. **Initial Setup**: Sign in with Google → Create first wallet → Start tracking transactions
2. **Bank Integration**: Connect Monobank account → Automatic transaction sync → Review and categorize
3. **Daily Usage**: Add transactions manually or rely on bank sync → View overview → Analyze spending patterns
4. **Template Creation**: Create custom dashboard templates → Select components and layouts → Save for reuse
5. **Financial Planning**: Use analytics and custom templates to understand spending habits and make informed decisions

### For Developers
1. **Adding Features**: Follow the established patterns for contexts, components, and pages
2. **Data Management**: Use the service layer in `lib/services/` for API calls
3. **UI Components**: Extend the shadcn/ui component library for consistent design
4. **Template System**: Add new components to `lib/template-registry.ts` and layouts to `lib/layout-registry.ts`
5. **Bank Integrations**: Extend `MonobankService` class for new bank providers or enhance existing integration
6. **Internationalization**: Add new strings to locale files in `lib/locales/`

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**
   - Set up Supabase project
   - Run migrations for tables and RLS policies
   - Configure Google OAuth in Supabase

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Key Features for LLM Understanding

### Navigation Flow
- Root (`/`) redirects to `/start`
- `/start` is the main landing page with authentication and template management
- Authenticated users see dashboard and templates, unauthenticated users see login prompt
- Sidebar provides navigation to all major sections
- Templates can be viewed at `/template/[id]` for full-screen dashboard experience

### State Management
- React Context for global state (auth, wallets, language, theme)
- React Query for server state caching and synchronization
- Local state for component-specific data

### Data Flow
- User actions → Context updates → API calls → Database updates
- Real-time updates via Supabase subscriptions
- Optimistic updates for better UX

### Security
- Row Level Security (RLS) ensures users only see their own data
- JWT-based authentication with Supabase
- Protected routes with AuthGuard component

This app is designed to be a comprehensive personal finance tracker that scales from simple expense tracking to detailed financial analysis, with a focus on user experience and data privacy.