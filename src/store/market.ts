import { create } from 'zustand'
import { TMarketType } from "../../../morpher-trading-sdk/src/types"
import { TMarket, TMarketData, TOrder } from "../../../morpher-trading-sdk/src/v2.router"
import MorpherTradeSDK, { MarketDetail } from "../../../morpher-trading-sdk/src/index"



const morpherTradeSDK = new MorpherTradeSDK(import.meta.env.VITE_MORPHER_API_ENDPOINT);

interface MarketState {
  marketType: TMarketType;
  morpherTradeSDK: MorpherTradeSDK;
  setMarketType: (marketType: TMarketType) => void;
  marketList?: TMarketData;
  setMarketList: (marketList?: TMarketData) => void;
  selectedMarketId: string;
  setSelectedMarketId: (marketId: string) => void;
  selectedMarket?: TMarket;
  setSelectedMarket: (market?: TMarket) => void;
  selectedMarketClose?: number;
  setSelectedMarketClose: (close?: number) => void;
  marketData?: MarketDetail;
  setMarketData: (marketData?: MarketDetail) => void;
  order?: TOrder;
  setOrder: (orderData?: TOrder) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  marketType: 'stock',
  morpherTradeSDK: morpherTradeSDK,
  setMarketType: (marketType) => set({ marketType, selectedMarketId: "", marketList: undefined, marketData: undefined, selectedMarket: undefined }),
  marketList: undefined,
  setMarketList: (marketList) => set({ marketList }),
  selectedMarketId: "",
  setSelectedMarketId: (marketId) => set({ selectedMarketId: marketId }),
  selectedMarket: undefined,
    setSelectedMarket: (market) => {
    set({ selectedMarket: market });
    set({ selectedMarketClose: market?.close })
    if (market) {
      morpherTradeSDK.subscribeToMarket(market.market_id, (update: any) => {

        set({ selectedMarketClose: update?.close })

      });
    } else {
      morpherTradeSDK.subscribeToMarket("", () => {});
    }
  },
  selectedMarketClose: undefined,
  setSelectedMarketClose: (close) => set({ selectedMarketClose: close }),

  marketData: undefined,
  setMarketData: (marketData) => set({ marketData }),
  order: undefined,
  setOrder: (order) => set({ order }),
  
}));
