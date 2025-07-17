import * as React from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { usePublicClient, useWalletClient, useAccount } from "wagmi"
import { useMarketStore } from "@/store/market"
import { usePortfolioStore } from "@/store/portfolio"
import { Loader2Icon } from "lucide-react"
import  { TradeCallback } from "../../../../morpher-trading-sdk/src"
import { WalletClient } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"



export function Trade() {
  const [tradeExecuting, setTradeExecuting] = React.useState(false);
  const [tradeError, setTradeError] = React.useState<string | undefined>(undefined);
  
  const { selectedMarketId, morpherTradeSDK, selectedMarket, tradeType, setTradeType, leverage, setLeverage, marketData } = useMarketStore();
  const {
      tradeAmount,
      selectedCurrency,
      currencyList,
      setTradeComplete
      
  } = usePortfolioStore()

  const account: any = useAccount();
  const { data: walletClient, isError, isLoading } = useWalletClient();
  const publicClient:any = usePublicClient()

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
        {tradeExecuting &&
          <Loader2Icon className="animate-spin" />
        }
        <span className='text-white'>
          

          Trade {selectedMarket?.symbol || selectedMarketId} {tradeType}
        </span>
        
      </Button>
      {(!tradeAmount || Number(tradeAmount) <= 0) && (
        <p className="text-[var(--info)] flex justify-center cursor-pointer mt-3" onClick={()=> {
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
