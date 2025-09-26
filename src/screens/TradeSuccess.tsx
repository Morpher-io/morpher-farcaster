
import { useMarketStore } from "@/store/market";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";
import { Button } from "@/components/ui/button";
import { sdk } from "@farcaster/miniapp-sdk";
import { tokenValueFormatter, usdFormatter } from "morpher-trading-sdk";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format as formatDate } from "date-fns";

export function TradeSuccessScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  

   const account: any = useAccount();
    
    const { selectedMarket,  marketListAll, setSelectedMarket, setSelectedMarketId } = useMarketStore();
    const { setTradeComplete, orderUpdate, context } = usePortfolioStore();
    const [ usdValue, setUsdValue ] = useState('')

      const getOrder = async () => {

        if (orderUpdate)
        
    if (account.address === undefined) {
      return;
    }
 
  };

  useEffect(() => {


    let orderAmout = 0;
    let orderAmoutUsd = 0;

    if (orderUpdate?.order_amount && orderUpdate?.order_decimals) {
        orderAmout = Number(orderUpdate?.order_amount) / 10**Number(orderUpdate?.order_decimals)
      } else {
        setUsdValue('')
        return
      }
      if (!marketListAll) {
        setUsdValue('')
        return
      }

    if (orderUpdate?.order_currency == 'USDC') {
      orderAmoutUsd = orderAmout
    } else if (orderUpdate?.order_currency == 'MPH') {
      orderAmoutUsd = orderAmout * Number(orderUpdate?.mph_price || 0) / 10**8

    }  else if (orderUpdate?.order_currency == 'ETH') {
      let market = marketListAll['CRYPTO_ETH']

      orderAmoutUsd = orderAmout * market.close
    }

    setUsdValue(usdFormatter(orderAmoutUsd))

  }, [orderUpdate])

  

  useEffect(() => {

    if (marketListAll && orderUpdate && orderUpdate.market_id && selectedMarket?.market_id !== orderUpdate.market_id ) {
      let market = marketListAll[orderUpdate.market_id]
      setSelectedMarket(market)
    }
  }, [marketListAll, orderUpdate, selectedMarket ])
    const share = async () => {

      let leverage = ''
      if (orderUpdate?.leverage && Number(orderUpdate.leverage) / 10**8 > 1) {
        leverage += t('TRADE_OPEN_LEVERAGE', {leverage:  Number(orderUpdate.leverage)/ 10**8 })
      }

      let text = t('TRADE_OPEN_SHARE', {leverage: leverage, type: orderUpdate?.direction == "long" ? t("MESSAGE_LONG") : t("MESSAGE_SHORT"), market: selectedMarket?.name || orderUpdate?.market_id, currency:orderUpdate?.order_currency})
      
      text += '!'


      if (Number(orderUpdate?.close_shares_amount || 0) > 0) {
        text = t('TRADE_CLOSE_SHARE', {market: selectedMarket?.name || orderUpdate?.market_id, returnPercentage})
      }

      const embeds:[string] = [`https://farcaster.xyz/miniapps/dWezHCjv5UqF/morpher`];

      await sdk.actions.composeCast({
        text,
        embeds,
      });
    }

    const closeTradeComplete = () => {
     setTradeComplete(false)   
     setSelectedMarket(undefined)
     setSelectedMarketId('')
     navigate('/')
    }

    const returnPercentage  = useMemo(() => {
      if (!orderUpdate?.return_percentage || Number(orderUpdate?.return_percentage) === 0) {
        return '0%'
      }
      
      let returnPercentage = orderUpdate.return_percentage > 0 ? '+ ' : '- ';
      
      returnPercentage += Math.abs(Math.round(orderUpdate.return_percentage * 100) / 100 )
      returnPercentage += '%'
      return returnPercentage

    }, [orderUpdate])

    const orderAmount = useMemo(() => {
      if (orderUpdate?.order_amount && orderUpdate?.order_decimals) {
        return tokenValueFormatter(Number(orderUpdate?.order_amount) / 10**Number(orderUpdate?.order_decimals))
      }

      return tokenValueFormatter(0);

    }, [orderUpdate])
    

    


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
              src={`/assets/logos/trade-complete.svg`}
              alt={`Morpher Logo`}
              className="mt-2"
            />
          </div>
          

          <p className="text-4xl mt-4">{t('TRADE_COMPLETE')}</p>
          
          {(Number(orderUpdate?.close_shares_amount || 0) > 0) ? <p className="text-lg mt-4 text-center" dangerouslySetInnerHTML={{ __html: t('TRADE_CLOSE_MESSAGE', {username: context?.display_name ,PorL: Number(orderUpdate?.return_percentage || 0) >= 0 ? t("MESSAGE_PROFIT") : t("MESSAGE_LOSS"), market: selectedMarket?.name || orderUpdate?.market_id, returnPercentage: `<span class="${(Number(orderUpdate?.return_percentage || 0) >= 0 ? 'text-primary' : 'text-secondary')}">` + returnPercentage + "</span>"  }) }} /> 
          : <p className="text-lg mt-4 text-center">
            {t('TRADE_OPEN_MESSAGE', {username: context?.display_name , usdamount: (usdValue || '??') , type: orderUpdate?.direction == "long" ? t("TRADE_LONG") : t("TRADE_SHORT"), market: selectedMarket?.name || orderUpdate?.market_id, amount: orderAmount, currency:orderUpdate?.order_currency  })}
          </p>}
          
          <div className="mt-10 w-full">

            {((Number(orderUpdate?.open_mph_token_amount || 0) > 0) || (Number(orderUpdate?.return_percentage || 0) > 0)) && (
            <Button
              variant="default"
              className="w-full "
              onClick={() => share()}
            >
              {t('SHARE')}
            </Button>
            )}
            <Button
              variant="outline"
              className="w-full text-[var(--primary)] border-[var(--primary)] mt-4 mb-4 rounded-full "
              onClick={() => closeTradeComplete()}
            >
              {t('TRADE_AGAIN_BUTTON')}
              
            </Button>

            <p className="text-center text-sm">{formatDate(new Date(), "dd/MM/yyyy HH:mm") }</p>
          </div> 
        </div>
      </>
    );
}
