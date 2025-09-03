"use client";

import { type ReactNode } from "react";
import { base, baseSepolia } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { NextIntlClientProvider } from "next-intl";
import languageData from "../lang/index";

export function Providers(props: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY}
      chain={base}
      rpcUrl="https://base-mainnet.infura.io/v3/783aa55e91654307a788557b041e8222"
      config={{
        appearance: {
          mode: "auto",
          theme: "mini-app-theme",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          logo: process.env.NEXT_PUBLIC_ICON_URL,
        },
      }}
    >
      <NextIntlClientProvider
        locale="en"
        messages={languageData["en"].translation}
      >
        {props.children}
      </NextIntlClientProvider>
    </MiniKitProvider>
  );
}
