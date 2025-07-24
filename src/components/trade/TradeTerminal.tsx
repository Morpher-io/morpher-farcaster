import * as React from "react";
import { MarketSelector } from "./MarketSelector";
import { MarketSuggestions } from "./MarketSuggestions";
import { PortfolioSummary } from "./PortfolioSummary";
import { PortfolioStats } from "./PortfolioStats";
import { useAccount, usePublicClient } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";
import { useMarketStore } from "@/store/market";
import { OpenPositionItem } from "./OpenPositionItem";

export function TradeTerminal() {
  const { address } = useAccount();
  const { setEthAddress, setCurrencyList, currencyList, positionList } = usePortfolioStore();
  const { morpherTradeSDK } = useMarketStore();
  const publicClient = usePublicClient();

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
            <OpenPositionItem key={position.id} position={position} />
          ))}
        </>
      )}
    </div>
  );
}
