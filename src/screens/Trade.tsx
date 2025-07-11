import { useAccount } from "wagmi";
import { TradeTerminal } from "../components/trade/TradeTerminal";
import { Connect } from "../components/trade/Connect";



function ConnectMenu() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return <TradeTerminal />;
  }

  return <Connect />;
}


export function TradeScreen() {
    return (
        <>
            <ConnectMenu />
        </>
    );
}
