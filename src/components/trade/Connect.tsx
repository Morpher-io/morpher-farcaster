import { useConnect } from "wagmi";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { Button } from "../ui/button";

export function Connect() {
  const { connect, connectors } = useConnect();
  return (
    <div className="bg-[var(--primary)] flex flex-col items-center p-4" style={{ minHeight: 'calc(100vh)' }}>
      <div className="flex-1 flex items-center justify-center">
        <div id="logo-text" className=" flex flex-col items-center">
          <img
            src={`/src/assets/logos/morpher.svg`}
            alt={`Morpher Logo`}
            className="h-25 w-25 animate-spin [animation-duration:20s]"
          />
          <p className="text-white mt-4 text-xl">Ready to flip your next trade?</p>
        </div>
      </div>
      <Button className="w-full bg-white text-[var(--primary)] hover:bg-white/90 rounded-full mb-8" onClick={() => connect({ connector: connectors[0] })}>
        Connect Wallet
      </Button>
    </div>
    
  );
}
