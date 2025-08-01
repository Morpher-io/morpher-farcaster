import * as React from "react";
import { ChevronsUpDown, Loader2Icon, Search, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { tokenValueFormatter } from "morpher-trading-sdk";
import { TMarketType } from "morpher-trading-sdk";
import { TMarket } from "morpher-trading-sdk";
import { useMarketStore } from "../../store/market";
import { Input } from "../ui/input";
import { useTranslation } from "react-i18next";

export function MarketSelector() {
  const { t } = useTranslation();

  const { morpherTradeSDK } = useMarketStore();
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("");
  const [isMarketListLoading, setIsMarketListLoading] = React.useState(false);
  const [displayCategory, setDisplayCategory] = React.useState<
    TMarketType | "all"
  >("all");
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const {
    marketType,
    setMarketType,
    marketList,
    setMarketList,
    selectedMarketId,
    setSelectedMarketId,
    selectedMarket,
    livePrice,
    setSelectedMarket,
    marketListAll,
    setMarketListAll,
  } = useMarketStore();


  React.useEffect(() => {
    if (marketType && marketType !== displayCategory) {
      setDisplayCategory(marketType);
    } else if (!marketType && displayCategory !== "all") {
      setDisplayCategory("all");
    }
  }, [marketType, displayCategory]);

  const fetchMarketsAll = async () => {
    setIsMarketListLoading(true);
    console.log("Fetching all market categories.");
    const marketTypes: TMarketType[] = [
      "crypto",
      "stock",
      "forex",
      "index",
      "commodity",
    ];
    try {
      const allMarketLists = await Promise.all(
        marketTypes.map((type) => morpherTradeSDK.getMarketList({ type }))
      );
      const mergedMarkets = allMarketLists.reduce((acc, current) => {
        return { ...acc, ...current };
      }, {});
      setMarketListAll(mergedMarkets);
    } catch (error) {
      console.error("Failed to fetch all markets:", error);
      setMarketListAll({});
    }

    setIsMarketListLoading(false);
  };
  React.useEffect(() => {
    if (!marketListAll) {
      fetchMarketsAll();
    }
  }, [marketListAll]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        console.log('inputRef', inputRef)
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, marketType]);

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

  // const formatMarketCap = (num: number | string | undefined | null): string => {
  //   if (num === null || num === undefined) return "N/A";
  //   const number = Number(num);
  //   if (isNaN(number) || number === 0) return "N/A";

  //   const tiers = [
  //     { value: 1e12, symbol: "T" },
  //     { value: 1e9, symbol: "B" },
  //     { value: 1e6, symbol: "M" },
  //     { value: 1e3, symbol: "k" },
  //   ];

  //   const tier = tiers.find((t) => number >= t.value);

  //   if (tier) {
  //     return `$${(number / tier.value).toFixed(2)}${tier.symbol}`;
  //   }

  //   return `$${number.toFixed(2)}`;
  // };

  const outputMarket = (market: TMarket, closeOverride?: number) => {
    const StatusBadge = ({ status }: { status: string }) => {
      const statusColors: { [key: string]: string } = {
        open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        pre: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        after:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        "trade halt":
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
      return (
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full capitalize",
            statusColors[status.toLowerCase()] ||
              "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          )}
        >
          {status}
        </span>
      );
    };

    return (
      <div className="flex w-full items-start justify-between py-1">
        <div className="flex items-center gap-3">
          {market.logo_image && (
            <img
              src={`data:image/svg+xml;base64,${market.logo_image}`}
              alt={`${market.name} logo`}
              className="h-10 w-10 rounded-lg mt-1"
            />
          )}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-base">{market?.symbol}</p>
              {market.status && <StatusBadge status={market.status} />}
              {market.is_paused && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                  Paused
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              {market?.name}
            </p>
          </div>
        </div>

        <div className="flex flex-col text-right gap-1 items-end">
          <p className="text-base font-bold">
            $ {tokenValueFormatter(closeOverride || market?.close)}
          </p>
          <div className="flex items-center gap-1 text-xs">
            <span
              className={
                (market?.change_percent || 0) >= 0
                  ? "text-primary"
                  : "text-secondary"
              }
            >
              {(market?.change_percent || 0) > 0 ? "+" : ""}
              {Number(market?.change_percent || 0).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  React.useEffect(() => {
    if (selectedMarketId && marketListAll) {
      setSelectedMarket(marketListAll[selectedMarketId]);
    } else {
      setSelectedMarket(undefined);
    }
  }, [selectedMarketId, marketListAll, setSelectedMarket]);

  const fetchMarkets = async (category: TMarketType | "all") => {
    setMarketList(undefined);

    let merkets: TMarket[] = [];
    if (category === "all") {
      Object.values(marketListAll as any).forEach((market: any) => {
        merkets.push(market);
      });
    } else {
      Object.values(marketListAll as any).forEach((market: any) => {
        if (market.type == category) {
          merkets.push(market);
        }
      });
    }

    if (filter) {
      let merkets_symbol = merkets.filter((mark) =>
        mark.symbol?.toUpperCase().includes(filter.toUpperCase())
      );
      let merkets_name = merkets.filter(
        (mark) =>
          mark.name?.toUpperCase().includes(filter.toUpperCase()) &&
          !mark.symbol?.toUpperCase().includes(filter.toUpperCase())
      );

      merkets = merkets_symbol.concat(merkets_name);
    }

    merkets = merkets.sort((a, b) => (a.symbol < b.symbol ? -1 : 1));

    setMarketList(merkets);
  };

  const handleSearch = useDebouncedCallback((term) => {
    setFilter(term);
  }, 200);

  React.useEffect(() => {
    if (morpherTradeSDK.ready && marketListAll) {
      fetchMarkets(displayCategory);
    }
  }, [displayCategory, morpherTradeSDK.ready, marketListAll, filter]);

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
              outputMarket(
                selectedMarket,
                livePrice ? livePrice[selectedMarket.market_id] : undefined
              )
            ) : (
              <span className="text-muted-foreground flex items-center">
                <Search className="mr-2 h-4 w-4" />
                {t("SEARCH_MARKETS")}...
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-90" align="center">

          <Command
            className="w-full"
            filter={(value, search) => {
              try {
                const market = JSON.parse(value) as TMarket;
                if (
                  market.name.toLowerCase().includes(search.toLowerCase()) ||
                  market.symbol.toLowerCase().includes(search.toLowerCase())
                ) {
                  return 1;
                }
              } catch (e) {
                // ignore
              }
              return 0;
            }}
          >
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
                  ["all", "stock", "forex", "index", "commodity", "crypto"] as (
                    | TMarketType
                    | "all"
                  )[]
                ).map((type) => {
                  const iconMap: Partial<Record<TMarketType, string>> = {
                    stock: "/src/assets/types/stock.svg",
                    forex: "/src/assets/types/forex.svg",
                    index: "/src/assets/types/index.svg",
                    commodity: "/src/assets/types/commodity.svg",
                    crypto: "/src/assets/types/crypto.svg",
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
                          className="mr-0 h-4 w-4"
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

            <div
              data-slot="command-input-wrapper"
              className="flex h-9 items-center gap-2 border-b px-3"
            >
              <SearchIcon className="size-4 shrink-0 opacity-50" />
              <Input
                ref={inputRef}
                data-slot="command-input"
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('SEARCH_MARKETS') + "..."}
                className={cn(
                  "placeholder:text-muted-foreground flex h-10 w-full rounded-0 bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50 border-0 outline-0 border-transparent  !outline-none focus-visible:shadow-none  focus-visible:ring-0 focus-visible:ring-offset-0"
                )}
              />
            </div>

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
                  marketList.map((market, index) => (
                    <>
                      {index < 80 && (
                        <CommandItem
                          key={market.market_id}
                          value={JSON.stringify(market)}
                          onSelect={(currentValue) => {
                            const market: TMarket = JSON.parse(currentValue);
                            setSelectedMarketId(
                              market.market_id === selectedMarketId
                                ? ""
                                : market.market_id
                            );
                            setOpen(false);
                          }}
                          className="py-3"
                        >
                          {outputMarket(market)}
                        </CommandItem>
                      )}
                    </>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
