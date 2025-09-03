"use client";

import { useMarketStore } from "@/store/market";
import { useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";
import { Button } from "@/components/ui/button";
import { tokenValueFormatter } from "morpher-trading-sdk";
import { useTranslations } from "next-intl";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import Link from "next/link";

export function TradeSuccessScreen() {
  const t = useTranslations();
  let compose = useComposeCast();

  const account: any = useAccount();

  const {
    selectedMarket,
    marketListAll,
    setSelectedMarket,
    setSelectedMarketId,
  } = useMarketStore();
  const { setTradeComplete, orderUpdate } = usePortfolioStore();

  const getOrder = async () => {
    if (account.address === undefined) {
      return;
    }
  };

  useEffect(() => {
    if (
      marketListAll &&
      orderUpdate &&
      orderUpdate.market_id &&
      selectedMarket?.market_id !== orderUpdate.market_id
    ) {
      let market = marketListAll[orderUpdate.market_id];
      setSelectedMarket(market);
    }
  }, [marketListAll, orderUpdate, selectedMarket]);
  const share = async () => {
    let leverage = "";
    if (orderUpdate?.leverage && Number(orderUpdate.leverage) / 10 ** 8 > 1) {
      leverage += t("TRADE_OPEN_LEVERAGE", {
        leverage: Number(orderUpdate.leverage) / 10 ** 8,
      });
    }

    let text = t("TRADE_OPEN_SHARE", {
      leverage: leverage,
      type:
        orderUpdate?.direction == "long"
          ? t("MESSAGE_LONG")
          : t("MESSAGE_SHORT"),
      market: selectedMarket?.name || orderUpdate?.market_id || "",
      currency: orderUpdate?.order_currency || "",
    });

    text += "!";

    if (Number(orderUpdate?.close_shares_amount || 0) > 0) {
      text = t("TRADE_CLOSE_SHARE", {
        market: selectedMarket?.name || orderUpdate?.market_id || "",
        returnPercentage,
      });
    }

    const embeds: [string] = [
      `https://farcaster.xyz/miniapps/dWezHCjv5UqF/morpher`,
    ];

    await compose.composeCast({
      text,
      embeds,
    });
  };

  const closeTradeComplete = () => {
    setTradeComplete(false);
    setSelectedMarket(undefined);
    setSelectedMarketId("");
    //window.open("/", "_self");
  };

  const returnPercentage = useMemo(() => {
    if (
      !orderUpdate?.return_percentage ||
      Number(orderUpdate?.return_percentage) === 0
    ) {
      return "0%";
    }

    let returnPercentage = orderUpdate.return_percentage > 0 ? "+ " : "- ";

    returnPercentage += Math.abs(
      Math.round(orderUpdate.return_percentage * 100) / 100,
    );
    returnPercentage += "%";
    return returnPercentage;
  }, [orderUpdate]);

  const orderAmount = useMemo(() => {
    if (orderUpdate?.order_amount && orderUpdate?.order_decimals) {
      return tokenValueFormatter(
        Number(orderUpdate?.order_amount) /
          10 ** Number(orderUpdate?.order_decimals),
      );
    }

    return tokenValueFormatter(0);
  }, [orderUpdate]);

  useEffect(() => {
    getOrder();
  }, [orderUpdate]);

  useEffect(() => {
    console.log("order", orderUpdate);
  }, [orderUpdate]);
  return (
    <>
      <div className="mt-4 flex flex-col items-center p-4">
        <div>
          <img
            src={`/assets/logos/trade-complete.svg`}
            alt={`Morpher Logo`}
            className="mt-2"
          />
        </div>

        <p className="mt-4 text-4xl">{t("TRADE_COMPLETE")}</p>

        {Number(orderUpdate?.close_shares_amount || 0) > 0 ? (
          <p
            className="mt-4 text-center text-lg"
            dangerouslySetInnerHTML={{
              __html: t("TRADE_CLOSE_MESSAGE", {
                PorL:
                  Number(orderUpdate?.return_percentage || 0) >= 0
                    ? t("MESSAGE_PROFIT")
                    : t("MESSAGE_LOSS"),
                market: selectedMarket?.name || orderUpdate?.market_id || "",
                returnPercentage:
                  `<span class="${Number(orderUpdate?.return_percentage || 0) >= 0 ? "text-primary" : "text-secondary"}">` +
                  returnPercentage +
                  "</span>",
              }),
            }}
          />
        ) : (
          <p className="mt-4 text-center text-lg">
            {t("TRADE_OPEN_MESSAGE", {
              type:
                orderUpdate?.direction == "long"
                  ? t("TRADE_LONG")
                  : t("TRADE_SHORT"),
              market: selectedMarket?.name || orderUpdate?.market_id || "",
              amount: orderAmount,
              currency: orderUpdate?.order_currency || 0,
            })}
          </p>
        )}

        <div className="mt-10 w-full">
          {(Number(orderUpdate?.open_mph_token_amount || 0) > 0 ||
            Number(orderUpdate?.return_percentage || 0) > 0) && (
            <Button
              variant="default"
              className="w-full rounded-full"
              onClick={() => share()}
            >
              {t("SHARE")}
            </Button>
          )}
          <Link href="/">
            <Button
              variant="outline"
              className="mt-4 mb-4 w-full rounded-full border-[var(--primary)] text-[var(--primary)]"
              onClick={() => closeTradeComplete()}
            >
              {t("TRADE_AGAIN_BUTTON")}
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
