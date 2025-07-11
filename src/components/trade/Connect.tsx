import { useConnect } from "wagmi";
import { ShinyButton } from "@/components/magicui/shiny-button";

export function Connect() {
  const { connect, connectors } = useConnect();
  return (
    <ShinyButton onClick={() => connect({ connector: connectors[0] })}>
      Connect
    </ShinyButton>
  );
}
