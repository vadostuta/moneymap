"use client"

import * as React from "react"
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { transactionService } from "@/lib/services/transaction"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

// Chart colors (labels will be set dynamically using translations)
const CHART_COLORS = {
  expenses: "hsl(341 90% 62%)", // Deep red
  income: "hsl(151 75% 48%)", // Bright green
} as const

// Interface for transaction data
interface TransactionData {
  date: string
  expenses: number
  income: number
}

// Interface for transaction
// interface Transaction {
//   date: string
//   type: string
//   amount: number
// }

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
  const { t, i18n } = useTranslation('common')
  
  // Create translated chart config
  const translatedChartConfig = {
    expenses: {
      label: t('overview.expenses'),
      color: CHART_COLORS.expenses,
    },
    income: {
      label: t('overview.income'),
      color: CHART_COLORS.income,
    },
  } satisfies ChartConfig
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

  // Fetch transaction data
  React.useEffect(() => {
    async function fetchTransactionData() {
      try {
        setLoading(true);
        
        if (!selectedWalletId) return;

        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];

        const transactions = await transactionService.getMonthlyTransactions({
          walletId: selectedWalletId,
          startDate: firstDayOfMonth,
          endDate: lastDayOfMonth
        });

        const processedData = transactionService.processTransactionsForChart(transactions);
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
              {t('overview.expenses')}
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs">
              {t('overview.income')}
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
            <SelectValue placeholder={t('ui.selectWallet')} />
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
            {currentDate.toLocaleDateString(i18n.language === 'ua' ? 'uk-UA' : 'en-US', { month: 'long', year: 'numeric' })}
          </span>
          {/* Only show total if a specific wallet is selected */}
          {selectedWalletId !== 'all' && selectedWalletCurrency && (
            <span 
              style={{ color: translatedChartConfig[activeChart].color }} 
              className="text-base sm:text-sm font-semibold sm:font-normal"
            >
              {t('ui.total')}: {new Intl.NumberFormat('en-US', {
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
          <p>{t('common.loading')}</p>
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
          <p>{t('transactions.noTransactions')} {currentDate.toLocaleDateString(i18n.language === 'ua' ? 'uk-UA' : 'en-US', { month: 'long', year: 'numeric' })}.</p>
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
          config={translatedChartConfig}
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
                
                return [formattedValue, name === 'expenses' ? t('overview.expenses') : t('overview.income')];
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
              fill={translatedChartConfig[activeChart].color}
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