import * as React from "react";
import { useAccount, useSignMessage, useChainId, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { MarketSelector } from "./MarketSelector";
import { TokenSelector } from "./TokenSelector";
import { ArrowUpDown } from "lucide-react";
import { usePortfolioStore } from "@/store/portfolio";
import { PositionSelector } from "./PositionSelector";
import { ClosePosition } from "./ClosePosition";


function SignButton() {
  const { signMessage, isPending, data, error } = useSignMessage();
  

    const chainId = useChainId()
    

    console.log('chainId', chainId)

  return (
    <>
      <Button type="button" onClick={() => signMessage({ message: "hello world" })} disabled={isPending}>
        {isPending ? "Signing..." : "Sign message"}
      </Button>
      {data && (
        <>
          <div>Signature</div>
          <div>{data}</div>
        </>
      )}
      {error && (
        <>
          <div>Error</div>
          <div>{error.message}</div>
        </>
      )}
    </>
  );
}

export function TradeTerminal() {
  const { address } = useAccount();
  const {tradeDirection, setTradeDirection} = usePortfolioStore();

  const handleSwap = () => {
    if (tradeDirection == 'open') {
      setTradeDirection('close')
    } else {
      setTradeDirection('open')
    }
  };

  const first = tradeDirection === 'close' ? <PositionSelector /> : <TokenSelector />;
  const second = tradeDirection === 'close' ? <ClosePosition /> : <MarketSelector />;

  return (
    <>
      <div className="mt-5 mx-4 mb-6">
        {first}
        <div className="relative my-2 flex justify-center">
          {/* <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div> */}
          <Button
            variant="ghost"
            size="icon"
            className="relative z-10 size-12 rounded-full bg-background"
            onClick={handleSwap}
          >
            <img
                src={`/src/assets/icons/switch.svg`}
                alt={`Switch Direction`}
                 />
          </Button>
        </div>
        {second}
      </div>
      {/* <div>Connected account:</div>
      <div>{address}</div>
      <SignButton />
      <BalanceChecker /> */}
    </>
  );
}
