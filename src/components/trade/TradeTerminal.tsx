import * as React from "react";
import { MarketSelector } from "./MarketSelector";
import { MarketSuggestions } from "./MarketSuggestions";
import { PortfolioSummary } from "./PortfolioSummary";
import { PortfolioStats } from "./PortfolioStats";
import { useAccount, usePublicClient } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";
import { useMarketStore } from "@/store/market";
import { OpenPositionItem } from "./OpenPositionItem";
import { TradeView } from "./TradeView";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";
import { Button } from "../ui/button";

export function TradeTerminal() {
  const { address } = useAccount();
  const { setEthAddress, setCurrencyList, currencyList, positionList } = usePortfolioStore();
  const { morpherTradeSDK, setSelectedMarketId, setOpenSearch } = useMarketStore();
  const publicClient = usePublicClient();
  const { t } = useTranslation();

  React.useEffect(() => {
    setEthAddress(address);
  }, [address, setEthAddress]);

  const fetchCurrencyList = async () => {
    if (address && publicClient && morpherTradeSDK.tokenAddress && morpherTradeSDK.usdcAddress) {
      const fetchedCurrencyList = await morpherTradeSDK.getCurrencyList({ address, publicClient, tokenAddresses: [{ symbol: 'MPH', address: morpherTradeSDK.tokenAddress as `0x${string}` }, { symbol: 'USDC', address: morpherTradeSDK.usdcAddress as `0x${string}` }] })
      setCurrencyList(fetchedCurrencyList);
    }
  }

  React.useEffect(() => {
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
      {positionList &&
        (positionList.length > 0 ? (
          <>
            <h2 className="text-lg font-bold mt-2">{t("OPEN_POSITIONS")}</h2>
            {positionList.map((position) => (
              <OpenPositionItem key={position.id} position={position} />
            ))}
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold mt-2">{t("OPEN_POSITIONS")}</h2>
            <div className="border-b">
              <div
                className="flex items-center  py-4 cursor-pointer"
                onClick={() => setOpenSearch(true)}
              >
                <div className="h-9 w-9 rounded-full bg-[var(--primary-light)] flex items-center justify-center self-start">
                  <TrendingUp  color="var(--primary)" className="h-5 w-5  " />
                </div>
                <div className=" ml-4">
                  <p className="font-semibold text-base">
                    {t("NO_OPEN_POSITIONS_YET")}
                  </p>
                  <p className="text-sm text-muted-foreground  ">
                    {t("TRADE_YOUR_FIRST_MARKET")}
                    <Button  className="font-medium text-base hover:underline mt-4">
                     {t("START_TRADING")}
                    </Button>
                  </p>

                </div>
                
              </div>
              
            </div>
          </>
        ))}
      <TradeView />
    </div>
  );
}
