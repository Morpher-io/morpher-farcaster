import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import {  baseSepolia, base } from "wagmi/chains"; 

const chain = import.meta.env.VITE_NODE_ENV == 'development' ? baseSepolia : base

export const config = createConfig({
  chains: [chain], // base, 
  connectors: [farcasterFrame()],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
