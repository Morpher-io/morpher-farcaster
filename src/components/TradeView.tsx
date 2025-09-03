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
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Trade } from "./Trade";
import { PendingPosition } from "./PendingPosition";
import { Loader2Icon } from "lucide-react";
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
import { useTranslations } from "next-intl";

export function TradeView() {
  const t = useTranslations();

  const {
    selectedMarketId,
    setSelectedMarketId,
    selectedMarket,
    livePrice,
    marketData,
    setMarketData,
    morpherTradeSDK,
  } = useMarketStore();
  const { orderUpdate, setSelectedPosition, selectedPosition, currencyList } =
    usePortfolioStore();

  const [timeRange, setTimeRange] = React.useState("1D");
  const [isMarketDataLoading, setIsMarketDataLoading] = React.useState(false);
  const account = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [marketPrice, setMarketPrice] = React.useState(0);
  const [closePercentage, setClosePercentage] = React.useState(100);
  const [isClosing, setIsClosing] = React.useState(false);
  const [tradeError, setTradeError] = React.useState<string | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (!marketData) {
      setMarketPrice(0);
      return;
    }

    if (livePrice && livePrice[marketData.market_id]) {
      setMarketPrice(livePrice[marketData.market_id]);
    } else {
      setMarketPrice(marketData.close);
    }
  }, [livePrice, marketData]);

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
    if (account.address && selectedMarketId) {
      fetchMarketData({
        eth_address: account.address,
        market_id: selectedMarketId,
      });
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
      months: number,
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
    return chartData.map((d) => ({
      timestamp: d[0] * 1000,
      value: d[4], // close price
    }));
  }, [chartData]);

  const isIncreasing = React.useMemo(() => {
    if (formattedChartData.length < 2) return true;
    return (
      formattedChartData[formattedChartData.length - 1].value >=
      formattedChartData[0].value
    );
  }, [formattedChartData]);

  const chartConfig = React.useMemo(
    () => ({
      value: {
        label: "Value",
        color: isIncreasing ? "var(--primary)" : "var(--secondary)",
      },
    }),
    [isIncreasing],
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
    if (result.result === "error") {
      let error = result.err;
      if (result.error_code) {
        const err_message = t("errors." + result.error_code.toUpperCase());
        if (err_message !== "errors." + result.error_code.toUpperCase()) {
          error = err_message;
        }
      }

      setTradeError(error || "An error occurred while executing the trade.");
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

  const formatStatValue = (
    num: number | string | undefined | null,
    prefix = "",
  ): string => {
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
      after:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      "trade halt": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
          statusColors[status.toLowerCase()] ||
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        )}
      >
        {status}
      </span>
    );
  };

  const PausedBadge = () => (
    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
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

  const CustomTooltip = React.useCallback(
    ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        const firstValue =
          formattedChartData.length > 0 ? formattedChartData[0].value : 0;

        const currentValue = data.value;
        const change = currentValue - firstValue;
        const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
        const isPositive = change >= 0;

        const timeFormat = timeRange === "1D" ? "p" : "PP";
        const dateText = formatDate(new Date(data.timestamp), timeFormat);

        return (
          <div className="bg-background rounded-lg border p-2 text-sm shadow-lg">
            <p className="font-bold">${tokenValueFormatter(currentValue)}</p>
            <div
              className={cn(
                "mt-1",
                isPositive ? "text-primary" : "text-secondary",
              )}
            >
              {isPositive ? "+" : ""}${tokenValueFormatter(change)} (
              {isPositive ? "+" : ""}
              {changePercent.toFixed(2)}%)
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{dateText}</p>
          </div>
        );
      }
      return null;
    },
    [formattedChartData, timeRange],
  );

  const chartComponent = React.useMemo(
    () => (
      <div className="-mx-4 h-[200px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
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
    ),
    [chartConfig, formattedChartData, yAxisDomain, CustomTooltip],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-full w-full max-w-full flex-col gap-0 bg-white p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="sr-only">
            Trade {selectedMarket?.name}
          </DialogTitle>
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
                  <p className="text-muted-foreground text-sm">
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
            <div className="flex h-full items-center justify-center">
              <Loader2Icon className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            marketData && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-3xl font-bold">
                      ${tokenValueFormatter(marketPrice)}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-semibold",
                        (Number(marketData.change_percent) || 0) >= 0
                          ? "text-primary"
                          : "text-secondary",
                      )}
                    >
                      {(Number(marketData.change_percent) || 0) >= 0 ? "+" : ""}
                      {tokenValueFormatter(marketData.change)} (
                      {(Number(marketData.change_percent) || 0).toFixed(2)}%)
                    </p>
                  </div>
                  <div className="flex flex-col items-end text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Market Cap:</span>
                      <span className="text-foreground font-medium">
                        {formatStatValue(marketData.market_cap, "$")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Spread:</span>
                      <span className="text-foreground font-medium">
                        {marketData.spread
                          ? `${(Number(marketData.spread) * 100).toFixed(2)}%`
                          : "–"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-foreground font-medium capitalize">
                        {marketData.type || "–"}
                      </span>
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
                  let positionPercent =
                    range > 0 ? ((close - low) / range) * 100 : 50;
                  positionPercent = Math.max(0, Math.min(100, positionPercent));
                  const isUp = close >= open;

                  return (
                    <div className="mt-4 border-t pt-4 text-xs">
                      <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                        <span>Low: ${tokenValueFormatter(low)}</span>
                        <span>High: ${tokenValueFormatter(high)}</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-muted relative h-1.5 rounded-full">
                              <div
                                className={`absolute h-1.5 rounded-full ${
                                  isUp ? "bg-primary" : "bg-secondary"
                                }`}
                                style={{ width: `${positionPercent}%` }}
                              />
                              <div
                                className="bg-foreground absolute -top-1 h-3 w-0.5"
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
                  <Card className="bg-white">
                    <CardContent className="p-4">
                      <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="text-muted-foreground">Direction</div>
                        <div
                          className={cn(
                            "text-right font-medium capitalize",
                            selectedPosition.direction === "long"
                              ? "text-primary"
                              : "text-secondary",
                          )}
                        >
                          {selectedPosition.direction}
                        </div>

                        <div className="text-muted-foreground">Value</div>
                        <div className="text-right font-medium">
                          {positionValueUsd ? (
                            <>
                              <span>${usdFormatter(positionValueUsd)}</span>
                              <span className="text-muted-foreground ml-1 text-xs">
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
                            isPositive ? "text-primary" : "text-secondary",
                          )}
                        >
                          {pnlUsd ? (
                            <>
                              <span>
                                {isPositive ? "+" : ""}${usdFormatter(pnlUsd)}
                              </span>
                              <span className="text-muted-foreground ml-1 text-xs">
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

                        <div className="text-muted-foreground">Avg. Entry</div>
                        <div className="text-right font-medium">
                          $
                          {usdFormatter(
                            Number(selectedPosition.average_price) / 10 ** 8,
                          )}
                        </div>

                        <div className="text-muted-foreground">Leverage</div>
                        <div className="text-right font-medium">
                          {(
                            Number(selectedPosition.average_leverage) /
                            10 ** 8
                          ).toFixed(1)}
                          x
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Slider
                          value={[closePercentage]}
                          onValueChange={(value) =>
                            setClosePercentage(value[0])
                          }
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
                            <Loader2Icon className="mr-2 animate-spin" />
                          )}
                          Close {closePercentage}% of Position
                        </Button>
                        {tradeError && (
                          <p className="text-center text-sm text-red-500">
                            {tradeError}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
