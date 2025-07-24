import * as React from "react"
import { ChevronsUpDown, Loader2Icon, Search } from "lucide-react"
import { Label } from "@/components/ui/label"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { tokenValueFormatter } from "morpher-trading-sdk";
import { TMarketType } from "morpher-trading-sdk"
import { TMarket, StrictOHLCArray } from "morpher-trading-sdk"
import { useAccount } from "wagmi"
import { MarketChart } from "./MarketChart";
import { useMarketStore } from "../../store/market";
import { Trade } from "./Trade";
import { Position } from "./Position";
import { PendingPosition } from "./PendingPosition";
import { usePortfolioStore } from "@/store/portfolio";
import { TokenSelector } from "./TokenSelector";

export function MarketSelector() {
  
  const {morpherTradeSDK} = useMarketStore();
  const [open, setOpen] = React.useState(false)
  const [timeRange, setTimeRange] = React.useState('1D');
  const [isMarketDataLoading, setIsMarketDataLoading] = React.useState(false);
  const [isMarketListLoading, setIsMarketListLoading] = React.useState(false);
  const [displayCategory, setDisplayCategory] = React.useState<TMarketType | 'all'>('all');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const {
    marketType,
    setMarketType,
    marketList,
    setMarketList,
    selectedMarketId,
    setSelectedMarketId,
    selectedMarket,
    selectedMarketClose,
    setSelectedMarket,
    marketData,
    setMarketData,
  } = useMarketStore();

  const {
    orderUpdate,
    tradeDirection,
    setSelectedPosition
  } = usePortfolioStore();
  
  const { address } = useAccount();

  React.useEffect(() => {
    if (marketType && marketType !== displayCategory) {
      setDisplayCategory(marketType);
    }
  }, [marketType]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);
  
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const hasDraggedRef = React.useRef(false);
  const [showScrollFades, setShowScrollFades] = React.useState({
    left: false,
    right: false,
  });

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
  }, [checkFades, marketList]);



  const chartData = React.useMemo(() => {
    if (!marketData) return undefined;

    const now = new Date();
    const filterData = (data: StrictOHLCArray[] | undefined, days: number) => {
      if (!data) return undefined;
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - days);
      const cutoffTimestamp = cutoff.getTime() / 1000;
      return data.filter(d => d[0] >= cutoffTimestamp);
    };

    const filterDataMonths = (data: StrictOHLCArray[] | undefined, months: number) => {
      if (!data) return undefined;
      const cutoff = new Date();
      cutoff.setMonth(now.getMonth() - months);
      const cutoffTimestamp = cutoff.getTime() ;
      return data.filter(d => d[0] >= cutoffTimestamp);
    };

    switch (timeRange) {
      case '1D':
        return marketData.data_minutely;
      case '1W':
        return filterData(marketData.data_hourly, 7);
      case '1M':
        return filterDataMonths(marketData.data_daily, 1);
      case '3M':
        return filterDataMonths(marketData.data_daily, 3);
      case '6M':
        return filterDataMonths(marketData.data_daily, 6);
      case '1Y':
        return filterDataMonths(marketData.data_daily, 12);
      default:
        return marketData.data_minutely;
    }
  }, [marketData, timeRange]);

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

  const outputMarket = (market: TMarket, closeOverride?: number) => {
    return (
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <div>
            {market.logo_image && (
              <img
                src={`data:image/svg+xml;base64,${market.logo_image}`}
                alt={`${market.name} logo`}
                className="mr-4 ml--2 h-8 w-8 rounded-lg"
              />
            )}
          </div>
          <div
            id="marketName"
            className="flex flex-col max-w-[130px] w-[130px] overflow-hidden text-left"
          >
            <p className="font-semibold">{market?.symbol}</p>
            <p className="font-normal truncate">{market?.name}</p>
          </div>
        </div>
        <div id="marketValue" className="flex flex-col text-right">
          <p className="text-base font-bold">
            $ {tokenValueFormatter(closeOverride || market?.close)}
          </p>
          <div
            id="marketPercent"
            className={`flex items-center justify-end ${(market?.change_percent || 0) >= 0 ? "text-primary" : "text-secondary"}`}
          >
            {(market?.change_percent || 0) !== 0 && (
              <div
                className="mr-1 h-3 w-3 bg-[currentColor]"
                style={{
                  mask: `url(/src/assets/icons/${(market?.change_percent || 0) > 0 ? "increase" : "decrease"}.svg) no-repeat center / contain`,
                  WebkitMask: `url(/src/assets/icons/${(market?.change_percent || 0) > 0 ? "increase" : "decrease"}.svg) no-repeat center / contain`,
                }}
              />
            )}
            {(market?.change_percent || 0) > 0 ? "+" : ""}
            {Number(market?.change_percent || 0).toFixed(2)} %
          </div>
        </div>
      </div>
    );
  };

  const account = useAccount();


    const fetchMarketData = async ({eth_address, market_id}: {eth_address: `0x${string}`, market_id: string}) => {
      setIsMarketDataLoading(true);
      const sdkMarketData = await morpherTradeSDK.getMarketData({eth_address, market_id})
        setMarketData(sdkMarketData);
      setIsMarketDataLoading(false);
    }

  React.useEffect(() => {
    if (address && selectedMarketId) {
      fetchMarketData({eth_address: address, market_id: selectedMarketId})
    } else {
      setMarketData(undefined);
    }
    
  }, [address, selectedMarketId, orderUpdate]);

  React.useEffect(() => {
    if (selectedMarketId && marketList) {
      setSelectedMarket(marketList[selectedMarketId])
    } else {
      setSelectedMarket(undefined)
    }
  }, [selectedMarketId, marketList, setSelectedMarket])

  const fetchMarkets = async (category: TMarketType | "all") => {
    setIsMarketListLoading(true);
    setMarketList(undefined);
    const params = category === "all" ? {} : { type: category };
    const marketList = await morpherTradeSDK.getMarketList(params);
    setMarketList(marketList);
    setIsMarketListLoading(false);
  };

  React.useEffect(() => {
    if (morpherTradeSDK.ready) {
      fetchMarkets(displayCategory);
    }
  }, [displayCategory, morpherTradeSDK.ready]);

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


  return (
    <div className="flex flex-col gap-4">
      <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-[60px]"
            >
              {selectedMarket ? (
                outputMarket(selectedMarket, selectedMarketClose)
              ) : (
                <span className="text-muted-foreground flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  Search Markets...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-90" align="center">
            <Command className="w-full">
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
                  className={`flex select-none gap-1 overflow-x-auto p-2 no-scrollbar ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                >
                  {(
                    ["all", "stock", "forex", "index", "commodity", "crypto"] as (TMarketType | "all")[]
                  ).map((type) => {
                    const iconMap: Partial<Record<TMarketType, string>> = {
                      stock: "/src/assets/types/stock.svg",
                      forex: "/src/assets/types/forex.svg",
                      index: "/src/assets/types/index.svg",
                      commodity: "/src/assets/types/commodity.svg",
                    };
                    const iconSrc = iconMap[type as TMarketType];

                    return (
                      <Button
                        key={type}
                        variant={displayCategory === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (hasDraggedRef.current) return;
                          setDisplayCategory(type);
                          if (type !== "all") {
                            setMarketType(type as TMarketType);
                          } else {
                            setMarketType(undefined);
                          }
                        }}
                        className="capitalize rounded-full flex-shrink-0"
                      >
                        {iconSrc && (
                          <img
                            src={iconSrc}
                            alt={`${type} icon`}
                            className="mr-2 h-4 w-4"
                          />
                        )}
                        <span className="font-normal">{type}</span>
                      </Button>
                    );
                  })}
                </div>
                {showScrollFades.right && (
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
                )}
              </div>
              <CommandInput ref={inputRef} placeholder="Search market..." />
              <CommandList>
                <CommandEmpty>
                  {isMarketListLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    "No market found."
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {!isMarketListLoading &&
                    marketList &&
                    Object.values(marketList).map((market) => (
                      <CommandItem
                        key={market.symbol}
                        value={market.market_id}
                        onSelect={(currentValue) => {
                          setSelectedMarketId(
                            currentValue === selectedMarketId ? "" : currentValue
                          );
                          setOpen(false);
                        }}
                      >
                        {outputMarket(market)}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {isMarketDataLoading ? (
          <div className="flex justify-center items-center h-[200px] w-full">
            <Loader2Icon className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          marketData && (
            <div className="flex flex-col gap-4">
              <MarketChart data={chartData} timeRange={timeRange} />
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
  )
}
