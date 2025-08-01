import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import {  baseSepolia, base } from "wagmi/chains"; 

const chain = import.meta.env.VITE_NODE_ENV == 'development' ? baseSepolia : base

export const config = createConfig({
  chains: [chain], // base, 
  connectors: [farcasterFrame()],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http('https://base-mainnet.infura.io/v3/783aa55e91654307a788557b041e8222'), // TEMPORARY - trial user - set this from the backend 
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
