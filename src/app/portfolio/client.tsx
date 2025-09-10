"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortfolioChart } from "@/components/PortfolioChart";
import { useMarketStore } from "@/store/market";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { usdFormatter, tokenValueFormatter } from "morpher-trading-sdk";
import { usePortfolioStore } from "@/store/portfolio";

import { OpenPositionItem } from "@/components/OpenPositionItem";
import { TradeView } from "@/components/TradeView";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/Footer";
import { TradeSuccessScreen } from "@/components/TradeSuccess";

export default function PortfolioScreen() {

  const { data: signMessageData, error, signMessage, variables } = useSignMessage()

  const { address } = useAccount();
  const account = useAccount();
  const {
    morpherTradeSDK,
    setSelectedMarketId,
    selectedMarketId,
    marketListAll,
    setSelectedMarket,
  } = useMarketStore();
  const {
    positionList,
    setPositionList,
    setPortfolio,
    positionValue,
    currencyList,
    setReturns,
    returns,
    tradeComplete,
  } = usePortfolioStore();
  const [timeRange, setTimeRange] = useState<"d" | "w" | "m" | "y">("d");
  const [chartData, setChartData] = useState<[number, number][]>([]);
  const t = useTranslations();

  const handleTradeBtc = () => {
    setSelectedMarketId("CRYPTO_BTC");
    window.open("/", "_self");
  };

  const fetchMarketData = async ({
    eth_address,
    market_id,
  }: {
    eth_address: `0x${string}`;
    market_id: string;
  }) => {
    const sdkMarketData = await morpherTradeSDK.getMarketData({
      eth_address,
      market_id,
    });
    console.log("sdkMarketData", sdkMarketData);
    setSelectedMarket(sdkMarketData);
  };

  useEffect(() => {
    console.log("selectedMarketId", selectedMarketId);
    if (selectedMarketId && marketListAll) {
      console.log("marketListAll");
      setSelectedMarket(marketListAll[selectedMarketId]);
    } else {
      fetchMarketData({
        eth_address: address || "0x",
        market_id: selectedMarketId,
      });
    }
  }, [selectedMarketId, marketListAll, setSelectedMarket]);

  useEffect(() => {
    if (signMessageData) {
      console.log('signed message', signMessageData)
    }
  }, [signMessageData])


  const signMsg = () => {
    try {
      signMessage({ message: "Morpher Registration" });
    } catch (err) {
      console.log('sign error', err)
    }

  }
  const getProtfolio = async () => {
    if (account?.address && morpherTradeSDK) {
      try {
        let portfolioData = await morpherTradeSDK.getPortfolio({
          eth_address: account.address,
        });
        setPortfolio(portfolioData);

        let positions = await morpherTradeSDK.getPositions({
          eth_address: account.address,
        });
        setPositionList(positions);
      } catch (err) {
        console.log("No portfolio found");
      }
    }
  };

  const getReturns = async (type: "d" | "w" | "m" | "y") => {
    if (account?.address && morpherTradeSDK) {
      if (returns && returns[type] && returns[type].length > 0) return;
      try {
        const returnsData = await morpherTradeSDK.getReturns({
          eth_address: account.address,
          type,
        });

        console.log("returnsData", returnsData);

        setReturns(type, returnsData || []);
      } catch (err) {
        console.log("Error fetching returns");
      }
    }
  };
  useEffect(() => {
    if (account?.address && morpherTradeSDK) {
      getProtfolio();
      signMsg();
    }
  }, [account, morpherTradeSDK]);

  useEffect(() => {
    if (account?.address && morpherTradeSDK) {
      getReturns(timeRange);
    }
  }, [timeRange, account, morpherTradeSDK]);

  useEffect(() => {
    if (returns[timeRange]) {
      let data: [number, number][] = [];
      returns[timeRange].forEach((point) => {
        data.push([point.timestamp, point.positions]);
      });
      setChartData(data);
    }
  }, [returns[timeRange], timeRange]);
  return (
    <>
      {tradeComplete ? (
        <>
          <TradeSuccessScreen />
        </>
      ) : (
        <>
          <TradeView />

          <div className="mx-4">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  {t("menu.PORTFOLIO")}
                </CardTitle>

                <CardTitle className="flex justify-between">
                  <div>
                    {currencyList?.MPH?.usd_exchange_rate
                      ? "$ " +
                        usdFormatter(
                          (Number(positionValue) / 10 ** 18) *
                            currencyList?.MPH?.usd_exchange_rate,
                        )
                      : ""}{" "}
                    ({tokenValueFormatter((positionValue || 0) / 10 ** 18)} MPH)
                  </div>
                  <CardDescription className="max-w-[90px] truncate">
                    {account?.address}
                  </CardDescription>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PortfolioChart data={chartData || []} timeRange={timeRange} />
                <div className="mt-2 flex justify-center gap-2">
                  <Button
                    variant={timeRange === "d" ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange("d")}
                  >
                    1D
                  </Button>
                  <Button
                    variant={timeRange === "w" ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange("w")}
                  >
                    1W
                  </Button>
                  <Button
                    variant={timeRange === "m" ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange("m")}
                  >
                    1M
                  </Button>
                  <Button
                    variant={timeRange === "y" ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange("y")}
                  >
                    1Y
                  </Button>
                </div>
                {/* {portfolio ? (
                        <div className="grid gap-2 text-sm mt-4">
                            <div className="flex items-center justify-between">
                                <span>Total Value</span>
                                <span>{tokenValueFormatter((Number(portfolio.current_value || 0) / 10**18)) } MPH</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>In Positions</span>
                                <span>{tokenValueFormatter(((positionValue || 0) / 10**18)) } MPH</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span>ETH Balance</span>
                                <span>{tokenValueFormatter(Number(portfolio.eth_balance || 0) / 10**18) } ETH</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>USDC Balance</span>
                                <span>{tokenValueFormatter(Number(portfolio.usdc_balance || 0) / 10**6)} USDC</span>
                            </div>
                        </div>
                    ) : (
                        <p>Loading portfolio...</p>
                    )} */}
              </CardContent>
            </Card>
            <h2 className="mt-6 mb-2 text-lg font-bold">{t("POSITIONS")}</h2>
            signature:<br />
            <div>
              {signMessageData}
            </div>

            {/* {marketData.pending_order_id ? (
                              <PendingPosition marketData={marketData} />
                            ) : */}

            {positionList && positionList.length > 0 ? (
              positionList.map((position) => (
                <OpenPositionItem key={position.id} position={position} />
              ))
            ) : positionList && positionList.length === 0 ? (
              <Card className="mt-2 text-center">
                <CardContent className="flex flex-col items-center p-6">
                  <p className="mb-4 font-semibold">
                    Your first trade is just a click away!
                  </p>
                  <Button onClick={handleTradeBtc}>Trade Bitcoin</Button>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Footer />
        </>
      )}
    </>
  );
}
