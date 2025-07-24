import * as React from "react";
import { MarketSelector } from "./MarketSelector";
import { MarketSuggestions } from "./MarketSuggestions";
import { PortfolioSummary } from "./PortfolioSummary";
import { PortfolioStats } from "./PortfolioStats";
import { useAccount, usePublicClient } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";
import { useMarketStore } from "@/store/market";
import { TPosition, usdFormatter, tokenValueFormatter } from "morpher-trading-sdk";
import { cn } from "@/lib/utils";

export function TradeTerminal() {
  const { address } = useAccount();
  const { setEthAddress, setCurrencyList, currencyList, positionList, setSelectedPosition, setTradeDirection } = usePortfolioStore();
  const { morpherTradeSDK, setSelectedMarketId, setMarketType } = useMarketStore();
  const publicClient = usePublicClient();

  const selectPosition = (position_id: string) => {
    let position = positionList?.find(pos => pos.id === position_id)
    if (position) {
        setSelectedPosition(position)
        if (address) {
            setMarketType('commodity')
            setTradeDirection('close')

            setSelectedMarketId(position.market_id)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
  }

  const outputPosition = (position: TPosition) => {
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

    return (
      <div className="border-b py-4">
        <div className="flex items-center justify-between mb-4">
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
          <div
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full capitalize",
              position.direction === "long"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            )}
          >
            {position.direction}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
                <span className="text-xs ml-1">
                  ({isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%)
                </span>
              </>
            ) : (
              <>
                <span>
                  {isPositive ? "+" : ""}{tokenValueFormatter(pnlMph)} MPH
                </span>
                <span className="text-xs ml-1">
                  ({isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%)
                </span>
              </>
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
      </div>
    );
  };

  React.useEffect(() => {
    console.log("TradeTerminal: address from useAccount:", address);
    setEthAddress(address);
  }, [address, setEthAddress]);

  const fetchCurrencyList = async () => {
    if (address && publicClient && morpherTradeSDK.tokenAddress && morpherTradeSDK.usdcAddress) {
      console.log("TradeTerminal: Fetching currency list for", address);
      const fetchedCurrencyList = await morpherTradeSDK.getCurrencyList({ address, publicClient, tokenAddresses: [{symbol: 'MPH', address: morpherTradeSDK.tokenAddress as `0x${string}`}, {symbol: 'USDC', address: morpherTradeSDK.usdcAddress as `0x${string}` } ]  })
      console.log("TradeTerminal: Fetched currency list:", fetchedCurrencyList);
      setCurrencyList(fetchedCurrencyList);
    }
  }

  React.useEffect(()=> {
    if (address && publicClient && !currencyList && morpherTradeSDK.ready) {
      fetchCurrencyList()

    }
  }, [address, publicClient, currencyList, morpherTradeSDK.ready]) 


  return (
    <div className="mt-5 mx-4 mb-6 flex flex-col gap-4 bg-white h-full">
      <PortfolioSummary />
      <div className="h-px bg-gray-200 my-2" />
      <PortfolioStats />
      <MarketSuggestions />
      <MarketSelector />
      {positionList && positionList.length > 0 && (
        <>
          <h2 className="text-lg font-bold mt-2">Open Positions</h2>
          {positionList.map((position) => (
            <div
              key={position.id}
              className="cursor-pointer"
              onClick={() => {selectPosition(position.id)}}
            >
              {outputPosition(position)}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
