import * as React from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { usePublicClient, useWalletClient, useAccount } from "wagmi"
import { useMarketStore } from "@/store/market"
import { usePortfolioStore } from "@/store/portfolio"
import { Loader2Icon } from "lucide-react"
import  { TradeCallback, TCurrency, tokenValueFormatter, usdFormatter } from "morpher-trading-sdk"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Skeleton } from "../ui/skeleton"
import { sdk } from "@farcaster/frame-sdk"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"

export function Trade() {
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
      loading,
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

  const tradeAmountUsd = (Number(tradeAmount) || 0) * (selectedCurrencyDetails?.usd_exchange_rate || 0);

  const maxBalance = React.useMemo(() => {
    if (!selectedCurrencyDetails) return 0;
    return (
      Number(selectedCurrencyDetails.balance || 0) /
      10 ** (selectedCurrencyDetails.decimals || 18)
    );
  }, [selectedCurrencyDetails]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setTradeAmount("");
      return;
    }

    if (value.startsWith("-")) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    if (numValue > maxBalance) {
      setTradeAmount(tokenValueFormatter(maxBalance));
    } else {
      setTradeAmount(value);
    }
  };

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
  
  const openPosition = () => {
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
      
      morpherTradeSDK.openPosition({ account, walletClient: walletClient as any, leverage: leverage[0] || 1, direction: tradeType, publicClient, market_id: selectedMarketId || '', currency: selectedCurrency || 'ETH', tradeAmount:tradeAmountFormatted, callback: tradeComplete })
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
        {loading ? (
          <div>
            <div className="flex items-center text-xl font-bold">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-32 ml-2" />
            </div>
            <div className="text-sm flex justify-between mt-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ) : (
          <div className="">
            <Tabs
              value={selectedCurrency}
              onValueChange={(value) => {
                setSelectedCurrency(value as TCurrency);
                setTradeAmount("");
              }}
              className="w-full"
            >
              <TabsList className="w-full rounded-b-none border border-b-none">
                {currencyList &&
                  Object.entries(currencyList).map(([currency, details]) => (
                    <TabsTrigger
                      key={currency}
                      value={currency}
                      disabled={!details.balance || BigInt(details.balance) === 0n}
                      className="flex-col h-auto"
                    >
                      <img
                        src={`/src/assets/icons/${currency}.svg`}
                        alt={`${currency} logo`}
                        className="h-6 w-6 mb-1"
                      />
                      <span className="font-semibold">{currency}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {tokenValueFormatter(
                          Number(details.balance || 0) /
                            10 ** (details.decimals || 1)
                        )}
                      </span>
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  className="h-12 pr-28 text-2xl font-bold bg-muted border-t-none"
                  value={tradeAmount}
                  onChange={handleAmountChange}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-lg font-semibold text-muted-foreground">
                    {selectedCurrencyDetails?.symbol}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setTradeAmount(
                        tokenValueFormatter(
                          Number(selectedCurrencyDetails?.balance || 0) /
                            10 ** (selectedCurrencyDetails?.decimals || 18)
                        )
                      )
                    }
                    className="p-1 h-auto"
                  >
                    Max
                  </Button>
                </div>
              </div>
              <div className="text-sm flex justify-between text-muted-foreground px-1">
                <span>~ ${usdFormatter(tradeAmountUsd)}</span>
                <span>
                  Balance:{" "}
                  {tokenValueFormatter(
                    Number(selectedCurrencyDetails?.balance || 0) /
                      10 ** (selectedCurrencyDetails?.decimals || 1)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
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
          onClick={openPosition}
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
