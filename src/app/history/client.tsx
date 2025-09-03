"use client";
import { useMarketStore } from "@/store/market";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { TOrder, TORders, usdFormatter } from "morpher-trading-sdk";
import { tokenValueFormatter } from "morpher-trading-sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePortfolioStore } from "@/store/portfolio";
import { Input } from "@/components/ui/input";
import { Filter, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/Footer";

export default function TradeHistoryScreen() {
  const t = useTranslations();

  const account = useAccount();
  const { morpherTradeSDK } = useMarketStore();
  const { currencyList } = usePortfolioStore();
  const [orders, setOrders] = useState<TORders | undefined>(undefined);
  const [filter, setFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<TOrder | undefined>(
    undefined,
  );

  const getSymbol = (market_id?: string) => {
    if (!market_id) {
      return market_id;
    }
    let symbol = market_id;
    if (symbol.includes("_")) {
      symbol = symbol.substring(symbol.indexOf("_") + 1);
    }

    return symbol;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) {
      return timestamp;
    }

    const dt = new Date(timestamp).toLocaleString();

    return dt;
  };

  const selectOrder = (order: TOrder) => {
    setSelectedOrder(order);
  };

  const getOrders = async () => {
    if (account?.address && morpherTradeSDK) {
      try {
        let orders = await morpherTradeSDK.getOrders({
          eth_address: account.address,
        });
        setOrders(orders);
      } catch (err) {
        console.log("No portfolio found");
      }
    }
  };
  useEffect(() => {
    if (account?.address && morpherTradeSDK) {
      getOrders();
    }
  }, [account, morpherTradeSDK]);

  const outputOrder = (order: TOrder) => {
    return (
      <div className="mb-1 flex w-full items-center justify-between border-b-1 pb-1">
        <div className="flex items-center">
          <div
            id="marketName"
            className="flex w-[130px] max-w-[130px] flex-col overflow-hidden text-left"
          >
            <p className="font-semibold">{getSymbol(order?.market_id)}</p>
            <div
              id="marketPercent"
              className={`justify-st\rt flex items-center text-sm ${order.direction == "long" ? "text-primary" : "text-secondary"}`}
            >
              {order.direction == "long" ? t("LONG") : t("SHORT")}
            </div>
          </div>
        </div>

        <div id="marketValue" className="flex flex-col text-left">
          <p className="text-right text-lg font-bold">
            {currencyList?.MPH?.usd_exchange_rate
              ? "$ " +
                usdFormatter(
                  (Number(order.token_amount || 0) / 10 ** 18) *
                    currencyList?.MPH?.usd_exchange_rate,
                )
              : tokenValueFormatter(
                  Number(order.token_amount || 0) / 10 ** 18,
                ) + " MPH"}
          </p>
          <div id="marketPercent" className="text-sm">
            {formatDate(Number(order.oracle_called_at))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mx-4 pb-16">
        <h2 className="mt-4 text-lg font-bold">{t("TRADE_HISTORY")}</h2>

        <div className="relative mt-4">
          <Filter className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("FILTER_BY_SYMBOL")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>

        <div id="order-list" className="mt-4">
          {orders &&
            Object.values(orders)
              .filter((order) =>
                getSymbol(order?.market_id)
                  ?.toLowerCase()
                  .includes(filter.toLowerCase()),
              )
              .map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    selectOrder(order);
                  }}
                >
                  {outputOrder(order)}
                </div>
              ))}
        </div>

        {selectedOrder && (
          <Dialog
            open={!!selectedOrder}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setSelectedOrder(undefined);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{getSymbol(selectedOrder.market_id)}</DialogTitle>
                <DialogDescription>
                  {t("TRADE_DETAILS_DESCRIPTION", {
                    direction:
                      selectedOrder.direction === "long"
                        ? t("LONG")
                        : t("SHORT"),
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-4">
                <div className="grid grid-cols-2 items-center">
                  <p>{t("AMOUNT")}</p>
                  <p className="text-right font-semibold">
                    {currencyList?.MPH?.usd_exchange_rate
                      ? "$ " +
                        usdFormatter(
                          (Number(selectedOrder.token_amount || 0) / 10 ** 18) *
                            currencyList?.MPH?.usd_exchange_rate,
                        )
                      : tokenValueFormatter(
                          Number(selectedOrder.token_amount || 0) / 10 ** 18,
                        ) + " MPH"}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p>{t("DATE_ENTERED")}</p>
                  <p className="text-right font-semibold">
                    {formatDate(Number(selectedOrder.oracle_called_at))}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p>{t("STATUS")}</p>
                  <p className="text-right font-semibold">
                    {selectedOrder.status}
                  </p>
                </div>
                <div className="grid grid-cols-2 items-center">
                  <p>{t("ORDER_ID")}</p>
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-right font-semibold break-all">
                      {selectedOrder.id && selectedOrder.id.length > 10
                        ? `${selectedOrder.id.slice(
                            0,
                            5,
                          )}...${selectedOrder.id.slice(-5)}`
                        : selectedOrder.id}
                    </p>
                    <Copy
                      className="text-muted-foreground h-4 w-4 cursor-pointer"
                      onClick={() =>
                        navigator.clipboard.writeText(selectedOrder.id || "")
                      }
                    />
                  </div>
                </div>
                {selectedOrder.tx_hash && (
                  <div className="grid grid-cols-2 items-center">
                    <p>{t("TRANSACTION_HASH")}</p>
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-right font-semibold break-all">
                        {selectedOrder.tx_hash &&
                        selectedOrder.tx_hash.length > 10
                          ? `${selectedOrder.tx_hash.slice(
                              0,
                              5,
                            )}...${selectedOrder.tx_hash.slice(-5)}`
                          : selectedOrder.tx_hash}
                      </p>
                      <Copy
                        className="text-muted-foreground h-4 w-4 cursor-pointer"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            selectedOrder.tx_hash || "",
                          )
                        }
                      />
                    </div>
                  </div>
                )}
                {selectedOrder.callback_hash && (
                  <div className="grid grid-cols-2 items-center">
                    <p>{t("CALLBACK_HASH")}</p>
                    <div className="flex items-center justify-end gap-2">
                      <p className="text-right font-semibold break-all">
                        {selectedOrder.callback_hash &&
                        selectedOrder.callback_hash.length > 10
                          ? `${selectedOrder.callback_hash.slice(
                              0,
                              5,
                            )}...${selectedOrder.callback_hash.slice(-5)}`
                          : selectedOrder.callback_hash}
                      </p>
                      <Copy
                        className="text-muted-foreground h-4 w-4 cursor-pointer"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            selectedOrder.callback_hash || "",
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              {selectedOrder.tx_hash && (
                <DialogFooter>
                  <Button
                    onClick={() =>
                      window.open(
                        process.env.NEXT_PUBLIC_NODE_ENV !== "development"
                          ? `https://basescan.org/tx/${selectedOrder.tx_hash}`
                          : `https://sepolia.basescan.org/tx/${selectedOrder.tx_hash}`,
                        "_blank",
                      )
                    }
                  >
                    Show Transaction
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Footer />
    </>
  );
}
