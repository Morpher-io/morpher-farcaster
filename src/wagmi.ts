import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import {  baseSepolia } from "wagmi/chains"; //base,

export const config = createConfig({
  chains: [baseSepolia], // base, 
  connectors: [farcasterFrame()],
  transports: {
    //[base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
