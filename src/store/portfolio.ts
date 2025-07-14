import { create } from 'zustand'
import { TAddress, TCurrency, TCurrencyDetails } from '../../../morpher-trading-sdk/src/types'
import MorpherTradeSDK from '../../../morpher-trading-sdk/src';
import { TPosition } from '../../../morpher-trading-sdk/src/v2.router';
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
  orderUpdate?: any
  closePercentage?: number
  setClosePercentage: (closePercentage: number | undefined) => void
  tradeDirection: 'open' | 'close'
  setTradeDirection: (tradeDirection: 'open' | 'close') => void

  positionList?: TPosition[];
  setPositionList: (positionList?: TPosition[]) => void;
  selectedPosition?: TPosition;
  setSelectedPosition: (position?: TPosition) => void;
  
  portfolio?: any;
  setPortfolio: (portfolio?: any) => void;
  positionValue?: number;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  tradeAmount: '',
  setTradeAmount: (tradeAmount) => set({ tradeAmount }),
  selectedCurrency: undefined,
  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
  selectedCurrencyDetails: undefined,
  setSelectedCurrencyDetails: (details) => set({ selectedCurrencyDetails: details }),
  currencyList: undefined,
  setCurrencyList: (list) => set({ currencyList: list }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  eth_address: undefined,
  setEthAddress: (eth_address) => {
    set({ eth_address })
    
    if (eth_address) {
      morpherTradeSDK.subscribeToOrder(eth_address, (update: any) => {
        set({ orderUpdate: update })
      });
    } else {
      morpherTradeSDK.subscribeToOrder("", () => {});
    }
  },
  closePercentage: undefined,
  setClosePercentage: (closePercentage) => set({ closePercentage }),
  tradeDirection: 'open',
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
  setPortfolio: (portfolio) => set({ portfolio }),
}))
