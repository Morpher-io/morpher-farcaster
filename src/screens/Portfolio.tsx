import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PortfolioChart } from "@/components/trade/PortfolioChart";
import { useMarketStore } from "@/store/market";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { TPosition } from "../../../morpher-trading-sdk/src/v2.router";
import { usePortfolioStore } from "@/store/portfolio";
import { useNavigate } from "react-router-dom";
import { tokenValueFormatter, usdFormatter } from "../../../morpher-trading-sdk/src";
import { Timer } from "lucide-react";

export function PortfolioScreen() {

    const account = useAccount();
    const { selectedMarket, morpherTradeSDK, setSelectedMarketId, setMarketType } = useMarketStore();
    const { setSelectedPosition, setTradeDirection, positionList, setPositionList, portfolio, setPortfolio, positionValue, currencyList, setReturns, returns } = usePortfolioStore();
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

    const outputPosition = (position: TPosition, closeOverride?: number) => {
        return (
          <div className="flex w-full items-center justify-between border-b-1 mb-1 pb-1">
            <div className="flex items-center">
              <div>
                {position.logo_image && (
                  <img
                    src={`data:image/svg+xml;base64,${position.logo_image}`}
                    alt={`${position.name} logo`}
                    className="mr-4 ml--2 h-8 w-8 rounded-lg"
                  />
                )}
              </div>
              <div
                id="marketName"
                className="flex flex-col max-w-[130px] w-[130px] overflow-hidden text-left"
    
              >
                <p className="font-semibold">{position?.symbol}</p>
                <p className="font-normal">{position?.name}</p>
              </div>
            </div>
            <div id="marketValue" className="flex flex-col text-right  ">
                <div
                id="marketPercent"
                className={`flex items-center justify-end ${(Number(position?.total_return_percent || 0)) >= 0 ? "text-primary" : "text-secondary"}`}
              >
                {(Number(position?.total_return_percent || 0)) !== 0 && (
                  <div
                    className="mr-1 h-3 w-3 bg-[currentColor]"
                    style={{
                      mask: `url(/src/assets/icons/${(Number(position?.total_return_percent || 0)) > 0 ? "increase" : "decrease"}.svg) no-repeat center / contain`,
                      WebkitMask: `url(/src/assets/icons/${(Number(position?.total_return_percent || 0)) > 0 ? "increase" : "decrease"}.svg) no-repeat center / contain`,
                    }}
                  />
                )}
                {(Number(position?.total_return_percent || 0)) > 0 ? "+" : ""}
                {Number(Number(position?.total_return_percent || 0) * 100).toFixed(2)} %
              </div>

               <div
                id="marketPercent"
                className={`flex items-center justify-end ${(Number(position?.total_return || 0)) >= 0 ? "text-primary" : "text-secondary"}`}
              >
          
                {(Number(position?.total_return || 0)) > 0 ? "+" : ""}
                {Number(Number(position?.total_return || 0)/ 10**18).toFixed(2)} 
              </div>

            </div>
            <div id="marketValue" className="flex flex-col text-right">
              <p className="text-lg font-bold">
                 {tokenValueFormatter(Number(position.value || 0) / 10**18)} MPH
              </p>
              <div
                id="marketPercent"
                className={`flex items-center justify-end ${position.direction == "long"  ? "text-primary" : "text-secondary"}`}
              >
                <div className={(position.direction == "long" ? 'bg-[var(--light-green)]' : 'bg-[var(--light-red)]') + ' px-2 rounded-full '}>
                    {position.direction == "long" ? "Long" : "Short"}
                </div>
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
                      key={position.symbol}
                      onClick={() => {selectPosition(position.id)}}
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
