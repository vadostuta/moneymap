"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"

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
} from "@/components/ui/chart"

// Updated chartConfig to include expenses and income
const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-1))",
  },
  income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

// Interface for transaction data
interface TransactionData {
  date: string
  expenses: number
  income: number
}

// Interface for transaction
interface Transaction {
  date: string
  type: string
  amount: number
}

// Add this new interface for the component props
interface RevenueCardProps {
  onDateSelect?: (date: string | null) => void;
}

export function RevenueCard({ onDateSelect }: RevenueCardProps) {
  const [chartData, setChartData] = React.useState<TransactionData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeChart, setActiveChart] = React.useState<"expenses" | "income">("expenses");
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // Fetch transaction data from Supabase
  React.useEffect(() => {
    async function fetchTransactionData() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch transactions from Supabase
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        // Process transactions into chart data format
        const processedData = processTransactions(transactions as Transaction[]);
        setChartData(processedData);
      } catch (error) {
        console.error('Failed to fetch transaction data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactionData();
  }, []);

  // Process transactions into chart data
  const processTransactions = (transactions: Transaction[]) => {
    // Group transactions by date
    const groupedByDate = transactions.reduce((acc: Record<string, { expenses: number, income: number }>, transaction: Transaction) => {
      const date = transaction.date.split('T')[0]; // Get YYYY-MM-DD format
      
      if (!acc[date]) {
        acc[date] = {
          expenses: 0,
          income: 0
        };
      }
      
      // Add to appropriate category based on transaction type
      if (transaction.type === 'expense') {
        acc[date].expenses += transaction.amount;
      } else if (transaction.type === 'income') {
        acc[date].income += transaction.amount;
      }
      
      return acc;
    }, {});

    // Convert to array format for chart
    return Object.keys(groupedByDate).map(date => ({
      date,
      expenses: groupedByDate[date].expenses,
      income: groupedByDate[date].income
    }));
  };

  const total = React.useMemo(
    () => ({
      expenses: chartData.reduce((acc, curr) => acc + curr.expenses, 0),
      income: chartData.reduce((acc, curr) => acc + curr.income, 0),
    }),
    [chartData]
  );

  // Add this function to handle bar click
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedDate = data.activePayload[0].payload.date;
      
      // If clicking the same date, toggle selection off
      if (selectedDate === clickedDate) {
        setSelectedDate(null);
        if (onDateSelect) {
          onDateSelect(null);
        }
      } else {
        setSelectedDate(clickedDate);
        if (onDateSelect) {
          onDateSelect(clickedDate);
        }
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p>Loading transaction data...</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p>No transaction data available. Add some transactions to see your chart.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>
            Your income and expenses
          </CardDescription>
        </div>
        <div className="flex">
          {(["expenses", "income"] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-xs text-muted-foreground">
                {chartConfig[key].label}
              </span>
              <span className="text-lg font-bold leading-none sm:text-3xl">
                {total[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
            onClick={handleBarClick}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <ChartTooltip 
              formatter={(value, name) => {
                return [value.toLocaleString(), chartConfig[name as keyof typeof chartConfig]?.label || name];
              }}
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid var(--chart-1)',
                backgroundColor: 'var(--chart-1)',
              }}
            />
            <Bar 
              dataKey={activeChart} 
              fill={`var(--color-${activeChart})`}
              style={{
                cursor: 'pointer',
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
