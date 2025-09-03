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
import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TradeTerminal() {
  const { address } = useAccount();
  const { setEthAddress, setCurrencyList, currencyList, positionList } =
    usePortfolioStore();
  const { morpherTradeSDK, setOpenSearch } = useMarketStore();
  const publicClient = usePublicClient();
  const t = useTranslations();

  React.useEffect(() => {
    setEthAddress(address);
  }, [address, setEthAddress]);

  const fetchCurrencyList = async () => {
    if (
      address &&
      publicClient &&
      morpherTradeSDK.tokenAddress &&
      morpherTradeSDK.usdcAddress
    ) {
      const fetchedCurrencyList = await morpherTradeSDK.getCurrencyList({
        address,
        publicClient,
        tokenAddresses: [
          {
            symbol: "MPH",
            address: morpherTradeSDK.tokenAddress as `0x${string}`,
          },
          {
            symbol: "USDC",
            address: morpherTradeSDK.usdcAddress as `0x${string}`,
          },
        ],
      });
      setCurrencyList(fetchedCurrencyList);
    }
  };

  React.useEffect(() => {
    if (address && publicClient && !currencyList && morpherTradeSDK.ready) {
      fetchCurrencyList();
    }
  }, [address, publicClient, currencyList, morpherTradeSDK.ready]);

  return (
    <div className="mx-4 mt-5 mb-6 flex h-full flex-col gap-4 bg-white">
      <PortfolioSummary />
      <div className="my-2 h-px bg-gray-200" />
      <PortfolioStats />
      <MarketSuggestions />
      <MarketSelector />
      {positionList &&
        (positionList.length > 0 ? (
          <>
            <h2 className="mt-2 text-lg font-bold">{t("OPEN_POSITIONS")}</h2>
            {positionList.map((position) => (
              <OpenPositionItem key={position.id} position={position} />
            ))}
          </>
        ) : (
          <>
            <h2 className="mt-2 text-lg font-bold">{t("OPEN_POSITIONS")}</h2>
            <div className="border-b">
              <div
                className="flex cursor-pointer items-center py-4"
                onClick={() => setOpenSearch(true)}
              >
                <div className="flex h-9 w-9 items-center justify-center self-start rounded-full bg-[var(--primary-light)]">
                  <TrendingUp color="var(--primary)" className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold">
                    {t("NO_OPEN_POSITIONS_YET")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t("TRADE_YOUR_FIRST_MARKET")}
                    <Button className="mt-4 text-base font-medium hover:underline">
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
