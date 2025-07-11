import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [base, baseSepolia], 
  connectors: [farcasterFrame()],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
