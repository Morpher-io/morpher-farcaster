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
import { Loader2 } from "lucide-react";
import { useMarketStore } from "./store/market";
import { sdk } from "@farcaster/frame-sdk";



function App() {

  

  const { morpherTradeSDK  } = useMarketStore();
  const { loading, setEthAddress, tradeComplete, setContext  } = usePortfolioStore();
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { address, isConnected } = useAccount();
  

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
  

  return (
    <Layout>
      <Router>
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
              {loading && (
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 className="h-16 w-16 animate-spin" />
                <p className="mt-4">Loading...</p>
              </div>
            )}
            <Routes>
              <Route path="/" element={<TradeScreen />} />
              <Route path="/history" element={<TradeHistoryScreen />} />
              <Route path="/portfolio" element={<PortfolioScreen />} />
              <Route path="/leaderboard" element={<LeaderboardScreen />} />
            </Routes>
            </>
          )}
          
          
        </main>
      </Router>
    </Layout>
  );
}

export default App;
