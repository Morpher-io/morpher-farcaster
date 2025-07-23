import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
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
  
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const hasDraggedRef = React.useRef(false);



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
            className="flex flex-col max-w-[150px] w-[150px] overflow-hidden text-left"
          >
            <p className="font-semibold">{market?.symbol}</p>
            <p className="font-normal">{market?.name}</p>
          </div>
        </div>
        <div id="marketValue" className="flex flex-col text-right">
          <p className="text-lg font-bold">
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
      const sdkMarketData = await morpherTradeSDK.getMarketData({eth_address, market_id})
        setMarketData(sdkMarketData);

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

  const fetchMarkets = async ({type}: {type: TMarketType}) => {
    let marketList = await morpherTradeSDK.getMarketList({type})
    setMarketList(marketList)
  }

  React.useEffect(() => {
    if (marketType) {
      fetchMarkets({ type: marketType });
    }
  }, [marketType]);

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
    <Card className="pb-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Select Market</CardTitle>
      </CardHeader>
      <CardContent>

        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`mb-4 flex select-none gap-1 overflow-x-auto pb-2 no-scrollbar ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          
          {(["stock", "forex", "index", "commodity"] as TMarketType[]).map((type) => (
            <Button
              key={type}
              variant={marketType === type ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (hasDraggedRef.current) return;
                setMarketType(type);
              }}
              className="capitalize rounded-full"
            >
              <img
                src={`/src/assets/types/${type}.svg`}
                alt={`${type} icon`}
                className="mr-0 h-4 w-4"
              />
              <span className={`font-normal ${marketType === type ? "text-white" : "text-black"}`}>{type}</span>
              
            </Button>
          ))}
        
          
        </div>
        <Label className="mb-2 mt-6" htmlFor="email">Pick a {marketType} to invest in</Label>

        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-[60px]"
            >
              {selectedMarket ? outputMarket(selectedMarket, selectedMarketClose) : <></>}

              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search market..." />
              <CommandList>
                <CommandEmpty>No market found.</CommandEmpty>
                <CommandGroup>
                  {marketList && Object.values(marketList).map((market) => (
                    <CommandItem
                      key={market.symbol}
                      value={market.market_id}
                      onSelect={(currentValue) => {
                        setSelectedMarketId(currentValue === selectedMarketId ? "" : currentValue)
                        setOpen(false)
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
        {marketData && (
            <div>
              <MarketChart data={chartData} timeRange={timeRange}/>
              <div className="flex justify-center gap-1 mt-2 mb-4">
                {['1D', '1W', '1M', '3M', '6M', '1Y'].map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'outline' : 'ghost'}
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
                  {marketData.position_id && <>
                    <Position />
                  </>}
                  <Trade />
                </>
              )}
            </div>
          )
        }
      </CardContent>
    </Card>
  )
}
