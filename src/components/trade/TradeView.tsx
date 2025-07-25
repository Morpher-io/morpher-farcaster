import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Trade } from "./Trade";
import { Position } from "./Position";
import { PendingPosition } from "./PendingPosition";
import { Loader2Icon } from "lucide-react";
import { useMarketStore } from "@/store/market";
import { usePortfolioStore } from "@/store/portfolio";
import { useAccount } from "wagmi";
import { StrictOHLCArray, tokenValueFormatter } from "morpher-trading-sdk";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";

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

  const CustomTooltip = ({ active, payload }: any) => {
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
  };

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
                    <p className={cn("text-sm font-semibold", (Number(marketData.change_percent) || 0) >= 0 ? "text-primary" : "text-secondary")}>
                        {(Number(marketData.change_percent) || 0) >= 0 ? "+" : ""}
                        {tokenValueFormatter(marketData.change)} ({(Number(marketData.change_percent) || 0).toFixed(2)}%)
                    </p>
                </div>

                <div className="-mx-4 h-[200px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <LineChart data={formattedChartData}>
                      <Tooltip
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
