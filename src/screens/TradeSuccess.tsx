
import { useMarketStore } from "@/store/market";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";
import { Button } from "@/components/ui/button";
import { sdk } from "@farcaster/frame-sdk";

export function TradeSuccessScreen() {

      const account: any = useAccount();
    
    const { selectedMarket, order, setOrder, morpherTradeSDK } = useMarketStore();
    const { setTradeComplete, selectedCurrency, tradeAmount, orderUpdate } = usePortfolioStore();

      const getOrder = async () => {
    if (account.address === undefined) {
      return;
    }
    let orders = await morpherTradeSDK.getOrders({
      eth_address: account.address,
      order_id: orderUpdate?.data.orderId,
    });
    if (orders && orders.length > 0) {
      setOrder(orders[0]);
    }
  };

    const share = async () => {
        const text = `I just ${
          order?.direction == "long" ? "traded" : "shorted"
        } ${
          selectedMarket?.name || order?.market_id
        } with ${tradeAmount} ${selectedCurrency} on Morpher!`;
        const embeds:[string] = [`https://www.morpher.com/`];

        await sdk.actions.composeCast({
          text,
          embeds,
        });
    }

    const closeTradeComplete = () => {
     setTradeComplete(false)   
    }

    useEffect(() => {
        getOrder()
    }, [orderUpdate])

    useEffect(() => {
        console.log('order', order)
    }, [order])
    return (
      <>
        <div
          className=" flex flex-col items-center mt-8 p-4"
          style={{ minHeight: "calc(100vh" }}
        >
          <div>
            <img
              src={`/src/assets/logos/trade-complete.svg`}
              alt={`Morpher Logo`}
              className="mt-2"
            />
          </div>

          <p className="text-4xl mt-4">Trade Complete</p>
          <p className="text-lg mt-4">
            You just {order?.direction == "long" ? "traded" : "shorted"}{" "}
            {selectedMarket?.name || order?.market_id} with {tradeAmount} {selectedCurrency}
          </p>

          <div className="mt-auto mb-8 w-full">
            <Button
              variant="default"
              className="w-full hover:bg-white/90 rounded-full "
              onClick={() => share()}
            >
              Share
            </Button>
            <Button
              variant="outline"
              className="w-full text-[var(--primary)] border-[var(--primary)] hover:bg-white/90 mt-4 mb-4 rounded-full "
              onClick={() => closeTradeComplete()}
            >
              Try another Trade
            </Button>
          </div>
        </div>
      </>
    );
}
