import { useState, useEffect } from "react";
import {  Loader2Icon } from "lucide-react"
import { usePortfolioStore } from "@/store/portfolio";

import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { TradeCallback,   } from "morpher-trading-sdk";
import { } from "morpher-trading-sdk";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useMarketStore } from "@/store/market";
import { Position } from "./Position";

export function ClosePosition() {
  const { 
    selectedCurrency, 
    setSelectedCurrency, 
    setSelectedCurrencyDetails,
    currencyList,
    closePercentage,
    setClosePercentage,
    selectedPosition,
    orderUpdate,
    setSelectedPosition,
    context
  } = usePortfolioStore();
  const { morpherTradeSDK,   marketData } = useMarketStore()

  const [tradeExecuting, setTradeExecuting] = useState(false);
  const [tradeError, setTradeError] = useState<string | undefined>(undefined);
  const account: any = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient:any = usePublicClient()

    const tradeComplete = (result: TradeCallback) => {
      if (result.result === 'error') {
        setTradeError(result.err || 'An error occurred while executing the trade.')
  
      }
  
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

    // let currencyDetails = currencyList?.[selectedCurrency || 'ETH']

    // let tradeAmountFormatted = 0n;

    // if (tradeAmount && Number(tradeAmount) > 0 && currencyDetails) {
    //     tradeAmountFormatted = BigInt(Math.round(Number(tradeAmount) * 10**(currencyDetails.decimals || 18)));
    // }



    let gaslessOverride: boolean | undefined = undefined;
    if (context?.clientFid === 309857) gaslessOverride = true;

    morpherTradeSDK.closePosition({ account, walletClient: walletClient as any, publicClient, market_id: selectedPosition?.market_id || '', closePercentage:closePercentage || 0, callback: tradeComplete, gaslessOverride })
    } catch (err: any) {
      console.error('Error executing trade:', err);
      setTradeExecuting(false);
      setTradeError(err.message || 'An error occurred while executing the trade.');
    }
 
  }



      const refreshPosition = async () => {
        if (account.address === undefined || selectedPosition?.id == undefined) {
          return;
        }
        let positions = await morpherTradeSDK.getPositions({
          eth_address: account.address,
          position_id: selectedPosition?.id
        });
        if (positions && positions.length > 0) {
          setSelectedPosition(positions[0]);
        } else {
          setSelectedPosition(undefined);
        }
      };
    
      useEffect(() => {
        if (orderUpdate && account.address && selectedPosition) {
          refreshPosition();
        }
      }, [account, orderUpdate]);
  

      
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
          Close Position
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          
        </div>
      </CardHeader>
      <CardContent>

        {marketData?.position_id && <Position closeButton={false} />}
         
        
        <div className="flex items-center justify-center text-2xl font-bold text-[var(--dark)]">
          {closePercentage} %
        </div>
        <Slider
          value={[closePercentage || 0]}
          onValueChange={(value) => setClosePercentage(value[0])}
          max={100}
          step={1}
          className="mt-4 mb-4"
        />
        <div id="percentageBreakdown" className="flex justify-between text-xs">
          {[0, 25, 50, 75, 100].map((percentage) => (
            <Button
              key={percentage}
              variant="outline"
              size="sm"
              onClick={() => setClosePercentage(percentage)}
              className="rounded-full"
            >
              {percentage}%
            </Button>
          ))}
        </div>
          <Button
        onClick={executeTrade}
        disabled={!closePercentage || Number(closePercentage) <= 0}
        className="w-full mt-8"
        variant={selectedPosition?.direction !== 'long' ? "secondary" : "default"}

      >
        {tradeExecuting &&
          <Loader2Icon className="animate-spin" />
        }
        <span className='text-white'>
          Close {selectedPosition?.symbol}
        </span>
        
      </Button>

            {tradeError && (
        <div className="text-red-500 text-sm mt-2">
          {tradeError}
        </div>
      )}
      </CardContent>
    </Card>
  )
}
