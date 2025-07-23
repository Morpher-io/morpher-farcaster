import * as React from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { MarketSelector } from "./MarketSelector";
import { usePortfolioStore } from "@/store/portfolio";
import { PositionSelector } from "./PositionSelector";
import { ClosePosition } from "./ClosePosition";

export function TradeTerminal() {
  const { tradeDirection, setTradeDirection } = usePortfolioStore();

  const handleSwap = () => {
    setTradeDirection(tradeDirection === 'open' ? 'close' : 'open');
  };

  return (
    <div className="mt-5 mx-4 mb-6">
      {tradeDirection === 'open' ? (
        <MarketSelector />
      ) : (
        <>
          <PositionSelector />
          <div className="my-2" />
          <ClosePosition />
        </>
      )}

      <div className="relative my-2 flex justify-center">
        <Button
          variant="outline"
          size="icon"
          className="relative z-10 size-12 rounded-full bg-background"
          onClick={handleSwap}
        >
          <img
            src={`/src/assets/icons/switch.svg`}
            alt={`Switch between Open and Close`}
            className="h-6 w-6"
          />
        </Button>
      </div>
    </div>
  );
}
