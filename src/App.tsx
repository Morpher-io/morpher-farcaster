import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TradeScreen } from "./screens/Trade";
import { TradeHistoryScreen } from "./screens/TradeHistory";
import { TradeSuccessScreen } from "./screens/TradeSuccess";
import { LeaderboardScreen } from "./screens/Leaderboard";

import { PortfolioScreen } from "./screens/Portfolio";
import { Layout } from "./components/layout/Layout";
import { Header } from "./components/app/Header";
import { usePortfolioStore } from "./store/portfolio";
import { useMarketStore } from "./store/market";
import { sdk } from "@farcaster/frame-sdk";
import { useTranslation } from "react-i18next";



function App() {

  const { morpherTradeSDK  } = useMarketStore();
  const { setEthAddress, tradeComplete, setContext  } = usePortfolioStore();
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { address, isConnected } = useAccount();

  const { i18n: {changeLanguage, language} } = useTranslation();
  

  useEffect(() => {
    if (language && language  !== 'en') {
      changeLanguage('en')
    }
    
  }, [language])

  

  useEffect(() => {
    if (morpherTradeSDK.ready && address) {
      sdk.context.then(context => {
        
        let user_data = {
          app: import.meta.env.VITE_MORPHER_APP_NAME,
          id: context.user.fid.toString(),
          user_name: context.user.username,
          display_name: context.user.displayName,
          eth_address: address,
          profile_image: context.user.pfpUrl
        }

        setContext(user_data)

        

      })
        
    }
      
  }, [morpherTradeSDK.ready, address]);

  useEffect(() => {
    if (chainId !== 84532) {
      switchChain({ chainId: 84532 })
    }
  }, [chainId]);

  useEffect(() => {
    if (address) {
      setEthAddress(address as `0x${string}`);
    } else {
      setEthAddress(undefined);
    }
  }, [address]);

  useEffect(() => {
    sdk.actions.ready();
  }, [])
  

  return (
    <Router>
      <Layout>
        { (isConnected && !tradeComplete) && (
          <Header />
        )}
        
        <main>

          {tradeComplete ? (
            <>
              <TradeSuccessScreen />
            </>
          ) : (
            <>
            <Routes>
              <Route path="/" element={<TradeScreen />} />
              <Route path="/history" element={<TradeHistoryScreen />} />
              <Route path="/portfolio" element={<PortfolioScreen />} />
              <Route path="/leaderboard" element={<LeaderboardScreen />} />
            </Routes>
            </>
          )}
          
          
        </main>
      </Layout>
    </Router>
  );
}

export default App;
