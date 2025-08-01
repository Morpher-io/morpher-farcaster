import * as React from "react";
import { usePortfolioStore } from "@/store/portfolio";
import { Card, CardContent } from "../ui/card";
import { Loader2Icon } from "lucide-react";
import { tokenValueFormatter, usdFormatter } from "morpher-trading-sdk";
import { useTranslation } from "react-i18next";

export function PortfolioStats() {
  const { portfolio, returns, loading, currencyList, positionList } = usePortfolioStore();
  const { t } = useTranslation();

  const availableToTrade = React.useMemo(() => {
    if (!currencyList) return 0;
    return Object.values(currencyList).reduce(
      (acc, currency) => acc + (currency?.usd || 0),
      0
    );
  }, [currencyList]);

  const weeklyPnl = React.useMemo(() => {
    const mphToUsdRate = currencyList?.MPH?.usd_exchange_rate || 0;
    const weeklyReturns = returns["w"];
    if (!weeklyReturns || weeklyReturns.length < 2) {
      return { valueMph: 0, valueUsd: 0, percent: 0, isPositive: true };
    }

    const startValue = weeklyReturns[0].total;
    const endValue = weeklyReturns[weeklyReturns.length - 1].total;

    if (typeof startValue !== "number" || typeof endValue !== "number") {
      return { valueMph: 0, valueUsd: 0, percent: 0, isPositive: true };
    }

    const changeMph = endValue - startValue;
    const changeUsd = changeMph * mphToUsdRate;

    let percentChange = 0;
    if (startValue !== 0) {
      percentChange = (changeMph / startValue) * 100;
    } else if (changeMph !== 0) {
      percentChange = Infinity;
    }

    return { valueMph: changeMph, valueUsd: changeUsd, percent: percentChange, isPositive: changeMph >= 0 };
  }, [returns, currencyList]);

  if (loading) {
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
      title: t('AVAILABLE_TO_TRADE'),
      value: `$${usdFormatter(availableToTrade)}`,
    },
    {
      title: t('WEEKLY_P_L'),
      data: weeklyPnl,
    },
    {
      title: t('OPEN_POSITIONS'),
      value: positionList?.length || 0,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-2">
          <CardContent className="flex flex-col items-center  p-1 text-center h-full justify-between">
            <p className="font-semibold text-muted-foreground text-xs leading-tight mb-1">{stat.title}</p>
            <div className="">
              {stat.data ? (
                <>
                  <p className={`font-semibold text-xs mt-1 ${stat.data.isPositive === false ? "text-secondary" : "text-[var(--dark)]"}`}>
                    {stat.data.isPositive ? "+" : ""}$ {usdFormatter(stat.data.valueUsd)}
                    {isFinite(stat.data.percent) && (
                      <span className="text-xs ml-1">
                        <br />({stat.data.percent.toFixed(2)}%)
                      </span>
                    )}
                  </p>
                  <p className={`text-xs mt-1 ${stat.data.isPositive === false ? "text-secondary" : "text-[var(--dark)]"}`}>
                    {stat.data.isPositive ? "+" : ""}{tokenValueFormatter(stat.data.valueMph)} MPH
                  </p>
                </>
              ) : (
                <p className="font-bold text-baseline">{stat.value}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
