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
import { Loader2Icon, Info, TrendingUp, TrendingDown, Rocket } from "lucide-react"
import {
  TradeCallback,
  TCurrency,
  tokenValueFormatter,
  usdFormatter,
} from "morpher-trading-sdk"
import { Input } from "../ui/input"
import { Skeleton } from "../ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { cn } from "@/lib/utils"
import { LeverageImpactVisualizer } from "./LeverageImpactVisualizer"
import { useTranslation } from "react-i18next";

export function Trade() {
  const [tradeExecuting, setTradeExecuting] = React.useState(false);
  const [tradeError, setTradeError] = React.useState<string | undefined>(
    undefined
  );
  const [inputMode, setInputMode] = React.useState<"token" | "usd">("token");

  const [timeoutTimer, setTimeoutTimer]  = React.useState<NodeJS.Timeout>();
  const {
    selectedMarketId,
    morpherTradeSDK,
    selectedMarket,
    tradeType,
    setTradeType,
    leverage,
    setLeverage,
    marketData,
    livePrice,
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
      setTradeComplete,
      orderUpdate,
      setClosePercentage
  } = usePortfolioStore()

  const account: any = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient:any = usePublicClient()

  const { t } = useTranslation();

   

    
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
        setInputValue(tokenValueFormatter(maxBalance));
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

  const updateAmount = (tokenAmount: number) => {
    setTradeAmount(tokenAmount.toString());
    if (inputMode === "token") {
      setInputValue(tokenAmount.toString());
    } else {
      setInputValue((tokenAmount * exchangeRate).toFixed(2));
    }
  };
  
  const adjustTradeAmountByUsd = (usdAdjustment: number) => {
    const currentTokenAmount = Number(tradeAmount) || 0;
    if (exchangeRate <= 0) return;
    const adjustmentInTokens = usdAdjustment / exchangeRate;
    let newTokenAmount = currentTokenAmount + adjustmentInTokens;

    if (newTokenAmount < 0) newTokenAmount = 0;
    if (newTokenAmount > maxBalance) newTokenAmount = maxBalance;

    
    updateAmount(Number(tokenValueFormatter(newTokenAmount)));
  };

  const setMaxAmount = () => {
    updateAmount(Number(tokenValueFormatter(maxBalance)));
  };

  // const getLeverageWarningClass = (leverageValue: number): string => {
  //   if (leverageValue <= 4) {
  //     return "bg-yellow-100 text-yellow-800";
  //   }
  //   if (leverageValue <= 7) {
  //     return "bg-orange-100 text-orange-800";
  //   }
  //   return "bg-red-100 text-red-800";
  // };

  const clearTrade = () => {
    setTradeAmount('')
            setClosePercentage(undefined)
            setTradeType('long')
            setLeverage([1])
  }

  const tradeComplete = (result: TradeCallback) => {
    if (result.result === 'error') {
      let error = result.err
      if (result.error_code) {
        const err_message = t('errors.' + result.error_code.toUpperCase());
        if (err_message !== 'errors.' + result.error_code.toUpperCase()) {
          error = err_message
        }
      }
      
      setTradeError(error || 'An error occurred while executing the trade.')
      setTradeComplete(false);
      setTradeExecuting(false)
      return
    }

    let timer = setTimeout(() => {
      clearTrade()
      setTradeExecuting(false)
    }, 20000)

    setTimeoutTimer(timer)
  }

    React.useEffect(() => {
      if (tradeExecuting) {
        if (timeoutTimer) {
          clearTimeout(timeoutTimer)
          setTimeoutTimer(undefined)
        }
        setTimeout(() => {
          clearTrade();
          setTradeExecuting(false)
        }, 1000)
      }
      
    }, [orderUpdate])
  
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
            <Label className="text-lg font-bold ">{t('TRADE_AMOUNT')}</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="ml-1.5">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    {t('TRADE_AMOUNT_DESCRIPTION', {market: selectedMarket?.name || "this market" })}
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
            <TabsList className="w-full rounded-b-none border">
              {currencyList &&
                Object.entries(currencyList).map(([currency, details]) => (
                  <TabsTrigger
                    key={currency}
                    value={currency}
                    disabled={!details.balance || BigInt(details.balance) === 0n}
                    className={"flex-col h-auto " + (currency == selectedCurrency ? 'border-primary' : '') }
                  >
                    <img
                      src={`/assets/icons/${currency}.svg`}
                      alt={`${currency} logo`}
                      className="h-6 w-6 mb-1"
                    />
                    <div className="flex flex-col">
                    <span className="font-semibold">{currency}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {Number(details.balance || 0) > 0 ? tokenValueFormatter(
                        Number(details.balance || 0) /
                          10 ** (details.decimals || 1)
                      ) : "0.00"}
                    </span>
                    </div>
                  </TabsTrigger>
                ))}
            </TabsList>
          </Tabs>
          <div className="space-y-2">
            <div className="bg-muted p-3 rounded-lg rounded-t-none border border-t-0">
              <div className="flex justify-between items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="0.00"
                    value={inputValue}
                    onChange={handleInputChange}
                    className="w-full h-auto border-none bg-transparent p-0 text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-primary placeholder:opacity-60"
                  />
                </div>
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
                      src={`/assets/icons/${selectedCurrency}.svg`}
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
                      src="/assets/icons/USDC.svg"
                      alt="USD logo"
                      className="h-5 w-5"
                    />
                  </ToggleGroupItem>
                </ToggleGroup>
                
              </div>
              <div className="grid grid-cols-5 gap-2 py-2">
              {[
                { label: "-$100", value: -100 },
                { label: "-$10", value: -10 },
                { label: "+$10", value: 10 },
                { label: "+$100", value: 100 },
              ].map(({ label, value }) => {
                const currentUsdValue = (Number(tradeAmount) || 0) * exchangeRate;
                const maxUsdValue = maxBalance * exchangeRate;
                const isDisabled =
                  value > 0
                    ? currentUsdValue + value > maxUsdValue
                    : currentUsdValue + value < 0;
                return (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-xs rounded-sm h-8",
                      value < 0
                        ? "text-secondary hover:bg-secondary/10"
                        : "text-primary hover:bg-primary/10"
                    )}
                    onClick={() => adjustTradeAmountByUsd(value)}
                    disabled={isDisabled || exchangeRate <= 0}
                  >
                    {label}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 rounded-sm font-bold text-white bg-[var(--blue)] hover:bg-[var(--blue)]  hover:opacity-70 transition-opacity hover:text-white"
                onClick={setMaxAmount}
              >
                Max <Rocket />
              </Button>
            </div>
              
              <div className="text-xs flex justify-between text-muted-foreground mt-1 px-1">
                <span>
                  {inputMode === "token" && selectedCurrency !== "USDC"
                    ? `~ $${usdFormatter(usdValue)}`
                    : inputMode === "usd"
                    ? `~ ${tokenValueFormatter(Number(tradeAmount) || 0)} ${selectedCurrency}`
                    : ""}
                </span>
                <span>
                  {tokenValueFormatter(maxBalance)} {selectedCurrency}
                  {selectedCurrency !== 'USDC' && ` ($${usdFormatter(maxBalance * exchangeRate)})`}
                </span>
              </div>
            </div>
            
          </div>
        </div>
      )}
      <div className="my-4 h-px bg-gray-200" />

      <div className="flex items-center justify-between mb-2">
        <Label className="text-lg font-bold">{t('TRADE_TYPE')}</Label>
        <ToggleGroup
          type="single"
          value={tradeType}
          className="w-[100px] grid grid-cols-2 border rounded-lg"
          onValueChange={(value: "long" | "short") => {
            if (value) setTradeType(value);
          }}
        >
          <ToggleGroupItem
            value="long"
            aria-label="Toggle long"
            className="data-[state=on]:bg-primary data-[state=on]:text-white"
          >
            {t('LONG')}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="short"
            aria-label="Toggle short"
            className="data-[state=on]:bg-secondary data-[state=on]:text-white"
          >
            {t('SHORT')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md mb-4 space-y-2">
        {tradeType === "long" ? (
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>
              {t('LONG_DESCRIPTION', {market: selectedMarket?.symbol || "the asset" })}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
            <p>
              {t('SHORT_DESCRIPTION', {market: selectedMarket?.symbol || "the asset" })}
            </p>
          </div>
        )}
      </div>
      <div className="mb-6">
        <div className="flex justify-between">
          <Label>{t('LEVERAGE')}</Label>
          <span>{leverage[0]}x</span>
        </div>
        <Slider
          defaultValue={[1]}
          min={1}
          max={10}
          step={0.2}
          onValueChange={setLeverage}
          className="mt-4 mb-4"
        />
        {leverage[0] > 1 && marketData && (
          <LeverageImpactVisualizer
            leverage={leverage[0]}
            tradeType={tradeType}
            marketPrice={livePrice && livePrice[marketData.market_id] ? livePrice[marketData.market_id] : Number(marketData.close) || 0}
            spread={Number(marketData.spread) || 0}
          />
        )}
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
            src={`/assets/icons/info.svg`}
            alt={`Info Icon`}
          />
          Enter amount to trade
        </p>
      )}
      {tradeError && (
        <div className="text-red-500 text-sm mt-2 text-center">
          {tradeError}
        </div>
      )}
    </div>
  )
}
