import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMarketStore } from "@/store/market";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
import {
  tokenValueFormatter,
  TradeCallback,
} from "morpher-trading-sdk";

export function PendingPosition() {
  const { marketData, morpherTradeSDK, order, setOrder } = useMarketStore();

  const account: any = useAccount();
  const [closeExecuting, setCloseExecuting] = useState(false);
  const [tradeError, setTradeError] = useState<string | undefined>(undefined);
  const { data: walletClient, isError, isLoading } = useWalletClient();
  const publicClient: any = usePublicClient();

  const getOrder = async () => {
    if (account.address === undefined) {
      return;
    }
    let orders = await morpherTradeSDK.getOrders({
      eth_address: account.address,
      order_id: marketData?.pending_order_id,
    });
    if (orders && orders.length > 0) {
      setOrder(orders[0]);
    }
  };

  useEffect(() => {
    if (account.address && marketData?.pending_order_id) {
      getOrder();
    }
  }, [account]);

  const cancelComplete = (result: TradeCallback) => {
    if (result.result === "error") {
      setTradeError(
        result.err || "An error occurred while executing the trade."
      );
    }

    console.log("tradeComplete", result);
    setTimeout(() => {
      setCloseExecuting(false);
    }, 2000);
  };

  const executeClose = () => {
    try {
      setTradeError(undefined);
      if (closeExecuting) {
        return;
      }
      setCloseExecuting(true);

      if (!marketData?.pending_order_id) {
        return;
      }

      morpherTradeSDK.cancelOrder({
        account,
        walletClient: walletClient as any,
        publicClient,
        order_id: marketData?.pending_order_id,
        market_id: marketData?.market_id,
        callback: cancelComplete,
      });
    } catch (err: any) {
      console.error("Error executing trade:", err);
      setCloseExecuting(false);
      setTradeError(
        err.message || "An error occurred while executing the trade."
      );
    }
  };

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Pending Position</CardTitle>
          <CardDescription>
            Your trade is currently being processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            Your order will be executed shortly.
          </p>
          <p className="text-xs text-muted-foreground truncate mt-2">
            Order ID: {marketData?.pending_order_id}
          </p>
          <Button className="w-full mt-4" onClick={executeClose} variant={"default"}>
            {closeExecuting && <Loader2Icon className="animate-spin" />}
            <span className="text-white">Cancel Order</span>
          </Button>

          {tradeError && (
            <div className="text-red-500 text-sm mt-2">{tradeError}</div>
          )}
          {order && (
            <div className="mt-2">
              <p className="text-sm">Order Details:</p>
              <p className="text-xs text-muted-foreground">
                Type: {order.type}
              </p>
              <p className="text-xs text-muted-foreground">
                Amount:{" "}
                {tokenValueFormatter(
                  Number(order.open_mph_token_amount || 0) / 10 ** 18
                )}{" "}
                MPH
              </p>
              <p className="text-xs text-muted-foreground">
                Price: {order.price}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
