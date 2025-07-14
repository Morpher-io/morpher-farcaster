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
import { useMarketStore } from "@/store/market";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { TPosition } from "../../../morpher-trading-sdk/src/v2.router";
import { usePortfolioStore } from "@/store/portfolio";
import { useNavigate } from "react-router-dom";
import { tokenValueFormatter } from "../../../morpher-trading-sdk/src";

export function PortfolioScreen() {

    const account = useAccount();
    const { selectedMarket, morpherTradeSDK, setSelectedMarketId, setMarketType } = useMarketStore();
    const { setSelectedPosition, setTradeDirection, positionList, setPositionList, portfolio, setPortfolio, positionValue } = usePortfolioStore();
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
    useEffect(() => {
        if (account?.address && morpherTradeSDK) {
            getProtfolio()
            
            
        }
    }, [account, morpherTradeSDK] )
    return (
        <>
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Portfolio</CardTitle>
                    <CardDescription className="truncate">{account?.address}</CardDescription>
                </CardHeader>
                <CardContent>
                    {portfolio ? (
                        <div className="grid gap-2 text-sm">
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
                    )}
                </CardContent>
            </Card>
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
            )}
        </>
    );
}
