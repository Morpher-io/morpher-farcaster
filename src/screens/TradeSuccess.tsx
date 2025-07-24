
import { useMarketStore } from "@/store/market";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";
import { Button } from "@/components/ui/button";
import { sdk } from "@farcaster/frame-sdk";
import { usdFormatter } from "morpher-trading-sdk";
import { useNavigate } from "react-router-dom";

export function TradeSuccessScreen() {
  const navigate = useNavigate();

   const account: any = useAccount();
    
    const { selectedMarket, order, setOrder, morpherTradeSDK, marketListAll, setSelectedMarket, setTradeType, setLeverage } = useMarketStore();
    const { setTradeComplete, selectedCurrency, tradeAmount, orderUpdate, tradeComplete, setTradeAmount, setClosePercentage } = usePortfolioStore();

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

  useEffect(() => {

    if (marketListAll && order && order.market_id && selectedMarket?.market_id !== order.market_id ) {
      let market = marketListAll[order.market_id]
      setSelectedMarket(market)
    }
  }, [marketListAll, order, selectedMarket ])
    const share = async () => {

        let text = `I just ${
          order?.direction == "long" ? "traded" : "shorted"
        } ${
          selectedMarket?.name || order?.market_id
        } with ${tradeAmount} ${selectedCurrency} on Morpher!`;

        if (Number(order?.close_shares_amount || 0) > 0) {
          text = `I just made +1.12% profit trading ${
          selectedMarket?.name || order?.market_id
        } on Morpher!`;
        }

        const embeds:[string] = [`https://www.morpher.com/`];

        await sdk.actions.composeCast({
          text,
          embeds,
        });
    }

    const closeTradeComplete = () => {
     setTradeComplete(false)   
     navigate('/')
    }

    useEffect(() => {
      if (tradeComplete) {
        setTradeAmount('')
        setClosePercentage(undefined)
        setTradeType('long')
        setLeverage([1])
        console.log('trade reset')

      }
    }, [tradeComplete])

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
          <p className="text-lg mt-4 text-center">
            {(Number(order?.close_shares_amount || 0) > 0) ? <>
              You just closed your {" "}
            {selectedMarket?.name || order?.market_id} position and made <span className="text-primary">+ 1.12% ($ {usdFormatter(Number(order?.close_shares_amount || 0) * Number(order?.price || 0) / 10**18)})</span>
            </> : <>
              You just {order?.direction == "long" ? "traded" : "shorted"}{" "}
              {selectedMarket?.name || order?.market_id} with {tradeAmount} {selectedCurrency}
            </>}
            
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
              className="w-full text-[var(--primary)] border-[var(--primary)] mt-4 mb-4 rounded-full "
              onClick={() => closeTradeComplete()}
            >
              Try another Trade
            </Button>
          </div>
        </div>
      </>
    );
}
