import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ChartTooltipContent } from "@/components/ui/chart";
import { Trade } from "./Trade";
import { Position } from "./Position";
import { PendingPosition } from "./PendingPosition";
import { Loader2Icon } from "lucide-react";
import { useMarketStore } from "@/store/market";
import { usePortfolioStore } from "@/store/portfolio";
import { useAccount } from "wagmi";
import { StrictOHLCArray, tokenValueFormatter } from "morpher-trading-sdk";
import { cn } from "@/lib/utils";

export function TradeView() {
  const {
    selectedMarketId,
    setSelectedMarketId,
    selectedMarket,
    selectedMarketClose,
    marketData,
    setMarketData,
    morpherTradeSDK,
  } = useMarketStore();
  const { orderUpdate, setSelectedPosition } = usePortfolioStore();

  const [timeRange, setTimeRange] = React.useState("1D");
  const [isMarketDataLoading, setIsMarketDataLoading] = React.useState(false);
  const account = useAccount();
  const [primaryColor, setPrimaryColor] = React.useState("hsl(262.1 83.3% 57.8%)");
  const [secondaryColor, setSecondaryColor] = React.useState("hsl(350 89% 60%)");

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const style = getComputedStyle(document.body);
      const primary = style.getPropertyValue('--primary')?.trim();
      if (primary) {
        setPrimaryColor(`hsl(${primary})`);
      }
      const secondary = style.getPropertyValue('--secondary')?.trim();
      if (secondary) {
        setSecondaryColor(`hsl(${secondary})`);
      }
    }
  }, []);

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

  const chartColor = isIncreasing ? primaryColor : secondaryColor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-full w-full max-w-full flex flex-col bg-white p-0 gap-0">
        <DialogHeader className="p-4 border-b">
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
                <div>
                  <p className="font-semibold">{selectedMarket.symbol}</p>
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
                <div className="flex flex-col text-center">
                    <p className="text-2xl font-bold">${tokenValueFormatter(selectedMarketClose || marketData.close)}</p>
                    <p className={cn("text-sm font-semibold", (marketData.change_percent || 0) >= 0 ? "text-primary" : "text-secondary")}>
                        {(marketData.change_percent || 0) >= 0 ? "+" : ""}
                        {tokenValueFormatter(marketData.change)} ({(marketData.change_percent * 100).toFixed(2)}%)
                    </p>
                </div>

                <div className="-mx-4 h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedChartData}>
                      <defs>
                        <linearGradient id="chart-fill-market" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        cursor={{
                          stroke: chartColor,
                          strokeWidth: 1,
                          strokeDasharray: "3 3",
                        }}
                        content={<ChartTooltipContent
                          indicator="dot"
                          formatter={(value) => `$${tokenValueFormatter(value as number)}`}
                        />}
                      />
                      <XAxis dataKey="timestamp" hide />
                      <Area
                        dataKey="value"
                        type="natural"
                        fill="url(#chart-fill-market)"
                        stroke={chartColor}
                        stackId="a"
                        dot={false}
                        activeDot={{
                          r: 4,
                          style: { fill: chartColor, stroke: "#fff" },
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

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

                {marketData.pending_order_id ? (
                  <PendingPosition />
                ) : (
                  <>
                    {marketData.position_id && <Position />}
                    <Trade />
                  </>
                )}
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
