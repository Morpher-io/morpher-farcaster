import * as React from "react";
import { useMarketStore } from "@/store/market";
import { TMarket, TMarketType } from "morpher-trading-sdk";
import { Card, CardContent } from "../ui/card";
import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function MarketSuggestions() {
  const { morpherTradeSDK, setSelectedMarketId, setMarketType, trendingMarkets, getTrendingMarkets, setSelectedMarket } = useMarketStore();
  const { t } = useTranslation();

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

  const statusOrder = (market:any) => {
    if (market.status === 'open') 
      return 1
    else if (market.status === 'pre') 
      return 2
    else
      return 3
  }


  const sortedTrendingMarkets = React.useMemo(() => {
    if (!trendingMarkets) return [];

    return Object.values(trendingMarkets)
      .sort((a, b) => statusOrder(a) - statusOrder(b) ||(Number(b.change_percent || 0)) - (Number(a.change_percent || 0)) );

      //
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
            <h2 className="text-lg font-bold">{t('TRENDING')}</h2>
            <div className="flex justify-center items-center h-[100px]">
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
      <h2 className="text-lg font-bold">{t('TRENDING')}</h2>
      <div className="relative">
        {showScrollFades.left && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        )}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex select-none gap-2 overflow-x-auto p-2 no-scrollbar ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          {sortedTrendingMarkets.map((market: any) => (
            <Card key={market.market_id} className="p-2 cursor-pointer hover:bg-accent flex-shrink-0 w-32 border-1 border-[var(--primary)]" onClick={() => handleSelectMarket(market)}>
              <CardContent className="flex flex-col items-center justify-center p-1 text-center">
                  <img
                      src={`data:image/svg+xml;base64,${market.logo_image}`}
                      alt={`${market.name} logo`}
                      className="h-8 w-8 rounded-lg mb-2"
                  />
                  <div className="text-[var(--dark-red)] bg-[var(--secondary-light)]"></div>
                  <div className="text-[var(--dark-red)]  bg-[var(--primary-light)] "></div>
                <p className="font-semibold  text-sm truncate">{market.symbol}</p>
                <div
                  className={`flex p-1 bg-[var(${(market?.change_percent || 0) >= 0 ? "--primary-light" : "--secondary-light"})] items-center justify-center font-semibold rounded-full text-xs text-[var(${(market?.change_percent || 0) >= 0 ? "--dark" : "--dark-red"})] `}
                >
                  {(market?.change_percent || 0) > 0 ? "+" : ""}
                  {Number(market?.change_percent || 0).toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {showScrollFades.right && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        )}
      </div>
    </div>
  );
}
