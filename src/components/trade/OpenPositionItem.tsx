import * as React from "react";
import {
  TPosition,
  usdFormatter,
  tokenValueFormatter,
  TradeCallback,
} from "morpher-trading-sdk";
import { cn } from "@/lib/utils";
import { usePortfolioStore } from "@/store/portfolio";
import { useMarketStore } from "@/store/market";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Loader2Icon, ChevronDown } from "lucide-react";

interface OpenPositionItemProps {
  position: TPosition;
}

export function OpenPositionItem({ position }: OpenPositionItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [closePercentage, setClosePercentage] = React.useState(100);
  const [isClosing, setIsClosing] = React.useState(false);
  const [tradeError, setTradeError] = React.useState<string | undefined>(
    undefined
  );

  const { currencyList, selectedCurrency, setTradeComplete } =
    usePortfolioStore();
  const { morpherTradeSDK, setSelectedMarketId, marketListAll } = useMarketStore();
  const account = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const market = marketListAll?.[position.market_id];
  const currentPrice = market?.close;

  const pnl = Number(position.total_return || 0);
  const pnlPercent = Number(position.total_return_percent || 0) * 100;
  const isPositive = pnl >= 0;

  const positionValueMph = Number(position.value || 0) / 10 ** 18;
  const positionValueUsd = currencyList?.MPH?.usd_exchange_rate
    ? positionValueMph * currencyList.MPH.usd_exchange_rate
    : null;

  const pnlMph = pnl / 10 ** 18;
  const pnlUsd = currencyList?.MPH?.usd_exchange_rate
    ? pnlMph * currencyList.MPH.usd_exchange_rate
    : null;

  const tradeCompleteCallback = (result: TradeCallback) => {
    if (result.result === "error") {
      setTradeError(
        result.err || "An error occurred while executing the trade."
      );
    } else {
      setTradeComplete(true);
      setIsExpanded(false);
    }
    setIsClosing(false);
  };

  const handleClosePosition = () => {
    if (!walletClient) {
      setTradeError("Wallet client not available.");
      return;
    }
    setTradeError(undefined);
    setIsClosing(true);

    morpherTradeSDK.closePosition({
      account: account as any,
      walletClient: walletClient as any,
      publicClient: publicClient as any,
      market_id: position.market_id,
      closePercentage: closePercentage,
      callback: tradeCompleteCallback,
    });
  };

  return (
    <div className="border-b">
      <div
        className="flex items-center justify-between py-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {position.logo_image && (
            <img
              src={`data:image/svg+xml;base64,${position.logo_image}`}
              alt={`${position.name} logo`}
              className="h-9 w-9 rounded-full"
            />
          )}
          <div>
            <p className="font-semibold text-base">{position.symbol}</p>
            <p className="text-sm text-muted-foreground truncate max-w-[150px]">
              {position.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium text-base">
              {currentPrice ? `$${tokenValueFormatter(currentPrice)}` : "–"}
            </p>
            <div className="flex items-baseline justify-end gap-1 text-sm">
              <p>
                {positionValueUsd
                  ? `$${usdFormatter(positionValueUsd)}`
                  : `${tokenValueFormatter(positionValueMph)} MPH`}
              </p>
              <p
                className={cn(isPositive ? "text-primary" : "text-secondary")}
              >
                ({isPositive ? "+" : ""}
                {pnlPercent.toFixed(2)}%)
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </div>
      {isExpanded && (
        <div className="pb-4 px-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
            <div className="text-muted-foreground">Direction</div>
            <div
              className={cn(
                "text-right font-medium capitalize",
                position.direction === "long" ? "text-primary" : "text-secondary"
              )}
            >
              {position.direction}
            </div>

            <div className="text-muted-foreground">Value</div>
            <div className="text-right font-medium">
              {positionValueUsd ? (
                <>
                  <span>${usdFormatter(positionValueUsd)}</span>
                  <span className="text-muted-foreground text-xs ml-1">
                    ({tokenValueFormatter(positionValueMph)} MPH)
                  </span>
                </>
              ) : (
                <span>{tokenValueFormatter(positionValueMph)} MPH</span>
              )}
            </div>

            <div className="text-muted-foreground">Unrealized P/L</div>
            <div
              className={cn(
                "text-right font-medium",
                isPositive ? "text-primary" : "text-secondary"
              )}
            >
              {pnlUsd ? (
                <>
                  <span>
                    {isPositive ? "+" : ""}${usdFormatter(pnlUsd)}
                  </span>
                  <span className="text-muted-foreground text-xs ml-1">
                    ({isPositive ? "+" : ""}
                    {tokenValueFormatter(pnlMph)} MPH)
                  </span>
                </>
              ) : (
                <span>
                  {isPositive ? "+" : ""}{tokenValueFormatter(pnlMph)} MPH
                </span>
              )}
            </div>

            <div className="text-muted-foreground">Avg. Entry</div>
            <div className="text-right font-medium">
              ${usdFormatter(Number(position.average_price) / 10 ** 8)}
            </div>

            <div className="text-muted-foreground">Leverage</div>
            <div className="text-right font-medium">
              {(Number(position.average_leverage) / 10 ** 8).toFixed(1)}x
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={() => setSelectedMarketId(position.market_id)}
          >
            View Market
          </Button>

          <div className="space-y-4">
            <div className="text-center font-semibold text-lg">
              {closePercentage}%
            </div>
            <Slider
              value={[closePercentage]}
              onValueChange={(value) => setClosePercentage(value[0])}
              max={100}
              step={5}
            />
            <Button
              onClick={handleClosePosition}
              disabled={isClosing || closePercentage === 0}
              className="w-full"
            >
              {isClosing && <Loader2Icon className="animate-spin mr-2" />}
              Close {closePercentage}% of Position
            </Button>
            {tradeError && (
              <p className="text-red-500 text-sm text-center">{tradeError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
