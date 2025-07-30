import { create } from 'zustand'
import { TMarketType } from "morpher-trading-sdk"
import { TMarket, TMarketData, TOrder } from "morpher-trading-sdk"
import { MorpherTradeSDK, MarketDetail } from "morpher-trading-sdk"
// import { MorpherTradeSDK, MarketDetail } from "../../../morpher-trading-sdk/src/index"



const morpherTradeSDK = new MorpherTradeSDK(import.meta.env.VITE_MORPHER_API_ENDPOINT);

interface MarketState {
  marketType: TMarketType | undefined;
  morpherTradeSDK: MorpherTradeSDK;
  setMarketType: (marketType: TMarketType | undefined) => void;
  marketList?: TMarket[];
  setMarketList: (marketList?: TMarket[]) => void;
  marketListAll?: TMarketData;
  setMarketListAll: (marketList?: TMarketData) => void;
  selectedMarketId: string;
  setSelectedMarketId: (marketId: string) => void;
  selectedMarket?: TMarket;
  setSelectedMarket: (market?: TMarket) => void;
  livePrice?: {[market_id:string]: number};
  setLivePrice: (market_id: string, close?: number) => void;
  marketData?: MarketDetail;
  setMarketData: (marketData?: MarketDetail) => void;
  order?: TOrder;
  setOrder: (orderData?: TOrder) => void;
  tradeType: 'long' | 'short';
  setTradeType: (tradeType: 'long' | 'short') => void;
  leverage: number[];
  setLeverage: (leverage: number[]) => void;
  getTrendingMarkets: () => void;
  trendingMarkets?: TMarketData[];
}

export const useMarketStore = create<MarketState>((set, get) => ({
  marketType: undefined,
  morpherTradeSDK: morpherTradeSDK,
  setMarketType: (marketType) => set({ marketType, selectedMarketId: "", marketList: undefined, marketData: undefined, selectedMarket: undefined }),
  marketList: undefined,
  setMarketList: (marketList) => set({ marketList }),
  setMarketListAll: (marketListAll) => set({ marketListAll }),
  selectedMarketId: "",
  setSelectedMarketId: (marketId) => set({ selectedMarketId: marketId }),
  selectedMarket: undefined,
    setSelectedMarket: (market) => {
    set({ selectedMarket: market });
    if (market?.market_id) {
      let livePrice = get().livePrice || {}
    
      livePrice[market.market_id] = market?.close;
      set({ livePrice })
    }
    
    if (market) {
      morpherTradeSDK.subscribeToMarket(market.market_id, (update: any) => {

         set((state) => ({
          livePrice: {
            ...state.livePrice,
            [market.market_id]: update.close
          }

          }));
            


      })
    } else {
      morpherTradeSDK.subscribeToMarket("", () => {});
    }
  },
  livePrice: {},
  setLivePrice: (market_id, close) => {
    if (market_id && close) {
      let livePrice = get().livePrice || {}
  
      
      livePrice[market_id] = close;
      set({ livePrice })
    }

  }, 

  trendingMarkets: undefined,
  marketData: undefined,
  setMarketData: (marketData) => set({ marketData }),
  order: undefined,
  setOrder: (order) => set({ order }),
  tradeType: 'long',
  setTradeType: (tradeType) => set({ tradeType }),
  leverage: [1],
  setLeverage: (leverage) => set({ leverage }),
  getTrendingMarkets: () => {
    morpherTradeSDK.getTrendingMarkets().then(trendingMarkets => {
      
      
      set({trendingMarkets})
    })
  }
}));
