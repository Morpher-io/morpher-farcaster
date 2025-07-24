import * as React from "react";
import { usePortfolioStore } from "@/store/portfolio";
import { usdFormatter } from "morpher-trading-sdk";
import { Loader2Icon } from "lucide-react";

export function PortfolioSummary() {
  const { portfolio, loading } = usePortfolioStore();

  console.log("PortfolioSummary state:", { loading, portfolio });

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-center items-center h-[52px]">
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
      </div>
    </div>
  );
}
