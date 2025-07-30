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
import { TPosition, usdFormatter, tokenValueFormatter } from "morpher-trading-sdk";
import { usePortfolioStore } from "@/store/portfolio";
import { useNavigate } from "react-router-dom";
import { OpenPositionItem } from "@/components/trade/OpenPositionItem";
import { useTranslation } from "react-i18next";

export function PortfolioScreen() {

    const account = useAccount();
    const {  morpherTradeSDK, setSelectedMarketId } = useMarketStore();
    const { positionList, setPositionList, setPortfolio, positionValue, currencyList, setReturns, returns } = usePortfolioStore();
    const [timeRange, setTimeRange] = useState<"d" | "w" | "m" | "y">("d");
    const [chartData, setChartData] = useState<[number, number][]>([]);
    let navigate = useNavigate();
    const { t } = useTranslation();

    const handleTradeBtc = () => {
        setSelectedMarketId("CRYPTO_BTC");
        navigate("/");
    };

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
                    <CardTitle className="text-lg font-bold">{t('menu.PORTFOLIO')}</CardTitle>
                    
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
            <h2 className="text-lg font-bold mt-6 mb-2">{t('POSITIONS')}</h2>

            {positionList && positionList.length > 0 ? (
                positionList.map((position) => (
                    <OpenPositionItem key={position.id} position={position} />
                ))
            ) : positionList && positionList.length === 0 ? (
                <Card className="mt-2 text-center">
                    <CardContent className="p-6 flex flex-col items-center">
                        <p className="font-semibold mb-4">Your first trade is just a click away!</p>
                        <Button onClick={handleTradeBtc}>Trade Bitcoin</Button>
                    </CardContent>
                </Card>
            ) : null}
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
