"use client";
import { usePortfolioStore } from "@/store/portfolio";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  usdFormatter,
  TLeaderBoard,
  TAddress,
  TOrder,
  tokenValueFormatter,
} from "morpher-trading-sdk";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMarketStore } from "@/store/market";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/Footer";
import { useViewProfile } from "@coinbase/onchainkit/minikit";

export default function LeaderboardScreen() {
  const t = useTranslations();
  const account = useAccount();
  const { getLeaderboard, leaderboard } = usePortfolioStore();
  const [filter] = useState("");
  const [type, setType] = useState<"returns" | "order">("returns");
  let router = useRouter();
  const { morpherTradeSDK } = useMarketStore();
  const [selectedEntry, setSelectedEntry] = useState<TLeaderBoard>();

  const [order, setOrder] = useState<TOrder>();

  const [portfolio, setPortfolio] = useState<any>();

  let viewProfile = useViewProfile();

  const types: any = {};
  const type_list: any = {
    UNIQUE: "Unique",
    CRYPTO: "Crypto",
    STOCK: "Stock",
    FOREX: "Forex",
    F1: "F1",
    MLB: "Major League Baseball",
    INDEX: "Index",
    COMMODITY: "Commodity",
  };

  const openPortfolio = async (entry: TLeaderBoard) => {
    setSelectedEntry(entry);
    let positions = await morpherTradeSDK.getPositions({
      eth_address: entry.eth_address.toLowerCase() as TAddress,
    });

    let position_count = 0;
    let total_value = 0;

    positions.forEach((pos) => {
      position_count += 1;
      total_value += Number(pos.value || 0) / 10 ** 18;
      if (pos.market_id) {
        let type_unformatted = pos.market_id.split("_")[0];
        if (type_unformatted) {
          const type = type_list[type_unformatted.toUpperCase()];
          if (type) {
            if (!types[type]) {
              types[type] = 0;
            }
            types[type] += Number(pos.value || 0) / 10 ** 18;
          } else {
            console.log("unknown type", type_unformatted);
          }
        }
      }
    });

    setPortfolio({ position_count, total_value, types });
  };

  const openTrade = async (entry: TLeaderBoard) => {
    setSelectedEntry(entry);
    if (!entry.order_id) {
      return;
    }
    let orders = await morpherTradeSDK.getOrders({
      eth_address: entry.eth_address.toLowerCase() as TAddress,
      order_id: entry.order_id.toLowerCase(),
    });

    if (orders && orders.length > 0) {
      setOrder(orders[0]);
    }
  };

  const followUser = () => {
    if (selectedEntry?.id) viewProfile(Number(selectedEntry.id));
  };

  useEffect(() => {
    if (account?.address) {
      getLeaderboard({
        eth_address: account?.address,
        app: process.env.NEXT_PUBLIC_MORPHER_APP_NAME || "",
        type: type,
      });
    }
  }, [account, getLeaderboard, type]);

  const outputLeaderboardEntry = (entry: TLeaderBoard, rank: number) => {
    const value = `${(entry.returns || 0) >= 0 ? "+" : "-"} ${usdFormatter(Math.abs((entry.returns || 0) * 100))} %`;
    const displayName =
      entry.display_name ||
      `${entry.eth_address.slice(0, 6)}...${entry.eth_address.slice(-4)}`;
    return (
      <div className="mb-1 flex w-full items-center justify-between border-b pb-1">
        <div className="flex items-center">
          <div className="text-muted-foreground w-8 text-left">{rank}.</div>
          {entry.profile_base64 ? (
            <img
              src={entry.profile_base64}
              alt={displayName}
              className="mr-3 h-10 w-10 rounded-full"
            />
          ) : (
            <div className="mr-3 h-10 w-10 rounded-full bg-gray-700" />
          )}
          <div
            id="userName"
            className="flex w-[150px] max-w-[150px] flex-col overflow-hidden text-left"
          >
            <p className="truncate text-base">{displayName}</p>
            {type == "order" ? (
              <p className="text-xs">
                <span
                  className={
                    (entry.returns || 0) >= 0
                      ? "text-primary"
                      : "text-secondary"
                  }
                >
                  {value}
                </span>{" "}
                on {entry.market_name}
              </p>
            ) : (
              <p className="text-xs">
                <span
                  className={
                    (entry.returns || 0) >= 0
                      ? "text-primary"
                      : "text-secondary"
                  }
                >
                  {value}
                </span>{" "}
                {t("IN_LAST_30_DAYS")}
              </p>
            )}
          </div>
        </div>

        {type == "order" ? (
          <div id="userValue" className="flex flex-col text-left">
            {entry.eth_address === account?.address?.toLowerCase() ? (
              <div className="rounded-full bg-[var(--light-blue)] px-2 py-1 text-right text-xs font-normal text-[var(--blue)]">
                🏅{t("YOU")}
              </div>
            ) : (
              <div
                className="text-primary cursor-pointer rounded-full bg-[var(--light-green)] px-2 py-1 text-right text-xs font-normal"
                onClick={() => {
                  openTrade(entry);
                }}
              >
                {t("SHOW_TRADE")}
              </div>
            )}
          </div>
        ) : (
          <div id="userValue" className="flex flex-col text-left">
            {entry.eth_address === account?.address?.toLowerCase() ? (
              <div className="rounded-full bg-[var(--light-blue)] px-2 py-1 text-right text-xs font-normal text-[var(--blue)]">
                🏅{t("YOU")}
              </div>
            ) : (
              <div
                className="text-primary cursor-pointer rounded-full bg-[var(--light-green)] px-2 py-1 text-right text-xs font-normal"
                onClick={() => {
                  openPortfolio(entry);
                }}
              >
                {t("SHOW_PORTFOLIO")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (portfolio) {
    const chartData = Object.entries(portfolio.types).map(([name, value]) => ({
      name,
      value,
    }));

    const chartConfig = chartData.reduce((acc, { name }, index) => {
      acc[name] = {
        label: name,
        color: `var(--chart-${index + 1})`,
      };
      return acc;
    }, {} as ChartConfig);
    return (
      <div className="mx-4">
        <div className="mt-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPortfolio(undefined)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          {selectedEntry && (
            <div className="flex items-center">
              {selectedEntry.profile_base64 ? (
                <img
                  src={selectedEntry.profile_base64}
                  alt={selectedEntry.display_name}
                  className="mr-3 h-10 w-10 rounded-full"
                />
              ) : (
                <div className="mr-3 h-10 w-10 rounded-full bg-gray-700" />
              )}
              <div
                id="userName"
                className="flex w-[150px] max-w-[150px] flex-col overflow-hidden text-left"
              >
                <p className="truncate text-base">
                  {selectedEntry.display_name}
                </p>
              </div>
            </div>
          )}
        </div>
        <h2 className="mt-4 ml-2 text-lg font-bold">
          {t("PORTFOLIO_DETAILS")}
        </h2>
        <Card className="mt-4 py-0">
          <div>
            <div className="flex items-center justify-between border-b p-4">
              <p className="text-muted-foreground">{t("TOTAL_POSITIONS")}</p>
              <p className="font-semibold">{portfolio?.position_count}</p>
            </div>
            <div className="flex items-center justify-between border-b p-4">
              <p className="text-muted-foreground">{t("TOTAL_INVESTED")}</p>
              <p className="font-semibold">
                {tokenValueFormatter(portfolio?.total_value || 0)} MPH
              </p>
            </div>

            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value: any) =>
                        `${tokenValueFormatter(value as number)} MPH`
                      }
                    />
                  }
                />
                <Pie
                  data={chartData}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  labelLine={false}
                  label={({ percent }) =>
                    `${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={chartConfig[entry.name]?.color}
                    />
                  ))}
                </Pie>
                <ChartLegend className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center" />
              </PieChart>
            </ChartContainer>
          </div>
        </Card>

        <Button
          variant="default"
          className="fixed bottom-4 mb-16 w-[calc(100vw-30px)] rounded-full"
          onClick={() => followUser()}
        >
          {t("FOLLOW")}
        </Button>
      </div>
    );
  }

  if (order) {
    return (
      <div className="mx-4">
        <div className="mt-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOrder(undefined)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          {selectedEntry && (
            <div className="flex items-center">
              {selectedEntry.profile_base64 ? (
                <img
                  src={selectedEntry.profile_base64}
                  alt={selectedEntry.display_name}
                  className="mr-3 h-10 w-10 rounded-full"
                />
              ) : (
                <div className="mr-3 h-10 w-10 rounded-full bg-gray-700" />
              )}
              <div
                id="userName"
                className="flex w-[150px] max-w-[150px] flex-col overflow-hidden text-left"
              >
                <p className="truncate text-base">
                  {selectedEntry.display_name}
                </p>
              </div>
            </div>
          )}
        </div>
        <h2 className="mt-4 ml-2 text-lg font-bold">{t("TRADE_DETAILS")}</h2>
        <Card className="mt-4 py-0">
          <div>
            <div className="flex items-center justify-between border-b p-4">
              <p className="text-muted-foreground">{t("MARKET")}</p>
              <p className="font-semibold">{selectedEntry?.market_name}</p>
            </div>
            <div className="flex items-center justify-between border-b p-4">
              <p className="text-muted-foreground">{t("AMOUNT")}</p>
              <p className="font-semibold">
                ${" "}
                {usdFormatter(
                  (Number(order.token_amount || 0) / 10 ** 18 || 0) *
                    (Number(order.mph_price) / 10 ** 8) || 1,
                )}
              </p>
            </div>
            <div className="flex items-center justify-between border-b p-4">
              <p className="text-muted-foreground">{t("DIRECTION")}</p>
              <p className="font-semibold capitalize">
                {order.opening_direction || order.direction}
              </p>
            </div>
            <div className="flex items-center justify-between border-b p-4">
              <p className="text-muted-foreground">{t("ENTRY_PRICE")}</p>
              <p className="font-semibold capitalize">
                ${" "}
                {usdFormatter(
                  Number(order.opening_price || order.price) / 10 ** 8,
                )}
              </p>
            </div>
            <div className="flex items-center justify-between border-b p-4">
              <p className="text-muted-foreground">{t("CLOSING_PRICE")}</p>
              <p className="font-semibold capitalize">
                $ {usdFormatter(Number(order.price) / 10 ** 8)}
              </p>
            </div>
            <div className="flex items-center justify-between border-b p-4">
              <p className="text-muted-foreground">{t("LEVERAGE")}</p>
              <p className="font-semibold capitalize">
                {Number(order.leverage) / 10 ** 8}x
              </p>
            </div>
            <div className="flex items-center justify-between p-4">
              <p className="text-muted-foreground">{t("RETURNS")}</p>
              <p className="font-semibold capitalize">
                {usdFormatter(Number(selectedEntry?.returns || 0) * 100)}%
              </p>
            </div>
          </div>
        </Card>

        <Button
          variant="default"
          className="fixed bottom-4 mb-16 w-[calc(100vw-30px)] rounded-full"
          onClick={() => followUser()}
        >
          {t("FOLLOW")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="">
        <div className="mt-4 flex flex-col content-center">
          <img
            src={`/assets/icons/trophy.svg`}
            alt={`Trophy Icon`}
            className="m-auto h-15 w-15"
          />
          <h2 className="m-auto mt-4 text-lg font-bold">
            {t("menu.LEADERBOARD")}
          </h2>
          <div className="m-auto mt-4 flex gap-3 text-sm font-bold">
            <div
              className={
                type == "returns"
                  ? `text-primary underline underline-offset-4`
                  : "cursor-pointer"
              }
              onClick={() => setType("returns")}
            >
              {t("TOP_RETURNS")}
            </div>
            <div
              className={
                type == "order"
                  ? `text-primary underline underline-offset-4`
                  : "cursor-pointer"
              }
              onClick={() => setType("order")}
            >
              {t("TOP_TRADES")}
            </div>
          </div>
        </div>

        {/* <div className="relative mt-4">
        <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10"
        />
      </div> */}

        <div
          id="leaderboard-list"
          className="mt-4 max-h-[calc(100vh-19rem)] flex-1 overflow-y-auto px-4"
        >
          {leaderboard &&
            leaderboard[type] &&
            leaderboard[type]
              .filter((entry) =>
                (entry.display_name || "")
                  .toLowerCase()
                  .includes(filter.toLowerCase()),
              )
              .map((entry, index) => (
                <div key={entry.eth_address}>
                  {outputLeaderboardEntry(entry, entry.rank || index)}
                </div>
              ))}
        </div>

        <Button
          variant="default"
          className="fixed bottom-20 mx-4 w-[calc(100vw-30px)]"
          onClick={() => router.push("/")}
        >
          {t("BEAT_THEM_PROMPT")}
        </Button>
      </div>
      <Footer />
    </>
  );
}
