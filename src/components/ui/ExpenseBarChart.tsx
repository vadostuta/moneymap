'use client'

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { transactionService } from "@/lib/services/transaction"
import { walletService } from "@/lib/services/wallet"
import { assignSeriesColors } from "@/lib/chart-colors"
import {
  Card,
  CardContent,
  CardDescription,
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

  // Each wallet keeps its colour however the bars are ordered
  const walletColors = assignSeriesColors(
    [...(transactions ?? [])]
      .sort((a, b) => b.expenses - a.expenses)
      .map(entry => entry.wallet)
  )

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
          <CardTitle>Current month expenses by wallet</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[80px]">
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
              tickMargin={0}
              axisLine={false}
              height={10}
              width={100}
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
            <Bar dataKey="expenses" radius={5} barSize={24}>
              {transactions.map(entry => (
                <Cell key={entry.wallet} fill={walletColors.get(entry.wallet)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
