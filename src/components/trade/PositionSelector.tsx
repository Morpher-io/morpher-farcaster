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
import { tokenValueFormatter } from "../../../../morpher-trading-sdk/src/index";
import { TMarketType } from "../../../../morpher-trading-sdk/src/types"
import { TMarket, StrictOHLCArray, TPosition } from "../../../../morpher-trading-sdk/src/v2.router"
import { useAccount } from "wagmi"
import { MarketChart } from "./MarketChart";
import { useMarketStore } from "../../store/market";
import { Trade } from "./Trade";
import { Position } from "./Position";
import { PendingPosition } from "./PendingPosition";
import { usePortfolioStore } from "@/store/portfolio"

export function PositionSelector() {
  const {setPositionList, positionList,
    orderUpdate,
    tradeDirection,
    selectedPosition,
    setSelectedPosition,
    


  } = usePortfolioStore();

  const {morpherTradeSDK} = useMarketStore();
  const [open, setOpen] = React.useState(false)
  const [timeRange, setTimeRange] = React.useState('1D');
  const {

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

  
  const { address } = useAccount();
 

  const outputPosition = (position: TPosition, closeOverride?: number) => {
    return (
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <div>
            {position.logo_image && (
              <img
                src={`data:image/svg+xml;base64,${position.logo_image}`}
                alt={`${position.name} logo`}
                className="mr-4 ml--2 h-8 w-8 rounded-lg"
              />
            )}
          </div>
          <div
            id="marketName"
            className="flex flex-col max-w-[140px] w-[140px] overflow-hidden text-left"

          >
            <p className="font-semibold">{position?.symbol}</p>
            <p className="font-normal">{position?.name}</p>
          </div>
        </div>
        <div id="marketValue" className="flex flex-col text-right">
          <p className="text-lg font-bold">
             {tokenValueFormatter(Number(position.value || 0) / 10**18)} MPH
          </p>
          <div
            id="marketPercent"
            className={`flex items-center justify-end ${(Number(position?.total_return_percent || 0)) >= 0 ? "text-primary" : "text-secondary"}`}
          >
            {(Number(position?.total_return_percent || 0)) !== 0 && (
              <div
                className="mr-1 h-3 w-3 bg-[currentColor]"
                style={{
                  mask: `url(/src/assets/icons/${(Number(position?.total_return_percent || 0)) > 0 ? "increase" : "decrease"}.svg) no-repeat center / contain`,
                  WebkitMask: `url(/src/assets/icons/${(Number(position?.total_return_percent || 0)) > 0 ? "increase" : "decrease"}.svg) no-repeat center / contain`,
                }}
              />
            )}
            {(Number(position?.total_return_percent || 0)) > 0 ? "+" : ""}
            {Number(Number(position?.total_return_percent || 0) * 100).toFixed(2)} %
          </div>
        </div>
      </div>
    );
  };

  const selectPosition = (position_id: string) => {
    let position = positionList?.find(pos => pos.id === position_id)
    if (position) {
      setSelectedPosition(position)
      if (address) {
        setSelectedMarketId(position.market_id)
      }
      

    }

  }



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

  const fetchPositions = async () => {
    if (!address) {
      return
    }

    let positionList = await morpherTradeSDK.getPositions({eth_address: address})
    setPositionList(positionList)
  }

  React.useEffect(() => {
    if (morpherTradeSDK.ready && address) {
      fetchPositions()
    }
    
  }, [morpherTradeSDK.ready, address]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Select Market</CardTitle>
      </CardHeader>
      <CardContent>


        <Label className="mb-2" htmlFor="email">Pick a Position</Label>

        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-[60px]"
            >
              {selectedPosition ? outputPosition(selectedPosition) : <></>}

              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search market..." />
              <CommandList>
                <CommandEmpty>No market found.</CommandEmpty>
                <CommandGroup>
                  {positionList && Object.values(positionList).map((position) => (
                    <CommandItem
                      key={position.symbol}
                      value={position.id}
                      onSelect={(currentValue) => {
                        selectPosition(currentValue)
                        setOpen(false)
                      }}
                    >
                      {outputPosition(position)}
                      
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

      </CardContent>
    </Card>
  )
}
