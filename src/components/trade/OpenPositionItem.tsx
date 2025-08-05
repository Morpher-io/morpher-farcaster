import * as React from "react";
import {
  TPosition,
  usdFormatter,
  tokenValueFormatter,
  TradeCallback,
  TMarketDetail,
} from "morpher-trading-sdk";
import { cn } from "@/lib/utils";
import { usePortfolioStore } from "@/store/portfolio";
import { useMarketStore } from "@/store/market";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Loader2Icon, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PendingPosition } from "./PendingPosition";

interface OpenPositionItemProps {
  position: TPosition;
}

export function OpenPositionItem({ position }: OpenPositionItemProps) {
  const { t } = useTranslation();
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [closePercentage, setClosePercentage] = React.useState(100);
  const [isClosing, setIsClosing] = React.useState(false);
  const [marketData, setMarketData] = React.useState<TMarketDetail | undefined>(undefined);
  const [tradeError, setTradeError] = React.useState<string | undefined>(
    undefined
  );

  const [timeoutTimer, setTimeoutTimer]  = React.useState<NodeJS.Timeout>();



  React.useEffect(() => {
    if (position?.market_id) {
      // subscribe to market
      morpherTradeSDK.subscribeToMarket(position.market_id, (update: any) => {
        setLivePrice(position.market_id, update.close)
      });
    }

    return () => {
      // subscription cleanup
      morpherTradeSDK.unsubscribeFromMarket(position.market_id);
    };
  }, [position]);

  const { currencyList, orderUpdate } =
    usePortfolioStore();
  const { morpherTradeSDK, setSelectedMarketId, marketListAll, setLivePrice, livePrice } =
    useMarketStore();
  const account = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const market = marketListAll?.[position.market_id];
  const [currentPrice, setCurrentPrice] = React.useState(0);

  
  const openMarket = async () => {
    if (isExpanded) {
      setIsExpanded(false)
    } else {

      if (market?.market_id) {
        
        if (!marketData || marketData.market_id !== market?.market_id ) {
          await refreshMarketData() 

        }
      }


      setIsExpanded(true)
    }
    
  }

  React.useEffect(() => {

    if (!market) {
      setCurrentPrice(0)
      return
    }
    

    
    if (livePrice && livePrice[market.market_id]) {
      setCurrentPrice(livePrice[market.market_id])
    } else {
      setCurrentPrice(market.close || 0)
    }


  }, [livePrice, market])

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

    if (result.result === 'error') {
      let error = result.err
      if (result.error_code) {
        const err_message = t('errors.' + result.error_code.toUpperCase());
        if (err_message !== 'errors.' + result.error_code.toUpperCase()) {
          error = err_message
        }
      }
      
      setTradeError(error || t('ERROR_EXECUTING_TRADE'))
    } else {

      let timer = setTimeout(() => {
        setIsExpanded(false);
        setIsClosing(false);
      }, 20000)

      setTimeoutTimer(timer)
      
    }

    
  };

  React.useEffect(() => {
    if (isClosing) {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer)
        setTimeoutTimer(undefined)
      }
     setTimeout(() => {
        setIsClosing(false);
      }, 1000)
    }
    if (isExpanded) {
      if (orderUpdate?.status == 'success') {
        setIsExpanded(false);
      }
    }
        
  }, [orderUpdate])
  
  const refreshMarketData = async () => {
    console.log('refreshMarketData')
    if (market?.market_id) {
      const sdkMarketData = await morpherTradeSDK.getMarketData({eth_address:account.address, market_id: market.market_id})
      setMarketData(sdkMarketData);
    } else {
      setMarketData(undefined);
    }
  }
  React.useEffect(() => {
    if (orderUpdate?.status == 'cancelled' && marketData) {
      refreshMarketData()
    } else if (marketData && orderUpdate?.market_id && orderUpdate?.market_id === marketData.market_id) {
      refreshMarketData()
    }
    
    
  }, [orderUpdate])

  const handleClosePosition = () => {
    if (!walletClient) {
      setTradeError(t('WALLET_CLIENT_NOT_AVAILABLE'));
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
        onClick={() => openMarket()}
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
              <p className={cn(isPositive ? "text-primary" : "text-secondary")}>
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
        <>
        {marketData?.pending_order_id ? (<>
          <PendingPosition marketData={marketData} />
        </>) : (
        <div className="pb-4 px-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
            <div className="text-muted-foreground">{t('DIRECTION')}</div>
            <div
              className={cn(
                "text-right font-medium capitalize",
                position.direction === "long"
                  ? "text-primary"
                  : "text-secondary"
              )}
            >
              {position.direction}
            </div>

            <div className="text-muted-foreground">{t('VALUE')}</div>
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

            <div className="text-muted-foreground">{t('UNREALIZED_PL')}</div>
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
                  {isPositive ? "+" : ""}
                  {tokenValueFormatter(pnlMph)} MPH
                </span>
              )}
            </div>

            <div className="text-muted-foreground">{t('AVG_ENTRY')}</div>
            <div className="text-right font-medium">
              ${usdFormatter(Number(position.average_price) / 10 ** 8)}
            </div>

            <div className="text-muted-foreground">{t('LEVERAGE')}</div>
            <div className="text-right font-medium">
              {(Number(position.average_leverage) / 10 ** 8).toFixed(1)}x
            </div>
          </div>

          <div className="space-y-4">
            <Slider
              value={[closePercentage]}
              onValueChange={(value) => setClosePercentage(value[0])}
              max={100}
              step={5}
              className="mt-4 mb-4"
            />
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="col-span-1"
                onClick={() => setSelectedMarketId(position.market_id)}
              >
                {t('VIEW_MARKET')}
              </Button>
              <Button
                onClick={handleClosePosition}
                disabled={isClosing || closePercentage === 0}
                className="col-span-2"
              >
                {isClosing && <Loader2Icon className="animate-spin mr-2" />}
                {t('CLOSE_PERCENTAGE', { closePercentage })}
              </Button>
            </div>
            {tradeError && (
              <p className="text-red-500 text-sm text-center">{tradeError}</p>
            )}
          </div>
        </div>
        )}
        </>
      )}
    </div>
  );
}
