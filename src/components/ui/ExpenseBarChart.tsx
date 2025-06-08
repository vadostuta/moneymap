'use client'

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { transactionService } from "@/lib/services/transaction"
import { walletService } from "@/lib/services/wallet"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Define a set of colors for the bars
const BAR_COLORS = [
  'hsl(341 90% 62% / 0.8)',  // Red with opacity
  'hsl(151 75% 48% / 0.8)',  // Green with opacity
  'hsl(217 91% 60% / 0.8)',  // Blue with opacity
  'hsl(280 91% 60% / 0.8)',  // Purple with opacity
  'hsl(45 93% 47% / 0.8)',   // Yellow with opacity
  'hsl(199 89% 48% / 0.8)',  // Cyan with opacity
]

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ExpenseBarChart() {
  // Fetch available wallets
  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletService.getAllActive()
  })

  // Fetch transaction data for all wallets
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['wallet-expenses'],
    queryFn: async () => {
      if (!wallets) return []

      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      // Fetch transactions for each wallet
      const walletExpenses = await Promise.all(
        wallets.map(async (wallet) => {
          const transactions = await transactionService.getMonthlyTransactions({
            walletId: wallet.id,
            startDate,
            endDate
          })

          const totalExpenses = transactions.reduce((sum, transaction) => {
            if (transaction.type === 'expense') {
              return sum + transaction.amount
            }
            return sum
          }, 0)

          return {
            wallet: wallet.name,
            expenses: totalExpenses,
            currency: wallet.currency
          }
        })
      )

      return walletExpenses.filter(wallet => wallet.expenses > 0)
    },
    enabled: !!wallets
  })

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Expenses</CardTitle>
          <CardDescription>Loading expense data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Expenses</CardTitle>
          <CardDescription>No expense data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Wallet Expenses</CardTitle>
          <CardDescription>Current month expenses by wallet</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            data={transactions}
            layout="vertical"
            margin={{
              left: -20,
            }}
          >
            <XAxis type="number" dataKey="expenses" hide />
            <YAxis
              dataKey="wallet"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => {
                    const currency = item.payload.currency
                    return formatCurrency(value as number, currency)
                  }}
                />
              }
            />
            <Bar dataKey="expenses" radius={5} fillOpacity={0.8}>
              {transactions.map((entry, index) => (
                <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
