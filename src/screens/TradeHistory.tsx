import { useMarketStore } from "@/store/market";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { TOrder, TORders, usdFormatter } from "morpher-trading-sdk";
import { tokenValueFormatter } from "morpher-trading-sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePortfolioStore } from "@/store/portfolio";
import { Input } from "@/components/ui/input";
import { Filter, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { getAddress, getContract, hashTypedData, keccak256, toHex } from "viem";
import { morpherOracleAbi } from "@/lib/utils";

export function TradeHistoryScreen() {
  const { t } = useTranslation();
  const account = useAccount();
  const { morpherTradeSDK } = useMarketStore();
  const { currencyList } = usePortfolioStore();
  const [orders, setOrders] = useState<TORders | undefined>(undefined);
  const [filter, setFilter] = useState("");
  const { data: walletClient } = useWalletClient();

  const [sign, setSign] = useState<any>();
  const publicClient = usePublicClient();

  const [selectedOrder, setSelectedOrder] = useState<TOrder | undefined>(
    undefined
  );


  const getSymbol = (market_id?: string) => {
    if (!market_id) {
      return market_id;
    }
    let symbol = market_id;
    if (symbol.includes("_")) {
      symbol = symbol.substring(symbol.indexOf("_") + 1);
    }

    return symbol;
  };


  const formatDate = (timestamp?: number) => {
    if (!timestamp) {
      return timestamp;
    }

    const dt = new Date(timestamp).toLocaleString();

    return dt;
  };

  const selectOrder = (order: TOrder) => {
    setSelectedOrder(order);
  };

  const getOrders = async () => {
    if (account?.address && morpherTradeSDK) {
      try {
        let orders = await morpherTradeSDK.getOrders({
          eth_address: account.address,
        });
        setOrders(orders);
      } catch (err) {
        console.log("No portfolio found");
      }
    }
  };

  const testTrade = async () => {
    try {
    if (!walletClient || !publicClient || !account?.address) {
      return
    }
    const eth_address = account?.address
    const chainId = 8453;

				// set the domain parameters
				const domain: any = {
					name: "MorpherOracle",
					version: "1",
					chainId: Number(chainId),
					verifyingContract:  '0x694aa11EC58b7dE7F1bb3a83dae00dCa55Dc986B'
				};

				// set the Permit type parameters
				
				const types = {
					EIP712Domain: [
						{
							name: 'name',
							type: 'string',
						},
						{
							name: 'version',
							type: 'string',
						},
						{
							name: 'chainId',
							type: 'uint256',
						},
						{
							name: 'verifyingContract',
							type: 'address',
						},
					],
					// Person: [
					// 	{
					// 		name: 'name',
					// 		type: 'string',
					// 	},
					// 	{
					// 		name: 'wallet',
					// 		type: 'address',
					// 	},
					// ],
					CreateOrder: [{
						name: "_marketId",
						type: "bytes32"
						},
						{
							name: "_closeSharesAmount",
							type: "uint256"
						},
						{
							name: "_openMPHTokenAmount",
							type: "uint256"
						},
						{
							name: "_msgSender",
							type: "address"
						},
						{
							name: "nonce",
							type: "uint256"
						},
						{
							name: "deadline",
							type: "uint256"
						},
					],
				};

				// set the Permit type values

				const deadline = '1758792623000';

        const soliditySha3 = (data: string) => {
            const return_data = keccak256(toHex(data));
            return return_data
        }
				
				const market = soliditySha3('CRYPTO_ETH');



				const contract: any = getContract({
					abi: morpherOracleAbi,
					address: '0x694aa11EC58b7dE7F1bb3a83dae00dCa55Dc986B',
					client: { public: publicClient, wallet: walletClient },
				});

				
						
				const nonce: any = await contract.read.nonces([eth_address]);

				console.log('nonce', nonce)

				const values = {
					_marketId: market,
					_closeSharesAmount: '0',
					_openMPHTokenAmount: BigInt(Number(2) * 10 ** 18).toString(),
					_msgSender: getAddress(eth_address || ''),
					nonce: nonce.toString(),
					deadline: deadline.toString(),
				};



				const signature = await walletClient.signTypedData({
						account:eth_address,
						domain,
						types,
						primaryType: 'CreateOrder',
						message: values,
					  });





				  const hash = hashTypedData({ message:values, primaryType:'CreateOrder', types, domain: domain as any })

				  console.log('hash', hash)


				const valid = await publicClient.verifyTypedData({
					address: eth_address,
					domain: domain,
					types: types,
					primaryType: 'CreateOrder',
					message: values,
					signature
				});

        				console.log({
						account:eth_address,
						domain,
						types,
						primaryType: 'CreateOrder',
						message: values,
            signature,
            hash,
            valid
					  })
            setSign({
						account:eth_address,
						domain,
						types,
						primaryType: 'CreateOrder',
						message: values,
            signature,
            hash,
            valid
					  })
            } catch (err) {
              console.log('err', err)
            }
  }
  useEffect(() => {
    if (account?.address && morpherTradeSDK) {
      getOrders();
    }
  }, [account, morpherTradeSDK]);

  const outputOrder = (order: TOrder) => {
    return (
      <div className="flex w-full items-center justify-between border-b-1 mb-1 pb-1">
        <div className="flex items-center">
          <div
            id="marketName"
            className="flex flex-col max-w-[130px] w-[130px] overflow-hidden text-left"
          >
            <p className="font-semibold">{getSymbol(order?.market_id)}</p>
            <div
              id="marketPercent"
              className={`flex items-center text-sm justify-st\rt ${order.direction == "long" ? "text-primary" : "text-secondary"}`}
            >
              {order.direction == "long" ? t("LONG") : t("SHORT")}
            </div>
          </div>
        </div>


        <div id="marketValue" className="flex flex-col text-left">
          <p className="text-lg font-bold text-right">
            {currencyList?.MPH?.usd_exchange_rate
              ? "$ " +
                usdFormatter(
                  (Number(order.token_amount || 0) / 10 ** 18) *
                    currencyList?.MPH?.usd_exchange_rate
                )
              : tokenValueFormatter(
                  Number(order.token_amount || 0) / 10 ** 18
                ) + " MPH"}
          </p>
          <div id="marketPercent" className="text-sm">
            {formatDate(Number(order.oracle_called_at))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-4">
      <h2 className="text-lg font-bold mt-4">{t('TRADE_HISTORY')}</h2>

      <div className="relative mt-4">
        <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("FILTER_BY_SYMBOL")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      {sign && (
        <textarea style={{borderWidth: 1, width: '100%', height: '100px'}} >{JSON.stringify(sign || {})}</textarea> 
      )}
      <br></br>
      
      <Button onClick={testTrade}>test</Button>

      <div id="order-list" className="mt-4">
        {orders &&
          Object.values(orders)
            .filter((order) =>
              getSymbol(order?.market_id)
                ?.toLowerCase()
                .includes(filter.toLowerCase())
            )
            .map((order) => (
              <div
                key={order.id}
                onClick={() => {
                  selectOrder(order);
                }}
              >
                {outputOrder(order)}
              </div>
            ))}
      </div>

      {selectedOrder && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedOrder(undefined);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getSymbol(selectedOrder.market_id)}</DialogTitle>
              <DialogDescription>
                {t("TRADE_DETAILS_DESCRIPTION", {
                  direction:
                    selectedOrder.direction === "long"
                      ? t("LONG")
                      : t("SHORT"),
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <div className="grid grid-cols-2 items-center">
                <p>{t("AMOUNT")}</p>
                <p className="font-semibold text-right">
                  {currencyList?.MPH?.usd_exchange_rate
                    ? "$ " +
                      usdFormatter(
                        (Number(selectedOrder.token_amount || 0) / 10 ** 18) *
                          currencyList?.MPH?.usd_exchange_rate
                      )
                    : tokenValueFormatter(
                        Number(selectedOrder.token_amount || 0) / 10 ** 18
                      ) + " MPH"}
                </p>
              </div>
              <div className="grid grid-cols-2 items-center">
                <p>{t("DATE_ENTERED")}</p>
                <p className="font-semibold text-right">
                  {formatDate(Number(selectedOrder.oracle_called_at))}
                </p>
              </div>
              <div className="grid grid-cols-2 items-center">
                <p>{t("STATUS")}</p>
                <p className="font-semibold text-right">
                  {selectedOrder.status}
                </p>
              </div>
              <div className="grid grid-cols-2 items-center">
                <p>{t("ORDER_ID")}</p>
                <div className="flex items-center justify-end gap-2">
                  <p className="font-semibold text-right break-all">
                    {selectedOrder.id && selectedOrder.id.length > 10
                      ? `${selectedOrder.id.slice(
                          0,
                          5
                        )}...${selectedOrder.id.slice(-5)}`
                      : selectedOrder.id}
                  </p>
                  <Copy
                    className="h-4 w-4 cursor-pointer text-muted-foreground"
                    onClick={() =>
                      navigator.clipboard.writeText(selectedOrder.id || "")
                    }
                  />
                </div>
              </div>
              {selectedOrder.tx_hash && (
                <div className="grid grid-cols-2 items-center">
                  <p>{t("TRANSACTION_HASH")}</p>
                  <div className="flex items-center justify-end gap-2">
                    <p className="font-semibold text-right break-all">
                      {selectedOrder.tx_hash &&
                      selectedOrder.tx_hash.length > 10
                        ? `${selectedOrder.tx_hash.slice(
                            0,
                            5
                          )}...${selectedOrder.tx_hash.slice(-5)}`
                        : selectedOrder.tx_hash}
                    </p>
                    <Copy
                      className="h-4 w-4 cursor-pointer text-muted-foreground"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedOrder.tx_hash || ""
                        )
                      }
                    />
                  </div>
                </div>
              )}
              {selectedOrder.callback_hash && (
                <div className="grid grid-cols-2 items-center">
                  <p>{t("CALLBACK_HASH")}</p>
                  <div className="flex items-center justify-end gap-2">
                    <p className="font-semibold text-right break-all">
                      {selectedOrder.callback_hash &&
                      selectedOrder.callback_hash.length > 10
                        ? `${selectedOrder.callback_hash.slice(
                            0,
                            5
                          )}...${selectedOrder.callback_hash.slice(-5)}`
                        : selectedOrder.callback_hash}
                    </p>
                    <Copy
                      className="h-4 w-4 cursor-pointer text-muted-foreground"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedOrder.callback_hash || ""
                        )
                      }
                    />
                  </div>
                </div>
              )}


              
            </div>
            {selectedOrder.tx_hash && (
              <DialogFooter>
                <Button
                  onClick={() =>
                    window.open(
                      import.meta.env.VITE_NODE_ENV !== 'development' ?
                       `https://basescan.org/tx/${selectedOrder.tx_hash}` :
                       `https://sepolia.basescan.org/tx/${selectedOrder.tx_hash}`,
                      "_blank"
                    )
                  }
                >
                  Show Transaction
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
