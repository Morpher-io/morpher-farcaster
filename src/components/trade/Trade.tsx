import * as React from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePublicClient, useWalletClient, useAccount } from "wagmi"
import { useMarketStore } from "@/store/market"
import { usePortfolioStore } from "@/store/portfolio"
import { Loader2Icon, Info } from "lucide-react"
import {
  TradeCallback,
  TCurrency,
  tokenValueFormatter,
  usdFormatter,
} from "morpher-trading-sdk"
import { Input } from "../ui/input"
import { Skeleton } from "../ui/skeleton"
import { sdk } from "@farcaster/frame-sdk"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"

export function Trade() {
  const [tradeExecuting, setTradeExecuting] = React.useState(false);
  const [tradeError, setTradeError] = React.useState<string | undefined>(
    undefined
  );
  const [inputMode, setInputMode] = React.useState<"token" | "usd">("token");

  const {
    selectedMarketId,
    morpherTradeSDK,
    selectedMarket,
    tradeType,
    setTradeType,
    leverage,
    setLeverage,
    marketData,
  } = useMarketStore();
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

  const exchangeRate = selectedCurrencyDetails?.usd_exchange_rate || 0;
  const usdValue = (Number(tradeAmount) || 0) * exchangeRate;

  const maxBalance = React.useMemo(() => {
    if (!selectedCurrencyDetails) return 0;
    return (
      Number(selectedCurrencyDetails.balance || 0) /
      10 ** (selectedCurrencyDetails.decimals || 18)
    );
  }, [selectedCurrencyDetails]);

  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    setInputValue("");
    setTradeAmount("");
  }, [selectedCurrency, inputMode, setTradeAmount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (value.startsWith("-") || (value && !/^\d*\.?\d*$/.test(value))) {
      return;
    }

    setInputValue(value); // Update UI immediately

    let tokenAmountStr = "";
    if (inputMode === "token") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > maxBalance) {
        tokenAmountStr = maxBalance.toString();
        setInputValue(tokenAmountStr);
      } else {
        tokenAmountStr = value || "";
      }
    } else {
      // usd mode
      if (exchangeRate > 0) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          setTradeAmount("");
          return;
        }
        
        const tokenValue = numValue / exchangeRate;
        if (tokenValue > maxBalance) {
          tokenAmountStr = maxBalance.toString();
          setInputValue((maxBalance * exchangeRate).toFixed(2));
        } else {
          tokenAmountStr = value ? tokenValue.toString() : "";
        }
      }
    }
    setTradeAmount(tokenAmountStr);
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
    <div className="mb-4 mt-4">
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
          <div className="flex items-center mb-2">
            <Label>Trade Amount</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="ml-1.5">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    You always invest into {selectedMarket?.name || "this market"} with MPH.
                    You choose the amount of MPH you want to invest and this will
                    be placed into a position. If you invest with ETH or USDC
                    then the amount selected will be converted using uniswap to MPH
                    before investing transparently via our Morpher Smart Contracts.
                    Only invest what you can afford to loose, trade responsibly.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Tabs
            value={selectedCurrency}
            onValueChange={(value) => {
              setSelectedCurrency(value as TCurrency);
              setInputMode("token");
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
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <Input
                  placeholder="0.00"
                  value={inputValue}
                  onChange={handleInputChange}
                  className="h-auto border-none bg-transparent p-0 text-3xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <ToggleGroup
                  type="single"
                  value={inputMode}
                  onValueChange={(value) => {
                    if (value) {
                      setInputMode(value as "token" | "usd");
                    }
                  }}
                  className="p-0.5 border bg-background"
                  disabled={selectedCurrency === "USDC"}
                >
                  <ToggleGroupItem
                    value="token"
                    aria-label="Toggle token input"
                    className="p-1.5 data-[state=on]:bg-primary/20"
                  >
                    <img
                      src={`/src/assets/icons/${selectedCurrency}.svg`}
                      alt={`${selectedCurrency} logo`}
                      className="h-5 w-5"
                    />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="usd"
                    aria-label="Toggle USD input"
                    className="p-1.5 data-[state=on]:bg-primary/20"
                  >
                    <img
                      src="/src/assets/icons/USDC.svg"
                      alt="USD logo"
                      className="h-5 w-5"
                    />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="text-sm flex justify-between text-muted-foreground mt-1">
                <span>
                  {inputMode === "token" && selectedCurrency !== "USDC"
                    ? `~ $${usdFormatter(usdValue)}`
                    : inputMode === "usd"
                    ? `~ ${tokenValueFormatter(Number(tradeAmount) || 0)} ${selectedCurrency}`
                    : ""}
                </span>
                <span>
                  Balance: {tokenValueFormatter(maxBalance)}
                  <Button
                    variant="link"
                    size="sm"
                    className="p-1 h-auto text-primary"
                    onClick={() => {
                      setTradeAmount(maxBalance.toString());
                      if (inputMode === 'token') {
                        setInputValue(maxBalance.toString());
                      } else {
                        setInputValue((maxBalance * exchangeRate).toFixed(2));
                      }
                    }}
                  >
                    Max
                  </Button>
                </span>
              </div>
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
    </div>
  )
}
