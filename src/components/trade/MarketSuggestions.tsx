import * as React from "react";
import { useMarketStore } from "@/store/market";
import { TMarket } from "morpher-trading-sdk";
import { Card, CardContent } from "../ui/card";
import { Loader2Icon } from "lucide-react";

export function MarketSuggestions() {
  const { morpherTradeSDK, setSelectedMarketId, setMarketType, marketType } = useMarketStore();
  const [topMovers, setTopMovers] = React.useState<TMarket[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTopMovers = async () => {
      setLoading(true);
      try {
        const cryptoMarkets = await morpherTradeSDK.getMarketList({ type: 'crypto' });
        if (cryptoMarkets) {
          const sorted = Object.values(cryptoMarkets)
            .sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0))
            .slice(0, 3);
          setTopMovers(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch top movers:", error);
      } finally {
        setLoading(false);
      }
    };

    if (morpherTradeSDK.ready) {
        fetchTopMovers();
    }
  }, [morpherTradeSDK.ready]);

  const handleSelectMarket = (market: TMarket) => {
    // Ensure market type is 'crypto' before selecting market.
    if (marketType !== 'crypto') {
      setMarketType('crypto');
    }
    
    // Use a timeout to ensure the market list is updated in the selector component
    // before the selected market ID is set. This prevents a race condition.
    setTimeout(() => {
      setSelectedMarketId(market.market_id);
    }, 100);
    
  };

  if (loading) {
    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">Top Movers</h2>
            <div className="flex justify-center items-center h-[100px]">
                <Loader2Icon className="h-8 w-8 animate-spin" />
            </div>
      </div>
    );
  }
  
  if (topMovers.length === 0) {
      return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">Top Movers</h2>
      <div className="grid grid-cols-3 gap-2">
        {topMovers.map((market) => (
          <Card key={market.market_id} className="p-2 cursor-pointer hover:bg-accent" onClick={() => handleSelectMarket(market)}>
            <CardContent className="flex flex-col items-center justify-center p-1 text-center">
                <img
                    src={`data:image/svg+xml;base64,${market.logo_image}`}
                    alt={`${market.name} logo`}
                    className="h-8 w-8 rounded-lg mb-2"
                />
              <p className="font-semibold text-sm truncate">{market.symbol}</p>
              <div
                className={`flex items-center justify-center text-xs ${(market?.change_percent || 0) >= 0 ? "text-primary" : "text-secondary"}`}
              >
                {(market?.change_percent || 0) > 0 ? "+" : ""}
                {Number(market?.change_percent || 0).toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
