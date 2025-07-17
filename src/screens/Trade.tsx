import { useAccount } from "wagmi";
import { TradeTerminal } from "../components/trade/TradeTerminal";
import { Connect } from "../components/trade/Connect";
import { usePortfolioStore } from "@/store/portfolio";
import { useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";



function ConnectMenu() {
  const { isConnected } = useAccount();
  if (isConnected) {
    return <TradeTerminal />;
  }

  return <Connect />;
}


export function TradeScreen() {
   const { isConnected } = useAccount();
  const { 
      loading,
      setLoading,
  } = usePortfolioStore(); 

   useEffect(() => {
      if (!isConnected && loading) {
          setLoading(false);
      }
        sdk.actions.ready();


   }, [isConnected, loading])
  


    return (
        <>
            <ConnectMenu />
        </>
    );
}
