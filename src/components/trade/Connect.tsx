import { useConnect } from "wagmi";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { Button } from "../ui/button";

export function Connect() {
  const { connect, connectors } = useConnect();
  return (
    <Button className="mt-4 w-full" onClick={() => connect({ connector: connectors[0] })}>
      Connect
    </Button>
  );
}
