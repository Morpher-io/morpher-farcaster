import { usePortfolioStore } from "@/store/portfolio";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {  usdFormatter } from "morpher-trading-sdk";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";
import {  TLeaderBoard } from '../../../morpher-trading-sdk/src/v2.router';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
  

export function LeaderboardScreen() {
  const account = useAccount();
  const { getLeaderboard, leaderboard } = usePortfolioStore();
  const [filter, setFilter] = useState("");
  const [type, setType]= useState<'returns' | 'order'>('returns');
  let navigate = useNavigate();
  

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
                <span className="text-primary">{value}</span> on Gold
              </p>
            ) : (
              <p className=" text-xs">
                <span className="text-primary">{value}</span> in the last 30
                days
              </p>
            )}
          </div>
        </div>

        {type == "returns" ? (
          <div id="userValue" className="flex flex-col text-left">
            {entry.eth_address === account?.address?.toLowerCase() ? (
              <div className="text-xs font-normal text-right bg-[var(--light-blue)] text-[var(--blue)] px-2 py-1 rounded-full">
                🏅You
              </div>
            ) : (
              <div className="text-xs font-normal text-right bg-[var(--light-green)] text-primary cursor-pointer px-2 py-1 rounded-full">
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
        <div className={type=='returns' ? `text-primary underline underline-offset-4` : 'cursor-pointer'} onClick={() => setType('returns')}>
          Big Wins
        </div>
        <div className={type=='order' ? `text-primary underline underline-offset-4` : 'cursor-pointer'} onClick={() => setType('order')}>
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
