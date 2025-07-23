import * as React from "react";
import { usePortfolioStore } from "@/store/portfolio";
import { PortfolioChart } from "./PortfolioChart";
import { Button } from "../ui/button";
import { usdFormatter } from "morpher-trading-sdk";
import { Loader2Icon } from "lucide-react";

export function PortfolioSummary() {
  const { portfolio, returns, loading } = usePortfolioStore();
  const [timeRange, setTimeRange] = React.useState<'d' | 'w' | 'm' | 'y'>('d');

  console.log("PortfolioSummary state:", { loading, portfolio, returns });

  const chartData = returns[timeRange];

  const valueChange = React.useMemo(() => {
    if (!chartData || chartData.length < 2) return { value: 0, percent: 0 };
    const startValue = chartData[0][1];
    const endValue = chartData[chartData.length - 1][1];
    const change = endValue - startValue;
    const percentChange = startValue !== 0 ? (change / startValue) * 100 : 0;
    return { value: change, percent: percentChange };
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-center items-center h-[288px]">
          <Loader2Icon className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">Portfolio Value</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold">${usdFormatter(portfolio.total_portfolio_value)}</p>
        <p className={`text-sm font-semibold ${valueChange.value >= 0 ? "text-primary" : "text-secondary"}`}>
            {valueChange.value >= 0 ? "+" : ""}
            ${usdFormatter(valueChange.value)} ({valueChange.percent.toFixed(2)}%)
        </p>
      </div>
      <PortfolioChart data={chartData} timeRange={timeRange} />
      <div className="flex justify-center gap-1">
        {[
          { label: '1D', value: 'd' },
          { label: '1W', value: 'w' },
          { label: '1M', value: 'm' },
          { label: '1Y', value: 'y' }
        ].map(range => (
          <Button
            key={range.value}
            variant={timeRange === range.value ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange(range.value as 'd' | 'w' | 'm' | 'y')}
            className="rounded-full px-3"
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
