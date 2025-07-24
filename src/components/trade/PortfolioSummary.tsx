import * as React from "react";
import { usePortfolioStore } from "@/store/portfolio";
import { usdFormatter } from "morpher-trading-sdk";
import { Loader2Icon } from "lucide-react";

export function PortfolioSummary() {
  const { portfolio, loading, eth_address, leaderboard, positionValue, currencyList } = usePortfolioStore();

  const totalPortfolioValueUSD = React.useMemo(() => {
    if (!currencyList?.MPH?.usd_exchange_rate || !portfolio) return 0;

    const freeCashInMphWei = BigInt(portfolio.total_portfolio_value || '0');
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
      {rank && (
        <div className="text-right">
          <p className="text-sm font-semibold text-muted-foreground">Rank</p>
          <p className="text-xl font-bold text-primary">#{rank}</p>
        </div>
      )}
    </div>
  );
}
