import * as React from "react";
import { MarketSelector } from "./MarketSelector";
import { MarketSuggestions } from "./MarketSuggestions";
import { PortfolioSummary } from "./PortfolioSummary";
import { PortfolioStats } from "./PortfolioStats";
import { useAccount, usePublicClient } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";
import { useMarketStore } from "@/store/market";
import { TPosition, usdFormatter, tokenValueFormatter } from "morpher-trading-sdk";

export function TradeTerminal() {
  const { address } = useAccount();
  const { setEthAddress, setCurrencyList, currencyList, positionList, setSelectedPosition, setTradeDirection } = usePortfolioStore();
  const { morpherTradeSDK, setSelectedMarketId, setMarketType } = useMarketStore();
  const publicClient = usePublicClient();

  const selectPosition = (position_id: string) => {
    let position = positionList?.find(pos => pos.id === position_id)
    if (position) {
        setSelectedPosition(position)
        if (address) {
            setMarketType('commodity')
            setTradeDirection('close')

            setSelectedMarketId(position.market_id)
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
  }

  const outputPosition = (position: TPosition) => {
    return (
      <div className="flex w-full items-center justify-between border-b-1 mb-1 pb-1">
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
            className="flex flex-col max-w-[130px] w-[130px] overflow-hidden text-left"

          >
            <p className="font-semibold">{position?.symbol}</p>
            <p className="font-normal">{position?.name}</p>
          </div>
        </div>
        <div id="marketValue" className="flex flex-col text-right  ">
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

           <div
            id="marketPercent"
            className={`flex items-center justify-end ${(Number(position?.total_return || 0)) >= 0 ? "text-primary" : "text-secondary"}`}
          >
      
            {(Number(position?.total_return || 0)) > 0 ? "+" : ""}
            {Number(Number(position?.total_return || 0)/ 10**18).toFixed(2)} 
          </div>

        </div>
        <div id="marketValue" className="flex flex-col text-right">
          <p className="text-lg font-bold">
             { currencyList?.MPH?.usd_exchange_rate ? '$ ' + (usdFormatter(Number(position.value || 0) / 10**18 * currencyList?.MPH?.usd_exchange_rate )) : tokenValueFormatter(Number(position.value || 0) / 10**18) + ' MPH'}
          </p>
          <div
            id="marketPercent"
            className={`flex items-center justify-end ${position.direction == "long"  ? "text-primary" : "text-secondary"}`}
          >
            <div className={(position.direction == "long" ? 'bg-[var(--light-green)]' : 'bg-[var(--light-red)]') + ' px-2 rounded-full '}>
                {position.direction == "long" ? "Long" : "Short"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  React.useEffect(() => {
    console.log("TradeTerminal: address from useAccount:", address);
    setEthAddress(address);
  }, [address, setEthAddress]);

  const fetchCurrencyList = async () => {
    if (address && publicClient && morpherTradeSDK.tokenAddress && morpherTradeSDK.usdcAddress) {
      console.log("TradeTerminal: Fetching currency list for", address);
      const fetchedCurrencyList = await morpherTradeSDK.getCurrencyList({ address, publicClient, tokenAddresses: [{symbol: 'MPH', address: morpherTradeSDK.tokenAddress as `0x${string}`}, {symbol: 'USDC', address: morpherTradeSDK.usdcAddress as `0x${string}` } ]  })
      console.log("TradeTerminal: Fetched currency list:", fetchedCurrencyList);
      setCurrencyList(fetchedCurrencyList);
    }
  }

  React.useEffect(()=> {
    if (address && publicClient && !currencyList && morpherTradeSDK.ready) {
      fetchCurrencyList()

    }
  }, [address, publicClient, currencyList, morpherTradeSDK.ready]) 


  return (
    <div className="mt-5 mx-4 mb-6 flex flex-col gap-4 bg-white h-full">
      <PortfolioSummary />
      <div className="h-px bg-gray-200 my-2" />
      <PortfolioStats />
      <MarketSuggestions />
      <MarketSelector />
      {positionList && positionList.length > 0 && (
        <>
          <h2 className="text-lg font-bold mt-2">Open Positions</h2>
          {positionList.map((position) => (
            <div
              key={position.id}
              className="cursor-pointer"
              onClick={() => {selectPosition(position.id)}}
            >
              {outputPosition(position)}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
