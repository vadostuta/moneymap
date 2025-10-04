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

### 🔐 User Authentication
- Google OAuth integration for secure login
- User session management
- Protected routes and data privacy

### 🌐 Internationalization
- Multi-language support (English, Ukrainian)
- Dynamic language switching
- Localized content and UI elements

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
- **Start Page** (`/start`) - Welcome page with login prompt and wallet setup
- **Overview** (`/overview`) - Main dashboard with financial summary
- **Transactions** (`/transactions`) - Transaction list and management
- **Wallets** (`/wallets`) - Wallet creation and management
- **Analytics** (`/analytics`) - Spending analysis and charts
- **Settings** (`/settings`) - User preferences and account management

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

## Usage Patterns

### For Users
1. **Initial Setup**: Sign in with Google → Create first wallet → Start tracking transactions
2. **Daily Usage**: Add transactions → View overview → Analyze spending patterns
3. **Financial Planning**: Use analytics to understand spending habits and make informed decisions

### For Developers
1. **Adding Features**: Follow the established patterns for contexts, components, and pages
2. **Data Management**: Use the service layer in `lib/services/` for API calls
3. **UI Components**: Extend the shadcn/ui component library for consistent design
4. **Internationalization**: Add new strings to locale files in `lib/locales/`

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
- `/start` is the main landing page with authentication
- Authenticated users see dashboard, unauthenticated users see login prompt
- Sidebar provides navigation to all major sections

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