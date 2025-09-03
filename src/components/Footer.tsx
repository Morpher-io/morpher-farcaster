"use client";
import React from "react";
import { useAccount } from "wagmi";
import { usePortfolioStore } from "@/store/portfolio";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
//import { useRouter } from 'next/router';

import Link from "next/link";

export function Footer() {
  const { isConnected } = useAccount();
  const { tradeComplete } = usePortfolioStore();
  const router = {
    pathname: window.location.pathname,
  };

  const t = useTranslations();

  const menuItems = [
    { path: "/", label: t("menu.HOME"), image: "home" },
    { path: "/portfolio", label: t("menu.PORTFOLIO"), image: "portfolio" },
    {
      path: "/leaderboard",
      label: t("menu.LEADERBOARD"),
      image: "leaderboard",
    },
    { path: "/history", label: t("menu.HISTORY"), image: "history" },
  ];

  return (
    <>
      {isConnected && !tradeComplete && (
        <footer className="border-border bg-background fixed bottom-0 z-50 w-full shrink-0 border-t">
          <nav className="flex h-16 items-center justify-around">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "text-muted-foreground flex flex-col items-center gap-1 p-2 text-xs hover:bg-gray-100",
                  router.pathname === item.path && "text-primary",
                )}
              >
                <div
                  className={cn(
                    "bg-muted-foreground h-5 w-5",
                    router.pathname === item.path && "bg-primary",
                  )}
                  style={{
                    mask: `url(/assets/icons/${item.image.toLowerCase()}.svg) no-repeat center / contain`,
                    WebkitMask: `url(/assets/icons/${item.image.toLowerCase()}.svg) no-repeat center / contain`,
                  }}
                />
                <span className="mt-0 font-semibold">{item.label}</span>
              </Link>
            ))}
          </nav>
        </footer>
      )}
    </>
  );
}
