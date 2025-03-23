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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

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

// First, update the wallet interface to include currency
interface Wallet {
  id: string;
  name: string;
  currency: string;
}

// Add this new interface for the component props
interface RevenueCardProps {
  onDateSelect?: (date: string | null) => void;
  selectedWalletId: string | null;
  onWalletChange: (walletId: string) => void;
  refreshTrigger: number;
}

export function RevenueCard({ 
  onDateSelect, 
  selectedWalletId, 
  onWalletChange,
  refreshTrigger
}: RevenueCardProps) {
  const [chartData, setChartData] = React.useState<TransactionData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeChart, setActiveChart] = React.useState<"expenses" | "income">("expenses");
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [wallets, setWallets] = React.useState<Wallet[]>([]);
  const [selectedWalletCurrency, setSelectedWalletCurrency] = React.useState<string | null>(null);

  // Add functions to handle month navigation
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Add effect to set primary wallet as default
  React.useEffect(() => {
    async function setDefaultWallet() {
      try {
        const data = await walletService.getAll();
        const primaryWallet = data.find(w => w.is_primary) || data[0];
        if (primaryWallet && !selectedWalletId) {
          onWalletChange(primaryWallet.id);
          setSelectedWalletCurrency(primaryWallet.currency);
        }
      } catch (error) {
        console.error('Failed to set default wallet:', error);
      }
    }

    if (!selectedWalletId) {
      setDefaultWallet();
    }
  }, [selectedWalletId, onWalletChange]);

  // Fetch transaction data from Supabase
  React.useEffect(() => {
    async function fetchTransactionData() {
      try {
        setLoading(true);
        
        if (!selectedWalletId) return; // Don't fetch if no wallet selected

        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const query = supabase
          .from('transactions')
          .select('*, wallet:wallets!inner(id, currency)')
          .eq('user_id', user.id)
          .eq('wallet_id', selectedWalletId) // Always filter by selected wallet
          .eq('is_deleted', false)
          .eq('wallets.is_deleted', false)
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth);

        const { data: transactions, error } = await query.order('date', { ascending: true });

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        const processedData = processTransactions(transactions as Transaction[]);
        setChartData(processedData);
      } catch (error) {
        console.error('Failed to fetch transaction data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactionData();
  }, [currentDate, selectedWalletId, refreshTrigger]);

  // Update the wallet selection effect to track the currency
  React.useEffect(() => {
    if (selectedWalletId === 'all') {
      setSelectedWalletCurrency(null);
    } else {
      const selectedWallet = wallets.find(w => w.id === selectedWalletId);
      setSelectedWalletCurrency(selectedWallet?.currency || null);
    }
  }, [selectedWalletId, wallets]);

  // Update the wallet fetch to include currency
  React.useEffect(() => {
    async function fetchWallets() {
      try {
        const data = await walletService.getAll();
        setWallets(data);
      } catch (error) {
        console.error('Failed to load wallets:', error);
      }
    }

    fetchWallets();
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

  // Modify CardHeaderContent for better mobile layout
  const CardHeaderContent = () => (
    <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between w-full">
      {/* Controls Section */}
      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:gap-4">
        {/* Tabs - Full width on mobile */}
        <Tabs
          value={activeChart}
          onValueChange={(value) => setActiveChart(value as "expenses" | "income")}
          className="w-full sm:w-fit"
        >
          <TabsList className="grid w-full sm:w-[200px] grid-cols-2">
            <TabsTrigger value="expenses" className="text-xs">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs">
              Income
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Wallet Select - Full width on mobile */}
        <Select
          value={selectedWalletId || ''}
          onValueChange={(value) => {
            onWalletChange(value);
            setSelectedDate(null);
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px] mt-2 sm:mt-0">
            <SelectValue placeholder="Select wallet" />
          </SelectTrigger>
          <SelectContent>
            {wallets.map(wallet => (
              <SelectItem key={wallet.id} value={wallet.id}>
                {wallet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date and Total Section */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium order-1 sm:order-none">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          {/* Only show total if a specific wallet is selected */}
          {selectedWalletId !== 'all' && selectedWalletCurrency && (
            <span 
              style={{ color: chartConfig[activeChart].color }} 
              className="text-base sm:text-sm font-semibold sm:font-normal"
            >
              Total: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: selectedWalletCurrency || 'USD'
              }).format(total)}
            </span>
          )}
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
    <Card className="w-full">
      <CardHeader className="pb-4 px-2 sm:px-6">
        <CardHeaderContent />
      </CardHeader>
      <CardContent className="px-0 sm:px-6 pb-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] sm:h-[250px] w-full px-2 sm:px-0"
        >
          <BarChart
            data={chartData}
            margin={{
              left: 0,
              right: 8,
              top: 8,
              bottom: 0,
            }}
            onClick={handleBarClick}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={0}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.getDate().toString().padStart(2, '0');
              }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => 
                value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
              }
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
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
              cursor={{ stroke: 'hsl(var(--muted))' }}
              wrapperStyle={{ outline: 'none' }}
            />
            <Bar 
              dataKey={activeChart} 
              fill={chartConfig[activeChart].color}
              style={{
                cursor: 'pointer',
              }}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}