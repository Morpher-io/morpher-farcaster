
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
    
    const { selectedMarket,  morpherTradeSDK, marketListAll, setSelectedMarket, setTradeType, setLeverage } = useMarketStore();
    const { setTradeComplete, selectedCurrency, tradeAmount, orderUpdate, tradeComplete, setTradeAmount, setClosePercentage } = usePortfolioStore();

      const getOrder = async () => {
    if (account.address === undefined) {
      return;
    }
 
  };

  useEffect(() => {

    if (marketListAll && orderUpdate && orderUpdate.market_id && selectedMarket?.market_id !== orderUpdate.market_id ) {
      let market = marketListAll[orderUpdate.market_id]
      setSelectedMarket(market)
    }
  }, [marketListAll, orderUpdate, selectedMarket ])
    const share = async () => {

        let text = `I just ${
          orderUpdate?.direction == "long" ? "traded" : "shorted"
        } ${
          selectedMarket?.name || orderUpdate?.market_id
        } with ${tradeAmount} ${selectedCurrency} on Morpher!`;

        if (Number(orderUpdate?.close_shares_amount || 0) > 0) {
          text = `I just made +1.12% profit trading ${
          selectedMarket?.name || orderUpdate?.market_id
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
        console.log('order', orderUpdate)
    }, [orderUpdate])
    return (
      <>
        <div
          className=" flex flex-col items-center mt-4 p-4"
          
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
            {(Number(orderUpdate?.close_shares_amount || 0) > 0) ? <>
              You just closed your {" "}
            {selectedMarket?.name || orderUpdate?.market_id} position and made <span className="text-primary">+ 1.12% ($ {usdFormatter(Number(orderUpdate?.close_shares_amount || 0) * Number(orderUpdate?.price || 0) / 10**18)})</span>
            </> : <>
              You just {orderUpdate?.direction == "long" ? "traded" : "shorted"}{" "}
              {selectedMarket?.name || orderUpdate?.market_id} with {tradeAmount} {selectedCurrency}
            </>}
            
          </p>

          <div className="mt-10 w-full">
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
