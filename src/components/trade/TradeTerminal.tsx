import * as React from "react";
import { MarketSelector } from "./MarketSelector";
import { MarketSuggestions } from "./MarketSuggestions";
import { PortfolioSummary } from "./PortfolioSummary";
import { PortfolioStats } from "./PortfolioStats";

export function TradeTerminal() {
  return (
    <div className="mt-5 mx-4 mb-6 flex flex-col gap-4 bg-white h-full">
      <PortfolioSummary />
      <div className="h-px bg-gray-200 my-2" />
      <PortfolioStats />
      <MarketSuggestions />
      <MarketSelector />
    </div>
  );
}
