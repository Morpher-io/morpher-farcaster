import * as React from "react";
import { usePortfolioStore } from "@/store/portfolio";
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

    let invested = 0
    let returned = 0
    weeklyReturns.forEach(point => {
        invested += point.invested || 0
        returned += point.returned || 0
    })
    const startPos = weeklyReturns[0].positions
    const endPos = weeklyReturns[weeklyReturns.length -1 ].positions

    const returnAmount = endPos - startPos - invested + returned 
    const totalInvested = invested + startPos 
    const returnPercentage = returnAmount / totalInvested


    const changeUsd = returnAmount * mphToUsdRate;

    return { valueMph: returnAmount, valueUsd: changeUsd, percent: returnPercentage * 100, isPositive: returnAmount >= 0 };
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
    <div>
      <h1 className="font-bold text-base mb-0 mt-2">{t("INFO")}</h1>
    
    <div className="border-1 border-[var(--primary)] rounded-md p-4  mt-2">
      {stats.map((stat, index) => (
        <div className={`flex justify-between ${index !== 2 ? 'border-b pb-3' : ''} ${index !== 0 ? 'pt-4' : ''} `} >
<p className="font-semibold text-foreground text-xs leading-tight mb-1">{stat.title}</p>
            <div className="min-w-22">
              {stat.data ? (
                <>
                  <p className={`font-semibold text-sm mt-0 ${stat.data.isPositive === false ? "text-secondary" : "text-[var(--dark)]"}`}>
                    {stat.data.isPositive ? "+" : ""}$ {usdFormatter(stat.data.valueUsd)}
                    {isFinite(stat.data.percent) && (
                      <span className="text-sm ml-1">
                        <br />({stat.data.percent.toFixed(2)}%)
                      </span>
                    )}
                  </p>
                  <p className={`text-sm  mt-0 ${stat.data.isPositive === false ? "text-secondary" : "text-[var(--dark)]"}`}>
                    {stat.data.isPositive ? "+" : ""}{tokenValueFormatter(stat.data.valueMph)} MPH
                  </p>
                </>
              ) : (
                <p className="font-bold text-baseline">{stat.value}</p>
              )}
            </div>
        </div>

      ))}

    </div>
    </div>
  );
}
