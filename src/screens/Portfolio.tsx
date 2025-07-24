import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { PortfolioChart } from "@/components/trade/PortfolioChart";
import { useMarketStore } from "@/store/market";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { TPosition } from "morpher-trading-sdk";
import { usePortfolioStore } from "@/store/portfolio";
import { useNavigate } from "react-router-dom";
import { tokenValueFormatter, usdFormatter } from "morpher-trading-sdk";
import { cn } from "@/lib/utils";

export function PortfolioScreen() {

    const account = useAccount();
    const {  morpherTradeSDK, setSelectedMarketId, setMarketType } = useMarketStore();
    const { setSelectedPosition, setTradeDirection, positionList, setPositionList, setPortfolio, positionValue, currencyList, setReturns, returns } = usePortfolioStore();
    const [timeRange, setTimeRange] = useState<"d" | "w" | "m" | "y">("d");
    const [chartData, setChartData] = useState<[number, number][]>([]);
    let navigate = useNavigate();

    const selectPosition = (position_id: string) => {
        let position = positionList?.find(pos => pos.id === position_id)
        if (position) {
            setSelectedPosition(position)
            if (account.address) {
                setMarketType('commodity')
                setTradeDirection('close')

                setSelectedMarketId(position.market_id)
                navigate('/')
            }
            

        }
    }

    const getProtfolio = async () => {
        if (account?.address && morpherTradeSDK) {
            try {
                let portfolioData = await morpherTradeSDK.getPortfolio({ eth_address: account.address})
                setPortfolio(portfolioData);
            
                let positions = await morpherTradeSDK.getPositions({
                    eth_address: account.address,
        
                });
                setPositionList(positions)

            } catch (err) {
                console.log('No portfolio found')
            }
        }

    }

    const outputPosition = (position: TPosition) => {
    const pnl = Number(position.total_return || 0);
    const pnlPercent = Number(position.total_return_percent || 0) * 100;
    const isPositive = pnl >= 0;

    const positionValueMph = Number(position.value || 0) / 10 ** 18;
    const positionValueUsd = currencyList?.MPH?.usd_exchange_rate
      ? positionValueMph * currencyList.MPH.usd_exchange_rate
      : null;

    const pnlMph = pnl / 10 ** 18;
    const pnlUsd = currencyList?.MPH?.usd_exchange_rate
      ? pnlMph * currencyList.MPH.usd_exchange_rate
      : null;

    return (
      <div className="border-b py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {position.logo_image && (
              <img
                src={`data:image/svg+xml;base64,${position.logo_image}`}
                alt={`${position.name} logo`}
                className="h-9 w-9 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-base">{position.symbol}</p>
              <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                {position.name}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full capitalize",
              position.direction === "long"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            )}
          >
            {position.direction}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="text-muted-foreground">Value</div>
          <div className="text-right font-medium">
            {positionValueUsd ? (
              <>
                <span>${usdFormatter(positionValueUsd)}</span>
                <span className="text-muted-foreground text-xs ml-1">
                  ({tokenValueFormatter(positionValueMph)} MPH)
                </span>
              </>
            ) : (
              <span>{tokenValueFormatter(positionValueMph)} MPH</span>
            )}
          </div>

          <div className="text-muted-foreground">Unrealized P/L</div>
          <div
            className={cn(
              "text-right font-medium",
              isPositive ? "text-primary" : "text-secondary"
            )}
          >
            {pnlUsd ? (
              <>
                <span>
                  {isPositive ? "+" : ""}${usdFormatter(pnlUsd)}
                </span>
                <span className="text-xs ml-1">
                  ({isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%)
                </span>
              </>
            ) : (
              <>
                <span>
                  {isPositive ? "+" : ""}{tokenValueFormatter(pnlMph)} MPH
                </span>
                <span className="text-xs ml-1">
                  ({isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%)
                </span>
              </>
            )}
          </div>

          <div className="text-muted-foreground">Avg. Entry</div>
          <div className="text-right font-medium">
            ${usdFormatter(Number(position.average_price) / 10 ** 8)}
          </div>

          <div className="text-muted-foreground">Leverage</div>
          <div className="text-right font-medium">
            {(Number(position.average_leverage) / 10 ** 8).toFixed(1)}x
          </div>
        </div>
      </div>
    );
  };

    const getReturns = async (type: "d" | "w" | "m" | "y") => {
        if (account?.address && morpherTradeSDK) {
            if (returns && returns[type] && returns[type].length > 0) return;
            try {
                const returnsData = await morpherTradeSDK.getReturns({ eth_address: account.address, type })

                console.log('returnsData', returnsData)

                setReturns(type, returnsData || [])
                
            } catch (err) {
                console.log('Error fetching returns')
            }
        }

    }
    useEffect(() => {
        if (account?.address && morpherTradeSDK) {
            getProtfolio()
        }
    }, [account, morpherTradeSDK] )

    useEffect(() => {
        if (account?.address && morpherTradeSDK) {
            getReturns(timeRange);
        }
    }, [timeRange, account, morpherTradeSDK]);

    useEffect(() => {
        if (returns[timeRange]) {
            let data: [number, number][] = [];
            returns[timeRange].forEach(point => {
                data.push([point.timestamp, point.positions])
            })
            setChartData(data)

        }

    }, [returns[timeRange], timeRange])
    return (
        <div className="mx-4">
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Portfolio</CardTitle>
                    
                    <CardTitle className="flex justify-between">
                        <div>
                            {currencyList?.MPH?.usd_exchange_rate ? '$ ' + usdFormatter(Number(positionValue) / 10**18 * currencyList?.MPH?.usd_exchange_rate  ) : ''} ({tokenValueFormatter(((positionValue || 0) / 10**18)) } MPH)
                        </div>
                        <CardDescription className="truncate max-w-[90px]">{account?.address}</CardDescription>
                    </CardTitle>
                    
                </CardHeader>
                <CardContent>
                    <PortfolioChart data={chartData || []} timeRange={timeRange} />
                    <div className="flex justify-center gap-2 mt-2">
                        <Button variant={timeRange === 'd' ? 'outline' : 'ghost'} size="sm" onClick={() => setTimeRange('d')}>1D</Button>
                        <Button variant={timeRange === 'w' ? 'outline' : 'ghost'} size="sm" onClick={() => setTimeRange('w')}>1W</Button>
                        <Button variant={timeRange === 'm' ? 'outline' : 'ghost'} size="sm" onClick={() => setTimeRange('m')}>1M</Button>
                        <Button variant={timeRange === 'y' ? 'outline' : 'ghost'} size="sm" onClick={() => setTimeRange('y')}>1Y</Button>
                    </div>
                    {/* {portfolio ? (
                        <div className="grid gap-2 text-sm mt-4">
                            <div className="flex items-center justify-between">
                                <span>Total Value</span>
                                <span>{tokenValueFormatter((Number(portfolio.current_value || 0) / 10**18)) } MPH</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>In Positions</span>
                                <span>{tokenValueFormatter(((positionValue || 0) / 10**18)) } MPH</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span>ETH Balance</span>
                                <span>{tokenValueFormatter(Number(portfolio.eth_balance || 0) / 10**18) } ETH</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>USDC Balance</span>
                                <span>{tokenValueFormatter(Number(portfolio.usdc_balance || 0) / 10**6)} USDC</span>
                            </div>
                        </div>
                    ) : (
                        <p>Loading portfolio...</p>
                    )} */}
                </CardContent>
            </Card>
            <h2 className="text-lg font-bold mt-6 mb-2">Positions</h2>

            {positionList && Object.values(positionList).map((position) => (
                    <div
                      key={position.id}
                      onClick={() => {selectPosition(position.id)}}
                      className="cursor-pointer"
                    >
                      {outputPosition(position)}
                    </div>
                  ))}
{/*             
            {positionList && positionList.length > 0 ? (
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Symbol</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Spread</TableHead>
                                <TableHead>Leverage</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {positionList.map((position: TPosition) => (
                                <TableRow key={position.id} className="cursor-pointer" onClick={() => selectPosition(position.id)}>
                                    <TableCell>{position.symbol}</TableCell>
                                    <TableCell>{position.direction}</TableCell>
                                    <TableCell>{tokenValueFormatter(Number(position.value || 0) / 10**18)}</TableCell>
                                    <TableCell>$ {tokenValueFormatter(Number(position.average_price ||0) / 10**8)}</TableCell>
                                    <TableCell>$ {tokenValueFormatter(Number(position.average_spread ||0) / 10**8)}</TableCell>
                                    <TableCell>{Number(position.average_leverage) / 10**8} x</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                ''
            )} */}
        </div>
    );
}
