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
import { PortfolioChart } from "./PortfolioChart";

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
    let data: [number, number][] = [];
    returns[timeRange].forEach((point) => {
      data.push([point.timestamp, point.positions]);
    });
    return data;
  }, [returns, timeRange]);

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
            <p className="text-muted-foreground text-sm">Portfolio Value</p>
            <p className="text-2xl font-bold">
              ${usdFormatter(totalPortfolioValueUSD.toString())}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rank && (
            <div className="text-right">
              <p className="text-sm font-semibold text-muted-foreground">Rank</p>
              <p className="text-xl font-bold text-primary">#{rank}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChartOpen(true)}
          >
            <LineChartIcon className="h-6 w-6" />
          </Button>
        </div>
      </div>
      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Portfolio Performance</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="mb-4 text-center">
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
            <PortfolioChart data={chartData} timeRange={timeRange} />
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
