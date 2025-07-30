import { create } from 'zustand'
// import { TAddress, TCurrency, TCurrencyDetails } from '../../../morpher-trading-sdk/src/types'
// import { MorpherTradeSDK } from '../../../morpher-trading-sdk/src/index'
// import { TPortfolioDataPoint, TPosition, TContext, TLeaderBoard } from '../../../morpher-trading-sdk/src/v2.router';

import { TAddress, TCurrency, TCurrencyDetails, TOrder, TPortfolio } from 'morpher-trading-sdk'
import { MorpherTradeSDK } from 'morpher-trading-sdk';
import { TPortfolioDataPoint, TPosition, TContext, TLeaderBoard } from 'morpher-trading-sdk';
import { sdk } from "@farcaster/frame-sdk";
export type TCurrencyList = Partial<Record<TCurrency, TCurrencyDetails>>;
const morpherTradeSDK = new MorpherTradeSDK(import.meta.env.VITE_MORPHER_API_ENDPOINT);

interface PortfolioState {
  tradeAmount: string
  setTradeAmount: (tradeAmount: string) => void
  selectedCurrency: TCurrency | undefined
  setSelectedCurrency: (currency: TCurrency | undefined) => void
  selectedCurrencyDetails: TCurrencyDetails | undefined
  setSelectedCurrencyDetails: (details: TCurrencyDetails | undefined) => void
  currencyList: TCurrencyList | undefined
  setCurrencyList: (list: TCurrencyList | undefined) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  eth_address?: TAddress
  setEthAddress: (eth_address?: TAddress) => void
  orderUpdate?: TOrder
  closePercentage?: number
  setClosePercentage: (closePercentage: number | undefined) => void
  tradeDirection: 'open' | 'close'
  setTradeDirection: (tradeDirection: 'open' | 'close') => void

  positionList?: TPosition[];
  setPositionList: (positionList?: TPosition[]) => void;
  selectedPosition?: TPosition;
  setSelectedPosition: (position?: TPosition) => void;
  
  portfolio?: TPortfolio;
  setPortfolio: (portfolio?: any) => void;
  positionValue?: number;
  tradeComplete: boolean;
  setTradeComplete: (complete?: boolean) => void;
  returns: {[type: string ]: TPortfolioDataPoint[]}
  setReturns: (type: "d" | "w" | "m" | "y", returns?: TPortfolioDataPoint[]) => void;
  leaderboard: {[type: string ]: TLeaderBoard[]};
  getLeaderboard: (parameters: {app: string, type: "order" | "returns", eth_address: TAddress} ) => void;
  context?: TContext;
  setContext: (context?: {
    eth_address: TAddress;
    id: string;
    app: string;
    user_name?: string;
    display_name?: string;
    profile_image?: string;
  }) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => {
  const fetchPortfolioData = async () => {
    const { eth_address } = get();

    if (!eth_address) {
      set({ loading: false });
      return;
    }
    set({ loading: true });
    try {
      const portfolio:any = await morpherTradeSDK.getPortfolio({ eth_address });

      const positionList = await morpherTradeSDK.getPositions({ eth_address });
      if (portfolio) {
        portfolio.positions_count = positionList.length;
      }
      
           
      const returnsW = await morpherTradeSDK.getReturns({ eth_address, type: 'w' })
      
      let positionValue = 0;
      positionList?.forEach((position) => {
        positionValue += Number(position.value);
      });

      set({
        portfolio,
        positionList,
        positionValue,
        returns: {
          w: returnsW || [],
        },
      });
    } catch (error: any) {
      console.error("Failed to fetch portfolio data:", error);
      if (error.message && error.message.includes("No portfolio was found")) {
        set({

          positionList: [],
          returns: { d: [], w: [], m: [], y: [] },
        });
      } else {
        // For other errors, clear the portfolio to avoid showing stale data
        set({ portfolio: undefined, returns: {}, positionList: undefined, leaderboard: undefined });
      }
    } finally {
      set({ loading: false });
    }
  };

  return {
    tradeAmount: '',
    leaderboard: {},
    returns: {},
    setTradeAmount: (tradeAmount) => set({ tradeAmount }),
    selectedCurrency: undefined,
    setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
    selectedCurrencyDetails: undefined,
    setSelectedCurrencyDetails: (details) => set({ selectedCurrencyDetails: details }),
    currencyList: undefined,
    setCurrencyList: (list) => set({ currencyList: list }),
    loading: true,
    setLoading: (loading) => set({ loading }),
    eth_address: undefined,
    setContext: (context) => {
      if (context) {
        morpherTradeSDK.setContext(context).then (ctx => {
          set({ context:ctx })
        })
      }
    },
    getLeaderboard: (parameters) => {

      let leaderboard = get().leaderboard;
      if (leaderboard && leaderboard[parameters.type]) {
        return
      }
      if (parameters) {
        morpherTradeSDK.getLeaderboard({type: parameters.type, app: parameters.app, eth_address: parameters.eth_address}).then(data => {
          
          leaderboard[parameters.type] = data
          set({ leaderboard })

        })
        
      }
    
    },
    setEthAddress: (eth_address) => {
      const current_eth_address = get().eth_address;
      if (eth_address === current_eth_address) return;

      set({ eth_address });
      if (eth_address) {
        fetchPortfolioData();
        morpherTradeSDK.subscribeToOrder(eth_address, (update: any) => {
          if (update.data.orderId) {
             morpherTradeSDK.getOrders({
              eth_address: eth_address,
              order_id: update.data.orderId
            }).then(orders => {
              if (orders && orders.length > 0) {
                let order = orders[0]
                set({ orderUpdate: order });
                if (order.status == 'success') {
                  set({ tradeComplete: true });
                }

              }
            })
          }
                
          fetchPortfolioData(); // Refetch on order update
        });
      } else {
        morpherTradeSDK.subscribeToOrder("", () => {});
        set({ portfolio: undefined, returns: {}, loading: false });
      }
    },
    closePercentage: 100,
    setClosePercentage: (closePercentage) => set({ closePercentage }),
    tradeDirection: 'open' as 'open' | 'close',
    setTradeDirection: (tradeDirection) => set({ tradeDirection }),

    positionList: undefined,
    setPositionList: (positionList) => {
      let positionValue = 0
      positionList?.forEach(position => {
        positionValue += Number(position.value)
      })
      
      set({ positionList, positionValue })

    },

    selectedPosition: undefined,
    setSelectedPosition: (position) => {
      set({ selectedPosition: position });
    },
    portfolio: undefined,
    tradeComplete: false,
    setPortfolio: (portfolio) => set({ portfolio }),
    setTradeComplete: (complete) => {
      set({ tradeComplete: !!complete });
      if (complete) {
        fetchPortfolioData();
      }
    },
    setReturns: (type, returns) => {
      if (!returns) returns = [];
      let r = get().returns
      r[type] = returns
      set({ returns: r })
    }
  };
});
