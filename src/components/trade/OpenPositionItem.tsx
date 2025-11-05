import * as React from "react";
import {
  TPosition,
  usdFormatter,
  tokenValueFormatter,
  TradeCallback,
  TMarketDetail,
  TAddress,
} from "morpher-trading-sdk";
import { cn } from "@/lib/utils";
import { usePortfolioStore } from "@/store/portfolio";
import { useMarketStore } from "@/store/market";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Input } from "../ui/input";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Loader2Icon, ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PendingPosition } from "./PendingPosition";

interface OpenPositionItemProps {
  position: TPosition;
  showClose?: boolean;
}

export function OpenPositionItem({ position, showClose }: OpenPositionItemProps) {
  const { t } = useTranslation();

  if (showClose == undefined) {
    showClose = true
  }
  
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showProtectionForm, setShowProtectionForm] = React.useState(false);
  const [protectionType, setProtectionType] = React.useState<"stop-loss" | "take-profit">("take-profit");
  const [protectionAmount, setProtectionAmount] = React.useState("");
  const [closePercentage, setClosePercentage] = React.useState(100);
  const [isClosing, setIsClosing] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [marketData, setMarketData] = React.useState<TMarketDetail | undefined>(undefined);
  const [tradeError, setTradeError] = React.useState<string | undefined>(
    undefined
  );

  const setProtectionAmountPercent = (percent: number) => {
    let adjust = 1
    if (percent < 0) {
      adjust = -1
      percent = Math.abs(percent)
    }
    let adjustAmount = Number(currentPrice) * (percent / 100) * adjust
    let protectionAmount = Number(currentPrice) + Number(adjustAmount)
    console.log(protectionAmount)
    setProtectionAmount(tokenValueFormatter(protectionAmount))
  }

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
        setIsExecuting(false);
        setShowProtectionForm(false)
      }, 20000)

      setTimeoutTimer(timer)
      
    }

    
  };

  React.useEffect(() => {
    if (isExecuting) {
       setTimeout(() => {
        setIsExecuting(false);
      }, 1000)
      if (timeoutTimer) {
        clearTimeout(timeoutTimer)
        setTimeoutTimer(undefined)
      }
      
    }

    if (orderUpdate?.type == 'limit_order') {
      setShowProtectionForm(false)
      setProtectionAmount('')
      setProtectionType('take-profit')
    } 
    
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

  const cancelSLTP = async (cancelType: 'sl' | 'tp') => {
    if (cancelType === 'sl') {
      if (!position.stop_loss) {
        return
      }
      position.stop_loss = '0'
    }
     if (cancelType === 'tp') {
      if (!position.take_profit) {
        return
      }
      position.take_profit = '0'
    }

    let price_above = 0
    
    let price_below = 0

    if (position.direction == 'long') {
      price_above = Number( position.take_profit || 0) / 10**8
      price_below = Number(position.stop_loss || 0) / 10**8

    } else {
      price_above = Number( position.stop_loss || 0) / 10**8
      price_below = Number(position.take_profit || 0) / 10**8

    }


    if (Number(price_below) === 0 && Number(price_above) === 0 ) {

          let orders = await morpherTradeSDK.getOrders({
            eth_address: position?.eth_address as TAddress,
            market_id: position?.market_id
      });
      let lim = orders.filter(o => o.type === 'limit_order' && o.status == 'requested')
      if (lim.length > 0) {
        let order_id = lim[0].id
        if (order_id) {
          morpherTradeSDK.cancelOrder({
            account: account as any,
            walletClient: walletClient as any,
            publicClient: publicClient as any,
            order_id,
            market_id: position.market_id,
            callback: tradeCompleteCallback,
          });
        }
      }
      

    } else {
     
     morpherTradeSDK.setSLTP({
       account: account as any,
       walletClient: walletClient as any,
       publicClient: publicClient as any,
       market_id: position.market_id,
       priceAbove: price_above,
       priceBelow: price_below,
       callback: tradeCompleteCallback,
     });

    }


  }
  
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

  const showProtection = () => {
    setShowProtectionForm(true);
  };

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

  const handleSetSLTP = () => {
    if (!walletClient) {
      setTradeError(t('WALLET_CLIENT_NOT_AVAILABLE'));
      return;
    }
    setTradeError(undefined);
    setIsExecuting(true);

    

    console.log('position', position)

    let price_above = 0
    
    let price_below = 0

    if (position.direction == 'long') {
      price_above = Number( position.take_profit || 0) / 10**8
      price_below = Number(position.stop_loss || 0) / 10**8
      if (protectionType === 'stop-loss' ) {
        price_below = Number(protectionAmount)
      } else {
        price_above  = Number(protectionAmount)
      }
    } else {
      price_above = Number( position.stop_loss || 0) / 10**8
      price_below = Number(position.take_profit || 0) / 10**8
      if (protectionType === 'stop-loss' ) {
        price_above = Number(protectionAmount)
      } else {
        price_below  = Number(protectionAmount)
      }
    }

    console.log(position.market_id, {price_below, price_above})
     
     morpherTradeSDK.setSLTP({
       account: account as any,
       walletClient: walletClient as any,
       publicClient: publicClient as any,
       market_id: position.market_id,
       priceAbove: price_above,
       priceBelow: price_below,
       callback: tradeCompleteCallback,
     });
  };

  const leverage = Number(position.average_leverage);
  let estimatedTotalValueMph: number | null = null;
  let estimatedTotalValueUsd: number | null = null;
  let estimatedPnlMph: number | null = null;
  let estimatedPnlUsd: number | null = null;
  let showWarning = false;
  let switchTo: "stop-loss" | "take-profit" | null = null;

  if (
    protectionAmount &&
    !isNaN(Number(protectionAmount)) &&
    Number(protectionAmount) > 0
  ) {
    const protAmountNum = Number(protectionAmount);
    const entryPrice = Number(position.average_price) / 10 ** 8;

    let pnlRatio = 0;
    if (position.direction === "long") {
      pnlRatio = protAmountNum / entryPrice - 1;
    } else {
      // short
      if (protAmountNum > 0) {
        pnlRatio = entryPrice / protAmountNum - 1;
      }
    }
        let result = 0;
    let limit_val = 0;


    limit_val = Number(protectionAmount) * leverage;
    
    if (position?.direction === 'long') {
      const shares = Number(position?.long_shares || 0) / 10 ** 18;
      const old_val =  Number(position?.average_price || 0) * (Number(position?.average_leverage || 0) / 10 ** 8 - 1);
      result = shares * (limit_val - old_val);
    } else {
      const shares = Number(position?.short_shares || 0) / 10 ** 18;
      const old_val = Number(position?.average_price || 0) * (Number(position?.average_leverage || 0) / 10 ** 8 + 1);
      result = shares * (old_val - limit_val);
    }

    estimatedTotalValueMph = result
    estimatedPnlMph = estimatedTotalValueMph - (Number(position.value) / 10**18) 

    if (currencyList?.MPH?.usd_exchange_rate) {
      estimatedPnlUsd =
        estimatedPnlMph * currencyList.MPH.usd_exchange_rate;
      estimatedTotalValueUsd =
        estimatedTotalValueMph * currencyList.MPH.usd_exchange_rate;
    }

    if (currentPrice > 0) {
      if (position.direction === "long") {
        if (protectionType === "take-profit" && protAmountNum < currentPrice) {
          showWarning = true;
          switchTo = "stop-loss";
        } else if (
          protectionType === "stop-loss" &&
          protAmountNum > currentPrice
        ) {
          showWarning = true;
          switchTo = "take-profit";
        }
      } else {
        // short
        if (protectionType === "take-profit" && protAmountNum > currentPrice) {
          showWarning = true;
          switchTo = "stop-loss";
        } else if (
          protectionType === "stop-loss" &&
          protAmountNum < currentPrice
        ) {
          showWarning = true;
          switchTo = "take-profit";
        }
      }
    }
  }

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
          {showProtectionForm ? (
            <div className="pb-4 px-2 p-3 rounded-lg border-1 border-[var(--primary)] mb-4 bg-muted">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{t("ADD_PROTECTION")}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowProtectionForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ToggleGroup
                type="single"
                value={protectionType}
                onValueChange={(value) => {
                  if (value) {
                    setProtectionType(value as "stop-loss" | "take-profit");
                  }
                }}
                className={"w-full grid grid-cols-2 border rounded-lg mb-4 " + (protectionType == 'stop-loss' ?  'border-[var(--secondary)]' : ' border-[var(--primary)]')  }
              >
                <ToggleGroupItem value="take-profit" className="data-[state=on]:bg-primary data-[state=on]:text-white">
                  {t("TAKE_PROFIT")}
                </ToggleGroupItem>
                <ToggleGroupItem value="stop-loss" className="data-[state=on]:bg-secondary data-[state=on]:text-white">
                  {t("STOP_LOSS")}
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {t("CURRENT_MARKET_PRICE")}
                </p>
                <p className="font-semibold text-lg">
                  ${tokenValueFormatter(currentPrice)}
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <label
                  htmlFor="protection-amount"
                  className="text-sm font-medium flex justify-between items-center"
                >
                  <span>
                    {protectionType === "stop-loss"
                      ? t("STOP_LOSS_PRICE")
                      : t("TAKE_PROFIT_PRICE")}
                  </span>

                  {protectionType === "stop-loss" && Number(position.stop_loss) > 0 && (
                    <span className="text-muted-foreground">
                      {t("CURRENT")}: ${tokenValueFormatter(Number(position.stop_loss) / 10**8)}
                    </span>
                  )}
                  {protectionType === "take-profit" && Number(position.take_profit) > 0 && (
                    <span className="text-muted-foreground">
                      {t("CURRENT")}: ${tokenValueFormatter(Number(position.take_profit) / 10**8)}
                    </span>  
                  )}
                  
                </label>
                <Input
                  id="protection-amount"
                  type="number"
                  placeholder="$0.00"
                  className="bg-white rounded-sm focus:outline-none focus:ring-0 focus:border-[var(--primary)] focus-visible:border-[var(--primary)] focus-visible:shadow-none  focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={protectionAmount}
                  onChange={(e) => setProtectionAmount(e.target.value)}
                />
                {estimatedTotalValueMph !== null && (
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    {estimatedPnlMph !== null && (
                      <div className="flex justify-between">
                        <span>{protectionType === "stop-loss"
                    ? t("ESTIMATED_LOSS")
                    : t("ESTIMATED_PROFIT")}</span>
                        <span
                          className={cn(
                            "font-medium",
                            estimatedPnlMph >= 0
                              ? "text-primary"
                              : "text-secondary"
                          )}
                        >
                          {estimatedPnlUsd !== null
                            ? `${
                                estimatedPnlMph >= 0 ? "+" : ""
                              }$${usdFormatter(estimatedPnlUsd)}`
                            : `${
                                estimatedPnlMph >= 0 ? "+" : ""
                              }${tokenValueFormatter(estimatedPnlMph)} MPH`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t("ESTIMATED_VALUE")}</span>
                      <span className="font-medium text-foreground">
                        {estimatedTotalValueUsd !== null
                          ? `$${usdFormatter(estimatedTotalValueUsd)}`
                          : `${tokenValueFormatter(
                              estimatedTotalValueMph
                            )} MPH`}
                      </span>
                    </div>
                  </div>
                )}
                {showWarning && switchTo && (
                  <p className="text-[var(--info)] text-xs mt-2">
                        {t('SLTP_WARNING', { type: protectionType === "take-profit" ? t("LOSS") : t("PROFIT") })}
                        <br />
                        {t('SLTP_WARNING_2')}&nbsp;
                        
                    <button
                      type="button"
                      onClick={() => setProtectionType(switchTo)}
                      className="underline font-semibold"
                    >
                      {switchTo === "stop-loss"
                        ? t("STOP_LOSS")
                        : t("TAKE_PROFIT")}
                    </button>
                    ?
                  </p>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 py-2 mb-4">
                {(protectionType === "stop-loss"
                  ? [
                    { label: "-5%", value: -5 },
                    { label: "-10%", value: -10 },
                    { label: "-15%", value: -15 },
                    { label: "-20%", value: -20 },
                  ] : [{ label: "+5%", value: 5 },
                  { label: "+10%", value: 10 },
                  { label: "+15%", value: 15 },
                  { label: "+20%", value: 20 },]).map(({ label, value }) => {


                    return (
                      <Button
                        key={label}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "text-xs max-h-7 rounded-sm h-8",
                          value < 0
                            ? "text-secondary hover:bg-secondary/10"
                            : "text-primary hover:bg-primary/10"
                        )}
                        onClick={() => setProtectionAmountPercent(value)}

                      >
                        {label}
                      </Button>
                    );
                  })}

              </div>

              <Button disabled={showWarning  || (Number(protectionAmount || 0) == 0) ||isExecuting || (estimatedTotalValueMph || 0) < 0} className={`w-full ${protectionType === "stop-loss" ? 'bg-secondary' : ''}`} onClick={handleSetSLTP}>
                {isExecuting && <Loader2Icon className="animate-spin mr-2" />}
                {t("SET")}  {protectionType === "stop-loss"
                        ? t("STOP_LOSS")
                        : t("TAKE_PROFIT")}
              </Button>
                {(estimatedTotalValueMph || 0) < 0 && (
                  <p className="text-[var(--info)] text-xs mt-2">
                    {t('SLTP_LIQUIDATE')}<br />{t('SLTP_LIQUIDATE_2')}

                  </p>
                )}
            </div>
          ) : marketData?.pending_order_id ? (
            <>
              <PendingPosition marketData={marketData} />
            </>
          ) : (
            <div className="pb-4 px-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                <div className="text-muted-foreground">{t("DIRECTION")}</div>
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

                <div className="text-muted-foreground">{t("VALUE")}</div>
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

                <div className="text-muted-foreground">
                  {t("UNREALIZED_PL")}
                </div>
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

                <div className="text-muted-foreground">{t("AVG_ENTRY")}</div>
                <div className="text-right font-medium">
                  ${usdFormatter(Number(position.average_price) / 10 ** 8)}
                </div>

                <div className="text-muted-foreground">{t("LEVERAGE")}</div>
                <div className="text-right font-medium">
                  {(Number(position.average_leverage) / 10 ** 8).toFixed(1)}x
                </div>

                {(Number(position.stop_loss || 0) !== 0 || Number(position.take_profit || 0) !== 0) && (
                  <div className="col-span-2 border-t-1 pt-2"  >
                  <div className="text-muted-foreground flex items-center font-bold">
                    <img src="/assets/icons/protection.svg" alt="tick" className="h-5 w-5 mt-0.5 mr-1" />{t("PROTECTION")}
                  </div>

                  {Number(position.stop_loss || 0) !== 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      <div className="text-muted-foreground">{t("STOP_LOSS")}</div>
                      <div className="font-medium">
                        {(tokenValueFormatter(Number(position.stop_loss) / 10 ** 8))}
                      </div>
                    </div>
                    
                      <Button
                    variant="outline"
                    className="col-span-2"
                    onClick={() => cancelSLTP('sl')}
                  >
                    {t("CANCEL")}
                  </Button>
                  </div>
                )}

                {Number(position.take_profit || 0) !== 0 && (
                  <div className="flex justify-between items-center  mt-1">
                    <div>
                      <div className="text-muted-foreground">{t("TAKE_PROFIT")}</div>
                      <div className="font-medium">
                        {(tokenValueFormatter(Number(position.take_profit) / 10 ** 8))}
                      </div>
                    </div>
                    <Button
                    variant="outline"
                    className="col-span-2"
                    onClick={() => cancelSLTP('tp')}
                  >
                    {t("CANCEL")}
                  </Button>
                  </div>
                )}
                  
                  
                  </div>
                )}



              </div>

              <div className="space-y-4">
                {showClose && (
                  <Slider
                    value={[closePercentage]}
                    onValueChange={(value) => setClosePercentage(value[0])}
                    max={100}
                    step={5}
                    className="mt-4 mb-4"
                  />
                )}

                {showClose && (
                  <Button
                    onClick={handleClosePosition}
                    disabled={isClosing || closePercentage === 0}
                    className="w-full"
                  >
                    {isClosing && <Loader2Icon className="animate-spin mr-2" />}
                    {t("CLOSE_PERCENTAGE", { closePercentage })}
                  </Button>
                )}
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    className="col-span-2"
                    onClick={() => setSelectedMarketId(position.market_id)}
                  >
                    {t("VIEW_MARKET")}
                  </Button>
                  {showClose && (
                    <Button
                      variant="outline"
                      onClick={showProtection}
                      disabled={isClosing || closePercentage === 0}
                      className="col-span-2"
                    >
                      {isClosing && (
                        <Loader2Icon className="animate-spin mr-2" />
                      )}
                      {t("ADD_PROTECTION")}
                    </Button>
                  )}
                </div>

                {tradeError && (
                  <p className="text-red-500 text-sm text-center">
                    {tradeError}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
