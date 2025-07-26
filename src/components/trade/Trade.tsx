import * as React from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { usePublicClient, useWalletClient, useAccount } from "wagmi"
import { useMarketStore } from "@/store/market"
import { usePortfolioStore } from "@/store/portfolio"
import { Loader2Icon, ArrowDownUp } from "lucide-react"
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

  const [usdTradeAmount, setUsdTradeAmount] = React.useState("");
  const exchangeRate = selectedCurrencyDetails?.usd_exchange_rate || 0;

  React.useEffect(() => {
    const numericTradeAmount = Number(tradeAmount);
    if (numericTradeAmount > 0 && exchangeRate > 0) {
      setUsdTradeAmount((numericTradeAmount * exchangeRate).toFixed(2));
    } else {
      setUsdTradeAmount("");
    }
  }, [tradeAmount, exchangeRate]);

  const maxBalance = React.useMemo(() => {
    if (!selectedCurrencyDetails) return 0;
    return (
      Number(selectedCurrencyDetails.balance || 0) /
      10 ** (selectedCurrencyDetails.decimals || 18)
    );
  }, [selectedCurrencyDetails]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.startsWith("-")) return;

    if (value === "") {
      setTradeAmount("");
      return;
    }

    if (!/^\d*\.?\d*$/.test(value)) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    if (numValue > maxBalance) {
      setTradeAmount(maxBalance.toString());
    } else {
      setTradeAmount(value);
    }
  };

  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value.startsWith("-")) return;

    if (!/^\d*\.?\d*$/.test(value)) return;
    
    setUsdTradeAmount(value);

    if (value === "") {
      setTradeAmount("");
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || exchangeRate === 0) return;

    const newTradeAmount = numValue / exchangeRate;
    
    if (newTradeAmount > maxBalance) {
      setTradeAmount(maxBalance.toString());
    } else {
      setTradeAmount(newTradeAmount.toString());
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
            <div className="space-y-1">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <Input
                    placeholder="0.00"
                    value={tradeAmount}
                    onChange={handleAmountChange}
                    className="h-auto border-none bg-transparent p-0 text-3xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <div className="flex items-center gap-2 bg-background p-2 rounded-full">
                    {selectedCurrency && <img src={`/src/assets/icons/${selectedCurrency}.svg`} alt={`${selectedCurrency} logo`} className="h-6 w-6" />}
                    <span className="font-semibold text-lg">{selectedCurrency}</span>
                  </div>
                </div>
                <div className="text-sm flex justify-between text-muted-foreground mt-1">
                  <span>
                    {selectedCurrency !== 'USDC' && `~ $${usdFormatter(Number(tradeAmount) * exchangeRate)}`}
                  </span>
                  <span>
                    Balance: {tokenValueFormatter(maxBalance)}
                    <Button variant="link" size="sm" className="p-1 h-auto text-primary" onClick={() => setTradeAmount(maxBalance.toString())}>
                        Max
                    </Button>
                  </span>
                </div>
              </div>

              {selectedCurrency !== 'USDC' && (
                  <>
                      <div className="flex justify-center py-1">
                          <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                  <span className="text-3xl font-bold text-muted-foreground">$</span>
                                  <Input
                                      placeholder="0.00"
                                      value={usdTradeAmount}
                                      onChange={handleUsdAmountChange}
                                      className="h-auto border-none bg-transparent p-0 text-3xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 ml-2"
                                  />
                              </div>
                              <div className="flex items-center gap-2 bg-background p-2 rounded-full">
                                  <img src="/src/assets/icons/USDC.svg" alt="USDC logo" className="h-6 w-6" />
                                  <span className="font-semibold text-lg">USD</span>
                              </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 text-right">
                              1 {selectedCurrency} ≈ ${usdFormatter(exchangeRate)}
                          </div>
                      </div>
                  </>
              )}
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
