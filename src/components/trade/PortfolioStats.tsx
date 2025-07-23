import * as React from "react";
import { usePortfolioStore } from "@/store/portfolio";
import { Card, CardContent } from "../ui/card";
import { Loader2Icon } from "lucide-react";
import { usdFormatter } from "morpher-trading-sdk";

export function PortfolioStats() {
  const { portfolio, returns, loading, currencyList } = usePortfolioStore();

  const availableToTrade = React.useMemo(() => {
    if (!currencyList) return 0;
    return Object.values(currencyList).reduce(
      (acc, currency) => acc + (currency?.usd || 0),
      0
    );
  }, [currencyList]);

  const weeklyPnl = React.useMemo(() => {
    const weeklyReturns = returns["w"];
    if (!weeklyReturns || weeklyReturns.length < 2)
      return { value: 0, percent: 0 };
    const startValue = weeklyReturns[0][1];
    const endValue = weeklyReturns[weeklyReturns.length - 1][1];
    const change = endValue - startValue;
    const percentChange = startValue !== 0 ? (change / startValue) * 100 : 0;
    return { value: change, percent: percentChange };
  }, [returns]);

  if (loading && !portfolio) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-center items-center h-[78px]">
          <Loader2Icon className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  const stats = [
    {
      title: "Available to Trade",
      value: `$${usdFormatter(availableToTrade)}`,
    },
    {
      title: "Weekly P/L",
      value: `${weeklyPnl.value >= 0 ? "+" : ""}$${usdFormatter(
        weeklyPnl.value
      )}`,
      subValue: `(${weeklyPnl.percent.toFixed(2)}%)`,
      isPositive: weeklyPnl.value >= 0,
    },
    {
      title: "Open Positions",
      value: portfolio.positions_count,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-2">
          <CardContent className="flex flex-col items-center justify-center p-1 text-center h-full">
            <p className="font-semibold text-muted-foreground text-xs leading-tight mb-1">{stat.title}</p>
            <div className="flex-grow flex flex-col justify-center">
              <p className={`font-semibold text-sm ${stat.isPositive === false ? "text-secondary" : stat.isPositive === true ? "text-primary" : ""}`}>
                {stat.value}
              </p>
              {stat.subValue && (
                <p className={`text-xs ${stat.isPositive === false ? "text-secondary" : "text-primary"}`}>
                  {stat.subValue}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
