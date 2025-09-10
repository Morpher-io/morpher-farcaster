"use client";
import { Connect } from "@/components/Connect";
import { useMarketStore } from "@/store/market";
import { usePortfolioStore } from "@/store/portfolio";
import { useAccount } from "wagmi";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import { useCallback, useEffect, useState } from "react";
import { TradeTerminal } from "@/components/TradeTerminal";
import { Footer } from "@/components/Footer";
import { TradeSuccessScreen } from "@/components/TradeSuccess";

export default function Home() {
  const { setEthAddress, tradeComplete, setContext } = usePortfolioStore();
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const { address, isConnected } = useAccount();
  const { morpherTradeSDK } = useMarketStore();

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();

      if (process.env.NODE_ENV !== 'development') {
        handleAddFrame()
      }
    
    }
  }, [setFrameReady, isFrameReady]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  useEffect(() => {
    if (address) {
      setEthAddress(address as `0x${string}`);
    } else {
      setEthAddress(undefined);
    }
  }, [address]);

  useEffect(() => {
    if (context && address) {
      let user_data = {
        app: process.env.NEXT_PUBLIC_MORPHER_APP_NAME || "",
        id: context.user.fid.toString(),
        user_name: context.user.username,
        display_name: context.user.displayName,
        eth_address: address,
        profile_image: context.user.pfpUrl,
      };

      setContext(user_data);
    }

  }, [morpherTradeSDK, address, context]);

  return (
    <>
      {tradeComplete ? (
        <>
          <TradeSuccessScreen />
        </>
      ) : (
        <>
          {isConnected ? (
            <>
              <div className="pb-16">
                <TradeTerminal />
              </div>

              <Footer />
            </>
          ) : (
            <>
              <Connect />
            </>
          )}
        </>
      )}
    </>
  );
}
