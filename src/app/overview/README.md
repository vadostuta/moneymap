# Overview Feature - Storybook Components

This directory contains the main overview feature components and their corresponding Storybook stories.

## 📁 Components

### 1. **OverviewClient** (`OverviewClient.tsx`)
The main overview page component that orchestrates the display of expense charts and recent transactions.

**Features:**
- Displays expense pie charts for selected wallet(s)
- Shows recent transactions list
- Handles wallet selection and filtering
- Responsive grid layout

**Storybook Stories:**
- `Default` - Single wallet view
- `AllWallets` - Multiple wallets view
- `EmptyState` - No transactions state
- `Loading` - Loading state
- `Error` - Error state

### 2. **ExpensePieChart** (`/components/ui/ExpensePieChart.tsx`)
Interactive pie chart component for displaying financial data by category.

**Features:**
- Three view modes: Net, Expense, Income
- Interactive category selection
- Responsive design
- Custom tooltips
- Category legend with colors

**Storybook Stories:**
- `Default` - Basic chart display
- `WithWalletName` - Chart with wallet name header
- `WithSelectedCategory` - Chart with pre-selected category
- `ExpenseView` - Expense-only data
- `IncomeView` - Income-only data
- `NetView` - Net data (income - expenses)
- `Interactive` - Interactive with console logging
- `Loading` - Loading state
- `Error` - Error state
- `EmptyData` - No data state

### 3. **RecentTransactions** (`/components/transaction/RecentTransactions.tsx`)
Transaction list component with filtering and pagination.

**Features:**
- Infinite scroll pagination
- Category filtering
- Loading and error states
- Reset filter functionality

**Storybook Stories:**
- `Default` - Basic transaction list
- `WithCategoryFilter` - Filtered by category
- `Loading` - Loading state
- `Error` - Error state
- `Empty` - No transactions state
- `WithPagination` - With load more button
- `Interactive` - Interactive with logging

### 4. **RecentTransactionItem** (`/components/transaction/RecentTransactionItem.tsx`)
Individual transaction item with interactive features.

**Features:**
- Category editing via dropdown
- Transaction type toggling
- Hide/unhide functionality
- Delete with undo
- Wallet navigation
- Responsive design

**Storybook Stories:**
- `Default` - Basic transaction item
- `IncomeTransaction` - Income transaction styling
- `HiddenTransaction` - Hidden transaction state
- `LongDescription` - Long description handling
- `DifferentWallet` - Different wallet styling
- `Interactive` - Interactive with logging
- `AllVariants` - All variants together

## 🎨 Design System Integration

All components follow the MoneyMap design system:

- **Colors**: Consistent with Tailwind CSS theme
- **Typography**: Inter font family
- **Spacing**: Consistent padding and margins
- **Icons**: Lucide React icons
- **Responsive**: Mobile-first design approach

## 🔧 Mock Data

The Storybook stories use comprehensive mock data including:

- **Wallets**: Multiple wallet configurations
- **Transactions**: Various transaction types and amounts
- **Categories**: Complete category list with icons and colors
- **Services**: Mocked API responses

## 📱 Responsive Design

All components are fully responsive:

- **Mobile**: Stacked layout, compact spacing
- **Tablet**: Balanced grid layout
- **Desktop**: Full grid with optimal spacing

## 🧪 Testing

Each component includes stories for:

- **Default state**: Normal operation
- **Loading state**: Data fetching
- **Error state**: Error handling
- **Empty state**: No data scenarios
- **Interactive state**: User interactions

## 🚀 Usage in Storybook

1. **Navigate to Overview section** in Storybook sidebar
2. **Select component** you want to explore
3. **Use Controls panel** to modify props
4. **Test interactions** with Actions panel
5. **View responsive behavior** with Viewport addon

## 🔄 Hot Reload

All components support hot reload:

- **Component changes** reflect immediately
- **Story updates** update without refresh
- **Style changes** apply instantly
- **Mock data changes** update stories

## 📚 Documentation

Each story includes:

- **Component description**
- **Props documentation**
- **Usage examples**
- **Interactive demos**
- **State variations**

## 🎯 Best Practices

When working with these components:

1. **Always test responsive behavior**
2. **Verify loading and error states**
3. **Test interactive features**
4. **Check accessibility compliance**
5. **Validate data handling**

## 🔗 Related Components

- **UI Components**: Button, Card, Input, Badge
- **Layout Components**: Sidebar, MobileNav
- **Chart Components**: ExpenseBarChart, RevenueCard
- **Transaction Components**: TransactionForm, QuickTransactionForm

## 📖 Storybook Navigation

```
Overview/
├── ExpensePieChart/
│   ├── Default
│   ├── WithWalletName
│   ├── WithSelectedCategory
│   ├── ExpenseView
│   ├── IncomeView
│   ├── NetView
│   ├── Interactive
│   ├── Loading
│   ├── Error
│   └── EmptyData
├── RecentTransactions/
│   ├── Default
│   ├── WithCategoryFilter
│   ├── Loading
│   ├── Error
│   ├── Empty
│   ├── WithPagination
│   └── Interactive
├── RecentTransactionItem/
│   ├── Default
│   ├── IncomeTransaction
│   ├── HiddenTransaction
│   ├── LongDescription
│   ├── DifferentWallet
│   ├── Interactive
│   └── AllVariants
└── OverviewClient/
    ├── Default
    ├── AllWallets
    ├── EmptyState
    ├── Loading
    └── Error
```

This comprehensive Storybook setup allows you to develop, test, and document all overview feature components in isolation while maintaining consistency with your design system.
