import { usePortfolioStore } from "@/store/portfolio";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {  usdFormatter, TLeaderBoard, TAddress, TOrder } from "morpher-trading-sdk";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMarketStore } from "@/store/market";
import { sdk } from "@farcaster/frame-sdk";
  

export function LeaderboardScreen() {
  const account = useAccount();
  const { getLeaderboard, leaderboard,  } = usePortfolioStore();
  const [filter, setFilter] = useState("");
  const [type, setType]= useState<'returns' | 'order'>('order');
  let navigate = useNavigate();
  const { morpherTradeSDK } = useMarketStore();
  const [selectedEntry, setSelectedEntry] = useState<TLeaderBoard>();
  
  
  const [order, setOrder] = useState<TOrder>();
  

  const openTrade = async (entry: TLeaderBoard) => {
    console.log('openTrade', entry.order_id)
    setSelectedEntry(entry)
    if (!entry.order_id) {
      return
    }
    let orders = await morpherTradeSDK.getOrders({
      eth_address: entry.eth_address.toLowerCase() as TAddress,
      order_id: entry.order_id.toLowerCase(),
    });

    if (orders && orders.length > 0) {
      console.log('orders[0]', orders[0])
      setOrder(orders[0]);
    }
  }

  const followUser = () => {
    if (selectedEntry?.id)
    sdk.actions.viewProfile({fid: Number(selectedEntry.id) })
  }
  

  useEffect(() => {
    if (account?.address) {
      console.log('getLeaderboard')
      getLeaderboard({
        eth_address: account?.address,
        app: import.meta.env.VITE_MORPHER_APP_NAME,
        type: type,
      });
    } 
  }, [account, getLeaderboard, type]);

  const outputLeaderboardEntry = (entry: TLeaderBoard, rank: number) => {
    const value = `+ ${usdFormatter(entry.returns || 0)} %` ;
    const displayName =
      entry.display_name ||
      
      `${entry.eth_address.slice(0, 6)}...${entry.eth_address.slice(-4)}`;
    return (
      <div className="flex w-full items-center justify-between border-b mb-1 pb-1">
        <div className="flex items-center">
          <div className="w-8 text-left text-muted-foreground">{rank}.</div>
          {entry.profile_image ? (
            <img
              src={entry.profile_image}
              alt={displayName}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full mr-3 bg-gray-700" />
          )}
          <div
            id="userName"
            className="flex flex-col max-w-[150px] w-[150px] overflow-hidden text-left"
          >
            <p className="text-base truncate">{displayName}</p>
            {type == "returns" ? (
              <p className=" text-xs">
                <span className="text-primary">{value}</span> on {entry.market_name}
              </p>
            ) : (
              <p className=" text-xs">
                <span className="text-primary">{value}</span> in the last 30
                days
              </p>
            )}
          </div>
        </div>

        {type == "order" ? (
          <div id="userValue" className="flex flex-col text-left">
            {entry.eth_address === account?.address?.toLowerCase() ? (
              <div className="text-xs font-normal text-right bg-[var(--light-blue)] text-[var(--blue)] px-2 py-1 rounded-full">
                🏅You
              </div>
            ) : (
              <div className="text-xs font-normal text-right bg-[var(--light-green)] text-primary cursor-pointer px-2 py-1 rounded-full" onClick={()=> { openTrade(entry) }}>
                Show Trade
              </div>
            )}
          </div>
        ) : (
          <div id="userValue" className="flex flex-col text-left">
            {entry.eth_address === account?.address?.toLowerCase() ? (
              <div className="text-xs font-normal text-right bg-[var(--light-blue)] text-[var(--blue)] px-2 py-1 rounded-full">
                🏅You
              </div>
            ) : (
              <div className="text-xs font-normal text-right bg-[var(--light-green)] text-primary cursor-pointer px-2 py-1 rounded-full">
                Show Portfolio
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (order) {
    return (
      <div className="mx-4">
        <div className="flex items-center mt-4">
          <Button variant="ghost" size="icon" onClick={() => setOrder(undefined)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
          {selectedEntry && (
          <div className="flex items-center">
          {selectedEntry.profile_image ? (
            <img
              src={selectedEntry.profile_image}
              alt={selectedEntry.display_name}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full mr-3 bg-gray-700" />
          )}
          <div
            id="userName"
            className="flex flex-col max-w-[150px] w-[150px] overflow-hidden text-left"
          >
            <p className="text-base truncate">{selectedEntry.display_name}</p>

          </div>
        </div>
        )}
          
        </div>
        <h2 className="text-lg font-bold ml-2 mt-4">Trade Details</h2>
        <Card className="mt-4 py-0">
          <div>
            <div className="flex justify-between items-center p-4 border-b">
              <p className="text-muted-foreground">Market</p>
              <p className="font-semibold">{selectedEntry?.market_name}</p>
            </div>
            <div className="flex justify-between items-center p-4 border-b">
              <p className="text-muted-foreground">Amount</p>
              <p className="font-semibold">
                {usdFormatter(
                  ((Number(order.token_amount || 0) / 10 ** 18 || 0) *
                    (Number(order.mph_price) / 10 ** 8) || 1)
                )}
              </p>
            </div>
            <div className="flex justify-between items-center p-4 border-b">
              <p className="text-muted-foreground">Direction</p>
              <p className="font-semibold capitalize">{order.direction}</p>
            </div>
            <div className="flex justify-between items-center p-4 border-b">
              <p className="text-muted-foreground">Entry Price</p>
              <p className="font-semibold capitalize">
                {Number(order.price) / 10 ** 8}
              </p>
            </div>
            <div className="flex justify-between items-center p-4 border-b">
              <p className="text-muted-foreground">Closing Price</p>
              <p className="font-semibold capitalize">tbd</p>
            </div>
            <div className="flex justify-between items-center p-4 border-b">
              <p className="text-muted-foreground">Leverage</p>
              <p className="font-semibold capitalize">
                {Number(order.leverage) / 10 ** 8}x
              </p>
            </div>
            <div className="flex justify-between items-center p-4">
              <p className="text-muted-foreground">Returns</p>
              <p className="font-semibold capitalize">
                {selectedEntry?.returns}%
              </p>
            </div>
          </div>
        </Card>

               <Button
              variant="default"
              className="w-[calc(100vw-30px)]  rounded-full fixed bottom-4 "
              onClick={() => followUser()}
            >
              Follow
            </Button>
      </div>
    );
  }

  return (
    <div className="mx-4">
      <div className="flex flex-col content-center mt-4">
        <img
            src={`/src/assets/icons/trophy.svg`}
            alt={`Trophy Icon`}

            className="h-15 w-15 m-auto "
          />
      <h2 className="text-lg font-bold mt-4 m-auto">Leaderboard</h2>
      <div className="flex m-auto gap-3 text-sm mt-4 font-bold">
        <div className={type=='order' ? `text-primary underline underline-offset-4` : 'cursor-pointer'} onClick={() => setType('order')}>
          Big Wins
        </div>
        <div className={type=='returns' ? `text-primary underline underline-offset-4` : 'cursor-pointer'} onClick={() => setType('returns')}>
          Top Traders
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

      <div id="leaderboard-list" className="mt-4">
        {leaderboard &&
          leaderboard
            .filter((entry) =>
              (entry.display_name || "")
                .toLowerCase()
                .includes(filter.toLowerCase())
            )
            .map((entry, index) => (
              <div key={entry.eth_address}>
                {outputLeaderboardEntry(entry, entry.rank || index)}
              </div>
            ))}
      </div>

       <Button
              variant="default"
              className="w-[calc(100vw-30px)]  rounded-full fixed bottom-4 "
              onClick={() => navigate('/')}
            >
              Think you can beat them?  Trade now
            </Button>
    </div>
  );
}
