import * as React from "react";
import { useMarketStore } from "@/store/market";
import { TMarket, TMarketType } from "morpher-trading-sdk";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

export function MarketSuggestions() {
  const {
    morpherTradeSDK,
    setSelectedMarketId,
    setMarketType,
    trendingMarkets,
    getTrendingMarkets,
    setSelectedMarket,
  } = useMarketStore();
  const t = useTranslations();

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const hasDraggedRef = React.useRef(false);
  const [showScrollFades, setShowScrollFades] = React.useState({
    left: false,
    right: false,
  });

  React.useEffect(() => {
    if (morpherTradeSDK.ready) {
      if (!trendingMarkets) {
        getTrendingMarkets();
      }
    }
  }, [morpherTradeSDK.ready, getTrendingMarkets, trendingMarkets]);

  const loading = trendingMarkets === undefined;

  const sortedTrendingMarkets = React.useMemo(() => {
    if (!trendingMarkets) return [];
    return Object.values(trendingMarkets).sort(
      (a, b) => Number(b.change_percent || 0) - Number(a.change_percent || 0),
    );
  }, [trendingMarkets]);

  const checkFades = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const hasOverflow = scrollWidth > clientWidth;
      setShowScrollFades({
        left: hasOverflow && scrollLeft > 1,
        right: hasOverflow && scrollLeft < scrollWidth - clientWidth - 1,
      });
    }
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkFades();

      const handleEvents = () => checkFades();
      el.addEventListener("scroll", handleEvents);
      window.addEventListener("resize", handleEvents);

      const observer = new MutationObserver(handleEvents);
      observer.observe(el, { childList: true, subtree: true });

      return () => {
        el.removeEventListener("scroll", handleEvents);
        window.removeEventListener("resize", handleEvents);
        observer.disconnect();
      };
    }
  }, [checkFades, sortedTrendingMarkets]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      setIsDragging(true);
      hasDraggedRef.current = false;
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    hasDraggedRef.current = true;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // multiplier for scroll speed
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    checkFades();
  };

  const handleSelectMarket = (market: TMarket) => {
    if (market.type) {
      setMarketType(market.type as TMarketType);
    }
    setSelectedMarket(market);
    setSelectedMarketId(market.market_id);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">{t("TRENDING")}</h2>
        <div className="flex h-[100px] items-center justify-center">
          <Loader2Icon className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (sortedTrendingMarkets.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">{t("TRENDING")}</h2>
      <div className="relative">
        {showScrollFades.left && (
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
        )}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`no-scrollbar flex gap-2 overflow-x-auto p-2 select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          {sortedTrendingMarkets.map((market: any) => (
            <Card
              key={market.market_id}
              className="hover:bg-accent w-32 flex-shrink-0 cursor-pointer p-2"
              onClick={() => handleSelectMarket(market)}
            >
              <CardContent className="flex flex-col items-center justify-center p-1 text-center">
                <img
                  src={`data:image/svg+xml;base64,${market.logo_image}`}
                  alt={`${market.name} logo`}
                  className="mb-2 h-8 w-8 rounded-lg"
                />
                <div className="bg-[var(--secondary-light)] text-[var(--dark-red)]"></div>
                <div className="bg-[var(--primary-light)] text-[var(--dark-red)]"></div>
                <p className="truncate text-sm font-semibold">
                  {market.symbol}
                </p>
                <div
                  className={`flex p-1 bg-[var(${(market?.change_percent || 0) >= 0 ? "--primary-light" : "--secondary-light"})] items-center justify-center rounded-full text-xs font-semibold text-[var(${(market?.change_percent || 0) >= 0 ? "--dark" : "--dark-red"})] `}
                >
                  {(market?.change_percent || 0) > 0 ? "+" : ""}
                  {Number(market?.change_percent || 0).toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {showScrollFades.right && (
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />
        )}
      </div>
    </div>
  );
}
