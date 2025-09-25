import { useEffect, useState } from "react";
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
import { sdk } from "@farcaster/miniapp-sdk";
import { useTranslation } from "react-i18next";
import { Onboarding } from "./components/app/Onboarding";



const ONBOARDING_KEY = 'morpher-onboarding-complete';

function App() {

  const [showOnboarding, setShowOnboarding] = useState(false);
  const { morpherTradeSDK  } = useMarketStore();
  const { setEthAddress, tradeComplete, setContext, context  } = usePortfolioStore();
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { address, isConnected } = useAccount();

  const { i18n: {changeLanguage, language} } = useTranslation();
  
  useEffect(() => {
    const onboardingComplete = localStorage.getItem(ONBOARDING_KEY);
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

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
          profile_image: context.user.pfpUrl,
          platformType: context?.client?.platformType || '',
          clientFid: context?.client?.clientFid,
          added: context?.client?.added,
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

  const sdkActions = async () => {
    try {
      await sdk.actions.ready();

      if (import.meta.env.VITE_NODE_ENV !== 'development') {
        if (context && !context.added) {
          await sdk.actions.addMiniApp()
        }
      }
    } catch (err:any) {
      console.log('Error adding mini app: ' + err.toString())
    }
  }

  useEffect(() => {
    sdkActions()
    
  }, [context])
  

  return (
    <Router>
      {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}
      <Layout>
        { (isConnected && !tradeComplete) && (
          <Header onHelpClick={handleShowOnboarding} />
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
