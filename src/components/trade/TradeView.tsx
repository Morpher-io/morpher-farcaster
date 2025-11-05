import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Card, CardContent } from "../ui/card";
import { Line, LineChart,  Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Trade } from "./Trade";
import { PendingPosition } from "./PendingPosition";
import { Loader2Icon, X } from "lucide-react";
import { useMarketStore } from "@/store/market";
import { usePortfolioStore } from "@/store/portfolio";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import {
  StrictOHLCArray,
  tokenValueFormatter,
  TradeCallback,
  usdFormatter,
} from "morpher-trading-sdk";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";
import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Input } from "../ui/input";

export function TradeView() {
  const { t } = useTranslation();
  
  const {
    selectedMarketId,
    setSelectedMarketId,
    selectedMarket,
    livePrice,
    marketData,
    setMarketData,
    morpherTradeSDK,
    marketListAll
  } = useMarketStore();
  const {
    orderUpdate,
    setSelectedPosition,
    selectedPosition,
    currencyList,
  } = usePortfolioStore();

  const [timeRange, setTimeRange] = React.useState("1D");
  const [isMarketDataLoading, setIsMarketDataLoading] = React.useState(false);
  const account = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [marketPrice, setMarketPrice] = React.useState(0);
  const [showProtectionForm, setShowProtectionForm] = React.useState(false);
  const [protectionType, setProtectionType] = React.useState<"stop-loss" | "take-profit">("take-profit");
  const [protectionAmount, setProtectionAmount] = React.useState("");
    
  const [closePercentage, setClosePercentage] = React.useState(100);
  const [isClosing, setIsClosing] = React.useState(false);
  const [tradeError, setTradeError] = React.useState<string | undefined>(
    undefined
  );
  const [currentPrice, setCurrentPrice] = React.useState(0);
  const market = marketListAll?.[selectedPosition?.market_id || ''];

  const [isExecuting, setIsExecuting] = React.useState(false);

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

      

  React.useEffect(() => {

    if (!marketData) {
      setMarketPrice(0)
      return
    }
    

    
    if (livePrice && livePrice[marketData.market_id]) {
      setMarketPrice(livePrice[marketData.market_id])
    } else {
      setMarketPrice(marketData.close)
    }


  }, [livePrice, marketData])

  const open = !!selectedMarketId;

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedMarketId("");
    }
  };

  const fetchMarketData = async ({
    eth_address,
    market_id,
  }: {
    eth_address: `0x${string}`;
    market_id: string;
  }) => {
    setIsMarketDataLoading(true);
    const sdkMarketData = await morpherTradeSDK.getMarketData({
      eth_address,
      market_id,
    });
    setMarketData(sdkMarketData);
    setIsMarketDataLoading(false);
  };

  React.useEffect(() => {
        if (isExecuting) {
       setTimeout(() => {
        setIsExecuting(false);
      }, 1000)
      
    }

    if (orderUpdate?.type == 'limit_order') {
      setShowProtectionForm(false)
      setProtectionAmount('')
      setProtectionType('take-profit')
    } 
    
    if (account.address && selectedMarketId) {
      fetchMarketData({ eth_address: account.address, market_id: selectedMarketId });
    } else {
      setMarketData(undefined);
    }
  }, [account.address, selectedMarketId, orderUpdate]);

  const getPosition = async () => {
    if (account.address === undefined || marketData?.position_id == undefined) {
      return;
    }
    let positions = await morpherTradeSDK.getPositions({
      eth_address: account.address,
      position_id: marketData.position_id,
    });
    if (positions && positions.length > 0) {
      setSelectedPosition(positions[0]);
    }
  };

  React.useEffect(() => {
    if (account.address && marketData?.position_id) {
      getPosition();
    }
  }, [account, marketData?.position_id]);

  const chartData = React.useMemo(() => {
    if (!marketData) return undefined;

    const now = new Date();
    const filterData = (data: StrictOHLCArray[] | undefined, days: number) => {
      if (!data) return undefined;
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - days);
      const cutoffTimestamp = cutoff.getTime() / 1000;
      return data.filter((d) => d[0] >= cutoffTimestamp);
    };

    const filterDataMonths = (
      data: StrictOHLCArray[] | undefined,
      months: number
    ) => {
      if (!data) return undefined;
      const cutoff = new Date();
      cutoff.setMonth(now.getMonth() - months);
      const cutoffTimestamp = cutoff.getTime();
      return data.filter((d) => d[0] >= cutoffTimestamp);
    };

    switch (timeRange) {
      case "1D":
        return marketData.data_minutely;
      case "1W":
        return filterData(marketData.data_hourly, 7);
      case "1M":
        return filterDataMonths(marketData.data_daily, 1);
      case "3M":
        return filterDataMonths(marketData.data_daily, 3);
      case "6M":
        return filterDataMonths(marketData.data_daily, 6);
      case "1Y":
        return filterDataMonths(marketData.data_daily, 12);
      default:
        return marketData.data_minutely;
    }
  }, [marketData, timeRange]);

  const formattedChartData = React.useMemo(() => {
    if (!chartData) return [];
    return chartData.map(d => ({
      timestamp: d[0] * 1000,
      value: d[4] // close price
    }));
  }, [chartData]);

  const isIncreasing = React.useMemo(() => {
    if (formattedChartData.length < 2) return true;
    return formattedChartData[formattedChartData.length - 1].value >= formattedChartData[0].value;
  }, [formattedChartData]);

  const chartConfig = React.useMemo(
    () => ({
      value: {
        label: "Value",
        color: isIncreasing ? "var(--primary)" : "var(--secondary)",
      },
    }),
    [isIncreasing]
  );

  const yAxisDomain = React.useMemo(() => {
    if (!formattedChartData || formattedChartData.length < 2) {
      return ["auto", "auto"];
    }

    const values = formattedChartData.map((d) => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (minValue === maxValue) {
        const margin = Math.abs(minValue * 0.1) || 1;
        return [minValue - margin, maxValue + margin];
    }
    
    const margin = (maxValue - minValue) * 0.1;

    return [minValue - margin, maxValue + margin];
  }, [formattedChartData]);

  const tradeCompleteCallback = (result: TradeCallback) => {
     if (result.result === 'error') {
      let error = result.err
      if (result.error_code) {
        const err_message = t('errors.' + result.error_code.toUpperCase());
        if (err_message !== 'errors.' + result.error_code.toUpperCase()) {
          error = err_message
        }
      }
      
      setTradeError(error || 'An error occurred while executing the trade.')
    } else {
      setSelectedMarketId("");
    }
    setIsClosing(false);
  };

  const handleClosePosition = () => {
    if (!walletClient || !selectedPosition) {
      setTradeError("Wallet client or position not available.");
      return;
    }
    setTradeError(undefined);
    setIsClosing(true);

    morpherTradeSDK.closePosition({
      account: account as any,
      walletClient: walletClient as any,
      publicClient: publicClient as any,
      market_id: selectedPosition.market_id,
      closePercentage: closePercentage,
      callback: tradeCompleteCallback,
    });
  };

  const pnl = selectedPosition ? Number(selectedPosition.total_return || 0) : 0;
  const isPositive = pnl >= 0;

  const formatStatValue = (num: number | string | undefined | null, prefix = ""): string => {
    if (num === null || num === undefined) return "–";
    const number = Number(num);
    if (isNaN(number)) return "–";
    if (number === 0) return `${prefix}0`;

    const tiers = [
      { value: 1e12, symbol: "T" },
      { value: 1e9, symbol: "B" },
      { value: 1e6, symbol: "M" },
      { value: 1e3, symbol: "k" },
    ];

    const tier = tiers.find((t) => Math.abs(number) >= t.value);

    if (tier) {
      return `${prefix}${(number / tier.value).toFixed(2)}${tier.symbol}`;
    }

    return `${prefix}${number.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // const StatRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  //   <>
  //     <div className="text-muted-foreground">{label}</div>
  //     <div className="text-right font-medium">{value}</div>
  //   </>
  // );

  const StatusBadge = ({ status }: { status: string }) => {
    const statusColors: { [key: string]: string } = {
      open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      pre: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      after: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      "trade halt": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <span
        className={cn(
          "text-xs font-semibold px-2 py-0.5 rounded-full capitalize",
          statusColors[status.toLowerCase()] ||
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        )}
      >
        {status}
      </span>
    );
  };

  const PausedBadge = () => (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-orange-5000 dark:bg-yellow-900 dark:text-yellow-300">
      Paused
    </span>
  );
  const pnlMph = pnl / 10 ** 18;
  const pnlUsd = currencyList?.MPH?.usd_exchange_rate
    ? pnlMph * currencyList.MPH.usd_exchange_rate
    : null;
  const positionValueMph = selectedPosition
    ? Number(selectedPosition.value || 0) / 10 ** 18
    : 0;
  const positionValueUsd = currencyList?.MPH?.usd_exchange_rate
    ? positionValueMph * currencyList.MPH.usd_exchange_rate
    : null;

  
  const showProtection = () => {
    setShowProtectionForm(true);
  };  

  const CustomTooltip = React.useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const firstValue = formattedChartData.length > 0 ? formattedChartData[0].value : 0;

      const currentValue = data.value;
      const change = currentValue - firstValue;
      const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
      const isPositive = change >= 0;

      const timeFormat = timeRange === "1D" ? "p" : "PP";
      const dateText = formatDate(new Date(data.timestamp), timeFormat);

      return (
        <div className="p-2 bg-background border rounded-lg shadow-lg text-sm">
          <p className="font-bold">${tokenValueFormatter(currentValue)}</p>
          <div
            className={cn(
              "mt-1",
              isPositive ? "text-primary" : "text-secondary"
            )}
          >
            {isPositive ? "+" : ""}
            ${tokenValueFormatter(change)} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
          </div>
          <p className="text-xs text-muted-foreground mt-1">{dateText}</p>
        </div>
      );
    }
    return null;
  }, [formattedChartData, timeRange]);

  
  const handleSetSLTP = () => {
    if (!selectedPosition) return;
    if (!walletClient) {
      setTradeError(t('WALLET_CLIENT_NOT_AVAILABLE'));
      return;
    }
    setTradeError(undefined);
    setIsExecuting(true);

    

    let price_above = 0
    
    let price_below = 0

    if (selectedPosition.direction == 'long') {
      price_above = Number(selectedPosition.take_profit || 0) / 10**8
      price_below = Number(selectedPosition.stop_loss || 0) / 10**8
      if (protectionType === 'stop-loss' ) {
        price_below = Number(protectionAmount)
      } else {
        price_above  = Number(protectionAmount)
      }
    } else {
      price_above = Number(selectedPosition.stop_loss || 0) / 10**8
      price_below = Number(selectedPosition.take_profit || 0) / 10**8
      if (protectionType === 'stop-loss' ) {
        price_above = Number(protectionAmount)
      } else {
        price_below  = Number(protectionAmount)
      }
    }

     
     morpherTradeSDK.setSLTP({
       account: account as any,
       walletClient: walletClient as any,
       publicClient: publicClient as any,
       market_id: selectedPosition.market_id,
       priceAbove: price_above,
       priceBelow: price_below,
       callback: tradeCompleteCallback,
     });
  };

  const leverage = Number(selectedPosition?.average_leverage);
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
    // const entryPrice = Number(selectedPosition?.average_price) / 10 ** 8;

    // let pnlRatio = 0;
    // if (selectedPosition?.direction === "long") {
    //   pnlRatio = protAmountNum / entryPrice - 1;
    // } else {
    //   // short
    //   if (protAmountNum > 0) {
    //     pnlRatio = entryPrice / protAmountNum - 1;
    //   }
    // }
        let result = 0;
    let limit_val = 0;


    limit_val = Number(protectionAmount) * leverage;
    
    if (selectedPosition?.direction === 'long') {
      const shares = Number(selectedPosition?.long_shares || 0) / 10 ** 18;
      const old_val =  Number(selectedPosition?.average_price || 0) * (Number(selectedPosition?.average_leverage || 0) / 10 ** 8 - 1);
      result = shares * (limit_val - old_val);
    } else {
      const shares = Number(selectedPosition?.short_shares || 0) / 10 ** 18;
      const old_val = Number(selectedPosition?.average_price || 0) * (Number(selectedPosition?.average_leverage || 0) / 10 ** 8 + 1);
      result = shares * (old_val - limit_val);
    }

    estimatedTotalValueMph = result
    estimatedPnlMph = estimatedTotalValueMph - (Number(selectedPosition?.value) / 10**18) 

    if (currencyList?.MPH?.usd_exchange_rate) {
      estimatedPnlUsd =
        estimatedPnlMph * currencyList.MPH.usd_exchange_rate;
      estimatedTotalValueUsd =
        estimatedTotalValueMph * currencyList.MPH.usd_exchange_rate;
    }

    if (currentPrice > 0) {
      if (selectedPosition?.direction === "long") {
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

  const chartComponent = React.useMemo(() => (
    <div className="-mx-4 h-[200px]">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <LineChart data={formattedChartData}>
          <RechartsTooltip
            cursor={{
              stroke: "var(--color-value)",
              strokeWidth: 1,
              strokeDasharray: "3 3",
            }}
            content={<CustomTooltip />}
          />
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={yAxisDomain} hide />
          <Line
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              style: {
                fill: "var(--color-value)",
                stroke: "var(--background)",
              },
            }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  ), [chartConfig, formattedChartData, yAxisDomain, CustomTooltip]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-full w-full max-w-full flex flex-col bg-white p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="sr-only">Trade {selectedMarket?.name}</DialogTitle>
          <div className="flex items-center justify-between">
            {selectedMarket ? (
              <div className="flex items-center gap-3">
                {selectedMarket.logo_image && (
                  <img
                    src={`data:image/svg+xml;base64,${selectedMarket.logo_image}`}
                    alt={`${selectedMarket.name} logo`}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{selectedMarket.symbol}</p>
                    {marketData?.status && (
                      <StatusBadge status={marketData.status} />
                    )}
                    {marketData?.is_paused && <PausedBadge />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedMarket.name}
                  </p>
                </div>
              </div>
            ) : (
              <div />
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {isMarketDataLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2Icon className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            marketData && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    
                    <p className="text-3xl font-bold">${tokenValueFormatter(marketPrice)}</p>
                    <p className={cn("text-lg font-semibold", (Number(marketData.change_percent) || 0) >= 0 ? "text-primary" : "text-secondary")}>
                        {(Number(marketData.change_percent) || 0) >= 0 ? "+" : ""}
                        {tokenValueFormatter(marketData.change)} ({(Number(marketData.change_percent) || 0).toFixed(2)}%)
                    </p>
                  </div>
                  <div className="flex flex-col items-end text-xs">
                      <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Market Cap:</span>
                          <span className="font-medium text-foreground">{formatStatValue(marketData.market_cap, "$")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Spread:</span>
                          <span className="font-medium text-foreground">{marketData.spread ? `${(Number(marketData.spread) * 100).toFixed(2)}%` : "–"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium text-foreground capitalize">{marketData.type || "–"}</span>
                      </div>
                  </div>
                </div>

                {chartComponent}

                <div className="flex justify-center gap-1">
                  {["1D", "1W", "1M", "3M", "6M", "1Y"].map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className="rounded-full px-3"
                    >
                      {range}
                    </Button>
                  ))}
                </div>

                {(() => {
                  const low = Number(marketData.low || 0);
                  const high = Number(marketData.high || 0);
                  const open = Number(marketData.open || 0);
                  const close = Number(marketPrice);
                  const range = high - low;
                  let positionPercent = range > 0 ? ((close - low) / range) * 100 : 50;
                  positionPercent = Math.max(0, Math.min(100, positionPercent));
                  const isUp = close >= open;

                  return (
                    <div className="mt-4 text-xs border-t pt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Low: ${tokenValueFormatter(low)}</span>
                        <span>High: ${tokenValueFormatter(high)}</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative h-1.5 bg-muted rounded-full">
                              <div
                                className={`absolute h-1.5 rounded-full ${
                                  isUp ? "bg-primary" : "bg-secondary"
                                }`}
                                style={{ width: `${positionPercent}%` }}
                              />
                              <div
                                className="absolute h-3 w-0.5 bg-foreground -top-1"
                                style={{ left: `${positionPercent}%` }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Current: ${tokenValueFormatter(close)}</p>
                            <p>Open: ${tokenValueFormatter(open)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  );
                })()}

                {marketData.pending_order_id ? (
                  <PendingPosition marketData={marketData} />
                ) : marketData.position_id && selectedPosition ? (
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
                          className="w-full grid grid-cols-2 border rounded-lg mb-4"
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

                            {protectionType === "stop-loss" && Number(selectedPosition.stop_loss) > 0 && (
                              <span className="text-muted-foreground">
                                {t("CURRENT")}: ${tokenValueFormatter(Number(selectedPosition.stop_loss) / 10 ** 8)}
                              </span>
                            )}
                            {protectionType === "take-profit" && Number(selectedPosition.take_profit) > 0 && (
                              <span className="text-muted-foreground">
                                {t("CURRENT")}: ${tokenValueFormatter(Number(selectedPosition.take_profit) / 10 ** 8)}
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
                                      ? `${estimatedPnlMph >= 0 ? "+" : ""
                                      }$${usdFormatter(estimatedPnlUsd)}`
                                      : `${estimatedPnlMph >= 0 ? "+" : ""
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
                            <p className="text-[var(--info)] text-xs mt-4">
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

                        <Button disabled={showWarning || (Number(protectionAmount || 0) == 0) || isExecuting || (estimatedTotalValueMph || 0) < 0} className={`w-full ${protectionType === "stop-loss" ? 'bg-secondary' : ''}`} onClick={handleSetSLTP}>
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
                    ) : (<Card className="bg-white">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                          <div className="text-muted-foreground">Direction</div>
                          <div
                            className={cn(
                              "text-right font-medium capitalize",
                              selectedPosition.direction === "long"
                                ? "text-primary"
                                : "text-secondary"
                            )}
                          >
                            {selectedPosition.direction}
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
                              <span>
                                {tokenValueFormatter(positionValueMph)} MPH
                              </span>
                            )}
                          </div>

                          <div className="text-muted-foreground">
                            Unrealized P/L
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
                                  {isPositive ? "+" : ""}
                                  ${usdFormatter(pnlUsd)}
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
                            $
                            {usdFormatter(
                              Number(selectedPosition.average_price) / 10 ** 8
                            )}
                          </div>

                          <div className="text-muted-foreground">{t("LEVERAGE")}</div>
                          <div className="text-right font-medium">
                            {(
                              Number(selectedPosition.average_leverage) /
                              10 ** 8
                            ).toFixed(1)}
                            x
                          </div>

                          {(Number(selectedPosition.stop_loss || 0) !== 0 || Number(selectedPosition.take_profit || 0) !== 0) && (
                            <div className="col-span-2 border-t-1 pt-2"  >
                              <div className="text-muted-foreground flex items-center font-bold">
                                <img src="/assets/icons/protection.svg" alt="tick" className="h-5 w-5 mt-0.5 mr-1" />{t("PROTECTION")}
                              </div>

                              {Number(selectedPosition.stop_loss || 0) !== 0 && (
                                <div className="flex justify-between items-center mt-1">
                                  <div>
                                    <div className="text-muted-foreground">{t("STOP_LOSS")}</div>
                                    <div className="font-medium">
                                      {(tokenValueFormatter(Number(selectedPosition.stop_loss) / 10 ** 8))}
                                    </div>
                                  </div>

                                  <Button
                                    variant="outline"
                                    className="col-span-2"
                                    onClick={() => setSelectedMarketId(selectedPosition.market_id)}
                                  >
                                    {t("CANCEL")}
                                  </Button>
                                </div>
                              )}

                              {Number(selectedPosition.take_profit || 0) !== 0 && (
                                <div className="flex justify-between items-center  mt-1">
                                  <div>
                                    <div className="text-muted-foreground">{t("TAKE_PROFIT")}</div>
                                    <div className="font-medium">
                                      {(tokenValueFormatter(Number(selectedPosition.take_profit) / 10 ** 8))}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    className="col-span-2"
                                    onClick={() => setSelectedMarketId(selectedPosition.market_id)}
                                  >
                                    {t("CANCEL")}
                                  </Button>
                                </div>
                              )}


                            </div>
                          )}

                        </div>

                        <div className="space-y-4">
                          <Slider
                            value={[closePercentage]}
                            onValueChange={(value) => setClosePercentage(value[0])}
                            max={100}
                            step={5}
                            className="mt-4 mb-4"
                          />
                          <Button
                            onClick={handleClosePosition}
                            disabled={isClosing || closePercentage === 0}
                            className="w-full"
                          >
                            {isClosing && (
                              <Loader2Icon className="animate-spin mr-2" />
                            )}
                            Close {closePercentage}% of Position
                          </Button>

                          <Button
                            variant="outline"
                            onClick={showProtection}
                            disabled={isClosing || closePercentage === 0}
                            className="w-full"
                          >
                            {isClosing && (
                              <Loader2Icon className="animate-spin mr-2" />
                            )}
                            {t("ADD_PROTECTION")}
                          </Button>

                          {tradeError && (
                            <p className="text-red-500 text-sm text-center">
                              {tradeError}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>)}
                  </>

                ) : (
                  <Trade />
                )}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
