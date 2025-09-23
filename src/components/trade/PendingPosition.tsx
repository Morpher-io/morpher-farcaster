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
  TMarketDetail,
  tokenValueFormatter,
  TradeCallback,
} from "morpher-trading-sdk";
import { useTranslation } from "react-i18next";

interface PendingPositionProps {
  marketData: TMarketDetail;
}
import { sdk } from "@farcaster/miniapp-sdk";

export function PendingPosition({ marketData }: PendingPositionProps) {
  const { t } = useTranslation();
  
  const { morpherTradeSDK, order, setOrder, selectedMarket } = useMarketStore();

  const account: any = useAccount();
  const [closeExecuting, setCloseExecuting] = useState(false);
  const [tradeError, setTradeError] = useState<string | undefined>(undefined);
  const { data: walletClient } = useWalletClient();
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

      const share = async () => {
  
        let leverage = ''
        if (order?.leverage && Number(order.leverage) / 10**8 > 1) {
          leverage += t('TRADE_OPEN_LEVERAGE', {leverage:  Number(order.leverage)/ 10**8 })
        }
  
        let text = t('TRADE_OPEN_SHARE', {leverage: leverage, type: order?.direction == "long" ? t("MESSAGE_LONG") : t("MESSAGE_SHORT"), market: selectedMarket?.name || order?.market_id, currency:order?.order_currency})
        
        text += '!'
  
  
        if (Number(order?.close_shares_amount || 0) > 0) {
          text = t('TRADE_CLOSE_SHARE', {market: selectedMarket?.name || order?.market_id, returnPercentage: 0})
        }
  
        const embeds:[string] = [`https://farcaster.xyz/miniapps/dWezHCjv5UqF/morpher`];
  
        await sdk.actions.composeCast({
          text,
          embeds,
        });
      }

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
          <CardTitle>{t('PENDING_ORDER')}</CardTitle>
          <CardDescription>
            {t('ORDER_EXECUTION')}

              {((Number(order?.open_mph_token_amount || 0) > 0)) && (
            <Button
              variant="default"
              className="w-full mt-2"
              onClick={() => share()}
            >
              {t('SHARE')}
            </Button>
            )}
            
          </CardDescription>
        </CardHeader>
        <CardContent>
       
        {!marketData?.market_id?.includes('CRYPTO_') && (
          <p className="text-sm font-normal">
            {t('ORDER_MARKET_HOURS')}
          </p>
          )}

          {tradeError && (
            <div className="text-red-500 text-sm mt-2">{tradeError}</div>
          )}
          {order && (
            <div className="mt-2">
              <p className="text-sm">{t('ORDER_DETAILS')}:</p>
              <p className="text-xs text-muted-foreground truncate mt-2">
                <b>{t('ORDER_ID')}:</b> {marketData?.pending_order_id}
              </p>

              {
                (Number(order?.close_shares_amount || 0 ) > 0) ? (
                <p className="text-xs text-muted-foreground">
                  <b>{t('CLOSING')}</b>
                </p>) : (
                <p className="text-xs text-muted-foreground">
                  <b>{t('AMOUNT')}</b>:{" "}
                  {tokenValueFormatter(
                    Number(order.open_mph_token_amount || 0) / 10 ** 18
                  )}{" "}
                    MPH
                  </p>)
                }
              
      
              <p className="text-xs text-muted-foreground">
                <b>{t('PRICE')}</b>: $ {tokenValueFormatter(Number(order.price || 0) / 10**8)}
              </p>
              <p className="text-xs text-muted-foreground">
                <b>{t('DATE_ENTERED')}</b>: {(order.created_at) ? new Date(Number(order.created_at)).toDateString() : ''}
              </p>
            </div>
          )}

          <Button className="w-full mt-4 text-muted-foreground" onClick={executeClose} variant={"outline"}>
            {closeExecuting && <Loader2Icon className="animate-spin" />}
            <span className="">{t('CANCEL_ORDER_BUTTON')}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
