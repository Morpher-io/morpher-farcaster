import { useState, useEffect, useMemo } from "react";
import { ChevronsUpDown } from "lucide-react"
import { usePortfolioStore } from "@/store/portfolio";
import { sdk } from "@farcaster/frame-sdk";

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { MorpherTradeSDK, tokenValueFormatter, usdFormatter  } from "morpher-trading-sdk";
import { TCurrency, TCurrencyDetails } from "morpher-trading-sdk";
import { useAccount, usePublicClient } from "wagmi";
import { PublicClient } from "viem";
import { useMarketStore } from "@/store/market";

export function TokenSelector() {
  const [open, setOpen] = useState(false)
  const { 
    tradeAmount, 
    setTradeAmount, 
    selectedCurrency, 
    setSelectedCurrency, 
    selectedCurrencyDetails, 
    setSelectedCurrencyDetails,
    currencyList,
    setCurrencyList
  } = usePortfolioStore();
  const { address } = useAccount();

  const publicClient = usePublicClient()

  const { morpherTradeSDK } = useMarketStore()
  

  const fetchCurrencyList = async () => {
    if (address && morpherTradeSDK.tokenAddress && morpherTradeSDK.usdcAddress) {
      const fetchedCurrencyList = await morpherTradeSDK.getCurrencyList({ address, publicClient, tokenAddresses: [{symbol: 'MPH', address: morpherTradeSDK.tokenAddress as `0x${string}`}, {symbol: 'USDC', address: morpherTradeSDK.usdcAddress as `0x${string}` } ]  })
      setCurrencyList(fetchedCurrencyList);
      sdk.actions.ready();
      
    }
  }




      
  useEffect(() => {
    if (selectedCurrency && currencyList) {
      setSelectedCurrencyDetails(currencyList[selectedCurrency])
    }

  }, [selectedCurrency, currencyList, setSelectedCurrencyDetails])
    
  useEffect(() => {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">
          Trade
        </CardTitle>
      
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-2xl font-bold">
          <Input type="number" placeholder="0.00" className="border-0 h-auto flex-1 p-2 text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 bg-white" value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)} />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" role="combobox" aria-expanded={open} className="w-auto justify-between text-lg font-bold  p-2">
                {selectedCurrency && (
                  <img
                    src={`/src/assets/icons/${selectedCurrency}.svg`}
                    alt={`${selectedCurrency} logo`}
                    className="mr-0 h-6 w-6"
                  />
                )}
                {selectedCurrency}
                <ChevronsUpDown className="ml-0 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Command>
                {/* <CommandInput placeholder="Search token..." /> */}
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
        <div className="text-sm flex justify-between mt-2">
          <p>$ {usdFormatter(selectedCurrencyDetails?.usd)}</p>
          <p id="tokenAmount" className="cursor-pointer" onClick={() => setTradeAmount(tokenValueFormatter(Number(selectedCurrencyDetails?.balance || 0) / (10 ** (selectedCurrencyDetails?.decimals || 1))))}>{tokenValueFormatter(Number(selectedCurrencyDetails?.balance || 0) / (10** (selectedCurrencyDetails?.decimals || 1)))} {selectedCurrencyDetails?.symbol.toUpperCase()}</p>
          
        </div>
      </CardContent>
    </Card>
  )
}
