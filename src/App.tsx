import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TradeScreen } from "./screens/Trade";
import { TradeHistoryScreen } from "./screens/TradeHistory";
import { PortfolioScreen } from "./screens/Portfolio";
import { Layout } from "./components/layout/Layout";
import { Header } from "./components/app/Header";
import { usePortfolioStore } from "./store/portfolio";
import { Loader2 } from "lucide-react";



function App() {
  const { loading, setEthAddress } = usePortfolioStore();
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { address } = useAccount();
  

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
        <Header />
        <main>
          {loading && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-16 w-16 animate-spin" />
              <p className="mt-4">Loading...</p>
            </div>
          )}
          <Routes>
            <Route path="/" element={<TradeScreen />} />
            <Route path="/history" element={<TradeHistoryScreen />} />
            <Route path="/portfolio" element={<PortfolioScreen />} />
          </Routes>
          
        </main>
      </Router>
    </Layout>
  );
}

export default App;
