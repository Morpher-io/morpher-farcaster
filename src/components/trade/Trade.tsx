import * as React from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { usePublicClient, useWalletClient, useAccount } from "wagmi"
import { useMarketStore } from "@/store/market"
import { usePortfolioStore } from "@/store/portfolio"
import { ChevronsUpDown, Loader2Icon } from "lucide-react"
import  { TradeCallback, TCurrency, tokenValueFormatter, usdFormatter } from "morpher-trading-sdk"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandList, CommandItem } from "../ui/command"
import { sdk } from "@farcaster/frame-sdk"

export function Trade() {
  const [open, setOpen] = React.useState(false)
  const [tradeExecuting, setTradeExecuting] = React.useState(false);
  const [tradeError, setTradeError] = React.useState<string | undefined>(undefined);
  
  const { selectedMarketId, morpherTradeSDK, selectedMarket, tradeType, setTradeType, leverage, setLeverage, marketData } = useMarketStore();
  const {
      tradeAmount,
      setTradeAmount,
      selectedCurrency,
      setSelectedCurrency,
      selectedCurrencyDetails, 
      setSelectedCurrencyDetails,
      currencyList,
      setCurrencyList,
      setTradeComplete
  } = usePortfolioStore()

  const account: any = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient:any = usePublicClient()
    
  React.useEffect(() => {
    if (selectedCurrency && currencyList) {
      setSelectedCurrencyDetails(currencyList[selectedCurrency])
    }
  }, [selectedCurrency, currencyList, setSelectedCurrencyDetails])
    
  React.useEffect(() => {
    if (currencyList) {
      let currencyWithHighestUsd = currencyList.ETH
      if ((currencyList.MPH?.usd || 0) > (currencyWithHighestUsd?.usd  || 0)) {
        currencyWithHighestUsd = currencyList.MPH
      }

      if ((currencyList.USDC?.usd || 0) > (currencyWithHighestUsd?.usd  || 0)) {
        currencyWithHighestUsd = currencyList.USDC
      }

      if (currencyWithHighestUsd) {
        setSelectedCurrency(currencyWithHighestUsd.symbol);
      }
    }
  }, [currencyList, setSelectedCurrency]);


  const tradeComplete = (result: TradeCallback) => {
    if (result.result === 'error') {
      setTradeError(result.err || 'An error occurred while executing the trade.')
      return
    }

    console.log('tradeComplete', result)

    setTradeComplete(true);
    setTimeout(() => {
      setTradeExecuting(false)
    }, 2000)
  }
  
  const executeTrade = () => {
    try {
      setTradeError(undefined)
      if (tradeExecuting) {
        return
      }
      setTradeExecuting(true)

      let currencyDetails = currencyList?.[selectedCurrency || 'ETH']

      let tradeAmountFormatted = 0n;
      if (tradeAmount && Number(tradeAmount) > 0 && currencyDetails) {
          tradeAmountFormatted = BigInt(Math.round(Number(tradeAmount) * 10**(currencyDetails.decimals || 18)));
      }
      
      morpherTradeSDK.executeTrade({ account, walletClient: walletClient as any, leverage: leverage[0] || 1, direction: tradeType, publicClient, market_id: selectedMarketId || '', currency: selectedCurrency || 'ETH', tradeAmount:tradeAmountFormatted, callback: tradeComplete })
    } catch (err: any) {
      console.error('Error executing trade:', err);
      setTradeExecuting(false);
      setTradeError(err.message || 'An error occurred while executing the trade.');
    }
  }

  return (
    <Card className="mb-4 mt-4 bg-white">
      {marketData?.position_id && (
        <CardHeader>
          <CardTitle>Open New Position</CardTitle>
        </CardHeader>
      )}
      
      <CardContent>
        <div className="flex items-center text-xl font-bold">
          <Input 
            type="test" 
            placeholder="0.00" 
            className="border-0 rounded-0 h-auto flex-1 p-0 text-xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 round-sm bg-white  " 
            value={tradeAmount} 
            onChange={(e) => setTradeAmount(e.target.value)} 
          />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" role="combobox" aria-expanded={open} className="w-auto justify-between text-lg font-bold p-2">
                {selectedCurrency && (
                  <img
                    src={`/src/assets/icons/${selectedCurrency}.svg`}
                    alt={`${selectedCurrency} logo`}
                    className="mr-0 h-6 w-6"
                  />
                )}
                {selectedCurrency}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Command>
                <CommandList>
                  <CommandEmpty>No token found.</CommandEmpty>
                  <CommandGroup>
                    {currencyList && Object.entries(currencyList).map(([currency, details]) => (
                      <CommandItem
                        key={currency}
                        value={currency}
                        onSelect={(currentValue) => {
                          setSelectedCurrency(currentValue.toUpperCase() as TCurrency)
                          setOpen(false)
                        }}
                      >
                        <div className="flex items-center">
                          <img
                            src={`/src/assets/icons/${currency}.svg`}
                            alt={`${currency} logo`}
                            className="mr-2 h-4 w-4"
                          />
                          {currency}
                        </div>
                        <div className="ml-auto text-right text-sm">
                          <div>{(Number(details.balance || 0) / (10 ** (details.decimals || 1))).toFixed(4)}</div>
                          <div className="text-sm ">${(details.usd || 0).toFixed(2)}</div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="text-sm flex justify-between mt-1">
          <p>$ {usdFormatter(selectedCurrencyDetails?.usd)}</p>
          <p id="tokenAmount" className="cursor-pointer" onClick={() => setTradeAmount(tokenValueFormatter(Number(selectedCurrencyDetails?.balance || 0) / (10 ** (selectedCurrencyDetails?.decimals || 1))))}>
            {tokenValueFormatter(Number(selectedCurrencyDetails?.balance || 0) / (10** (selectedCurrencyDetails?.decimals || 1)))} {selectedCurrencyDetails?.symbol.toUpperCase()}
          </p>
        </div>

        <div className="my-4 h-px bg-gray-200" />

        <div className="flex items-center justify-between mb-2">
          <Label>Trade Type</Label>
          <ToggleGroup 
            type="single" 
            defaultValue="long" 
            className="w-[100px] grid grid-cols-2 border rounded-lg"
            onValueChange={(value: 'long' | 'short') => {
              if (value) setTradeType(value)
            }}
          >
            <ToggleGroupItem value="long" aria-label="Toggle long" className="data-[state=on]:bg-primary data-[state=on]:text-white">
              Long
            </ToggleGroupItem>
            <ToggleGroupItem value="short" aria-label="Toggle short" className="data-[state=on]:bg-secondary data-[state=on]:text-white">
              Short
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div>
          <div className="flex justify-between">
            <Label>Leverage</Label>
            <span>{leverage[0]}x</span>
          </div>
          <Slider
            defaultValue={[1]}
            min={1}
            max={10}
            step={0.2}
            onValueChange={setLeverage}
            className="mt-4 mb-6"
          />
        </div>
        <Button
          onClick={executeTrade}
          disabled={!tradeAmount || Number(tradeAmount) <= 0}
          className="w-full"
          variant={tradeType === 'long' ? "default" : "secondary"}
        >
          {tradeExecuting && <Loader2Icon className="animate-spin mr-2" />}
          <span className='text-white'>
            Trade {selectedMarket?.symbol || selectedMarketId} {tradeType}
          </span>
        </Button>
        {(!tradeAmount || Number(tradeAmount) <= 0) && (
          <p className="text-[var(--info)] flex justify-center items-center cursor-pointer mt-3" onClick={()=> {
            window.scrollTo(0, 0)
          }}>
            <img
              className="mr-2 w-5"
              src={`/src/assets/icons/info.svg`}
              alt={`Info Icon`}
            />
            Enter amount to trade
          </p>
        )}
        {tradeError && (
          <div className="text-red-500 text-sm mt-2">
            {tradeError}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
