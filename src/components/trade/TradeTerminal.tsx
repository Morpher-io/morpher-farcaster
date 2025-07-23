import * as React from "react";
import { MarketSelector } from "./MarketSelector";
import { MarketSuggestions } from "./MarketSuggestions";
import { PortfolioSummary } from "./PortfolioSummary";
import { PortfolioStats } from "./PortfolioStats";
import { useAccount } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";

export function TradeTerminal() {
  const { address } = useAccount();
  const { setEthAddress } = usePortfolioStore();

  React.useEffect(() => {
    setEthAddress(address);
  }, [address, setEthAddress]);

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
