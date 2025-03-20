"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { supabase } from "@/lib/supabase/client"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { walletService } from "@/lib/services/wallet"

// Updated chartConfig to include expenses and income
const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "hsl(341 90% 62%)", // Deep red
  },
  income: {
    label: "Income",
    color: "hsl(151 75% 48%)", // Bright green
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
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [currency, setCurrency] = React.useState('$');

  // Add functions to handle month navigation
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Fetch transaction data from Supabase
  React.useEffect(() => {
    async function fetchTransactionData() {
      try {
        setLoading(true);
        
        // Use currentDate instead of new Date()
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch transactions from Supabase with date range
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth)
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        console.log(transactions)
        const processedData = processTransactions(transactions as Transaction[]);
        setChartData(processedData);
      } catch (error) {
        console.error('Failed to fetch transaction data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactionData();
  }, [currentDate]); // Add currentDate as dependency

  // Add wallet fetch in useEffect
  React.useEffect(() => {
    async function fetchWallet() {
      try {
        const data = await walletService.getAll();
        // Get primary wallet or first wallet's currency
        const primaryWallet = data.find(w => w.is_primary) || data[0];
        if (primaryWallet) {
          setCurrency(primaryWallet.currency);
        }
      } catch (error) {
        console.error('Failed to load wallet currency:', error);
      }
    }

    fetchWallet();
  }, []);

  // Process transactions into chart data
  const processTransactions = (transactions: Transaction[]) => {
    // Group transactions by date
    const groupedByDate = transactions
      .reduce((acc: Record<string, { expenses: number, income: number }>, transaction: Transaction) => {
        const date = transaction.date.split('T')[0];
        
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

  // Update the total calculation to filter out deleted transactions
  const total = React.useMemo(
    () => chartData.reduce((acc, curr) => acc + curr[activeChart], 0),
    [chartData, activeChart]
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

  // Then modify the CardHeaderContent to include the total
  const CardHeaderContent = () => (
    <div className="flex justify-between items-center w-full">
      <Tabs
        value={activeChart}
        onValueChange={(value) => setActiveChart(value as "expenses" | "income")}
        className="w-fit"
      >
        <TabsList className="grid w-[200px] grid-cols-2">
          <TabsTrigger value="expenses" className="text-xs">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="income" className="text-xs">
            Income
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <span style={{ color: chartConfig[activeChart].color }} className="text-sm">
            Total: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency === '$' ? 'USD' : currency
            }).format(total)}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardHeaderContent />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p>Loading transaction data...</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardHeaderContent />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <p>No transaction data available for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardHeaderContent />
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
              minTickGap={0}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.getDate().toString().padStart(2, '0');
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
                const formattedValue = new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value as number);
                
                return [formattedValue, name === 'expenses' ? 'Expenses' : 'Income'];
              }}
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  weekday: 'short',
                  month: "long",
                  day: "numeric",
                });
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              cursor={{ stroke: 'hsl(var(--muted))' }}
              wrapperStyle={{ outline: 'none' }}
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
