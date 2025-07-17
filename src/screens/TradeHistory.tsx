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
import { TORders } from "morpher-trading-sdk";
import { tokenValueFormatter } from "morpher-trading-sdk";
import { Card, CardContent } from "@/components/ui/card";

export function TradeHistoryScreen() {
    const account = useAccount();
    const {  morpherTradeSDK } = useMarketStore();
    const [ orders, setOrders ] = useState<TORders | undefined>(undefined);

        const getOrders = async () => {
            if (account?.address && morpherTradeSDK) {
                try {
                    let orders = await morpherTradeSDK.getOrders({ eth_address: account.address})
                    setOrders(orders);
    
                } catch (err) {
                    console.log('No portfolio found')
                }
            }
    
        }
        useEffect(() => {
            if (account?.address && morpherTradeSDK) {
                getOrders()
                
                
            }
        }, [account, morpherTradeSDK] )


    return (
        <div className="mx-4">

            
            {/* <h2 className="scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight">
                Trade History
            </h2> */}
            <div className="mt-4">
                <Card className="py-2">
                    <CardContent className="px-2">
                {orders && orders.length > 0 ? (
                    <Table className="">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Market</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{order.market_id}</TableCell>
                                    <TableCell>{order.direction}</TableCell>
                                    <TableCell>{order.status}</TableCell>
                                    <TableCell>$ {order.price / 10**8}</TableCell>
                                    <TableCell>{tokenValueFormatter(order.token_amount / 10**18)} MPH</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground">No trade history found.</p>
                )}
                </CardContent>
                </Card>
            </div>
        </div>
    );
}
