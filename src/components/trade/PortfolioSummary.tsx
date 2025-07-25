import * as React from "react";
import { usePortfolioStore } from "@/store/portfolio";
import { tokenValueFormatter, usdFormatter } from "morpher-trading-sdk";
import { Loader2Icon, LineChart as LineChartIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";

export function PortfolioSummary() {
  const {
    portfolio,
    loading,
    eth_address,
    leaderboard,
    positionValue,
    currencyList,
    returns,
  } = usePortfolioStore();
  const [isChartOpen, setIsChartOpen] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState<"d" | "w" | "m" | "y">("d");

  const totalPortfolioValueUSD = React.useMemo(() => {
    if (!currencyList?.MPH?.usd_exchange_rate || !portfolio) return 0;

    const freeCashInMphWei = BigInt(portfolio.total_portfolio_value || "0");
    const positionsValueInMphWei = BigInt(positionValue || 0);

    const totalMphWei = freeCashInMphWei + positionsValueInMphWei;

    return (Number(totalMphWei) / 1e18) * currencyList.MPH.usd_exchange_rate;
  }, [portfolio, positionValue, currencyList]);

  const userLeaderboardEntry = React.useMemo(() => {
    if (!leaderboard || !eth_address) return null;
    return leaderboard.find(
      (entry) => entry.eth_address.toLowerCase() === eth_address.toLowerCase()
    );
  }, [leaderboard, eth_address]);

  const profileImage =
    userLeaderboardEntry?.profile_image ||
    `https://source.boringavatars.com/beam/40/${eth_address || "default"}`;
  const rank = userLeaderboardEntry?.rank;

  const chartData = React.useMemo(() => {
    if (!returns || !returns[timeRange]) return [];
    return returns[timeRange].map((point) => ({
      timestamp: point.timestamp,
      value: point.positions,
    }));
  }, [returns, timeRange]);

  const isIncreasing = React.useMemo(() => {
    if (chartData.length < 2) return true;
    return chartData[chartData.length - 1].value >= chartData[0].value;
  }, [chartData]);

  const chartConfig = React.useMemo(
    () => ({
      value: {
        label: "Value",
        color: isIncreasing ? "var(--primary)" : "var(--secondary)",
      },
    }),
    [isIncreasing]
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-center items-center h-[52px]">
          <Loader2Icon className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      console.log(data);
      const mphToUsdRate = currencyList?.MPH?.usd_exchange_rate || 0;
      const firstValue = chartData.length > 0 ? chartData[0].value : 0;

      const currentValue = data.value;
      const currentValueUsd = (currentValue) * mphToUsdRate;

      const change = currentValue - firstValue;
      const changeUsd = (change) * mphToUsdRate;
      const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
      const isPositive = change >= 0;

      const timeFormat = timeRange === "d" ? "p" : "PP";
      const dateText = formatDate(new Date(data.timestamp), timeFormat);

      return (
        <div className="p-2 bg-background border rounded-lg shadow-lg text-sm">
          <p className="font-bold">${usdFormatter(currentValueUsd)}</p>
          <p className="text-muted-foreground">
            {tokenValueFormatter(currentValue)} MPH
          </p>
          <div
            className={cn(
              "mt-1",
              isPositive ? "text-primary" : "text-secondary"
            )}
          >
            {isPositive ? "+" : ""}${usdFormatter(changeUsd.toString())} (
            {isPositive ? "+" : ""}
            {changePercent.toFixed(2)}%)
          </div>
          <p className="text-xs text-muted-foreground mt-1">{dateText}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={profileImage}
            alt="User profile"
            className="h-10 w-10 rounded-full"
          />
          <div>
            <div className="flex items-center gap-1">
              <p className="text-muted-foreground text-sm">Portfolio Value</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsChartOpen(true)}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-2xl font-bold">
              ${usdFormatter(totalPortfolioValueUSD.toString())}
            </p>
          </div>
        </div>
        {rank && (
          <div className="text-right">
            <p className="text-sm font-semibold text-muted-foreground">Rank</p>
            <p className="text-xl font-bold text-primary">#{rank}</p>
          </div>
        )}
      </div>
      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Portfolio Performance</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="mb-4 text-center min-h-[48px]">
              <p className="text-2xl font-bold">
                ${usdFormatter(totalPortfolioValueUSD.toString())}
              </p>
              <p className="text-sm text-muted-foreground">
                ({tokenValueFormatter(
                  (totalPortfolioValueUSD /
                    (currencyList?.MPH?.usd_exchange_rate || 1))
                )}{" "}
                MPH)
              </p>
            </div>
            <div className="-mx-6 h-[200px]">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart data={chartData}>
                  <Tooltip
                    content={CustomTooltip}
                    cursor={{
                      stroke: "var(--color-value)",
                      strokeWidth: 1,
                      strokeDasharray: "3 3",
                    }}
                  />
                  <XAxis
                    dataKey="timestamp"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      const format = timeRange === "d" ? "HH:mm" : "MMM d";
                      return formatDate(date, format);
                    }}
                    hide
                  />
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
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant={timeRange === "d" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("d")}
              >
                1D
              </Button>
              <Button
                variant={timeRange === "w" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("w")}
              >
                1W
              </Button>
              <Button
                variant={timeRange === "m" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("m")}
              >
                1M
              </Button>
              <Button
                variant={timeRange === "y" ? "outline" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("y")}
              >
                1Y
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
