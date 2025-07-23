import { create } from 'zustand'
import { TAddress, TCurrency, TCurrencyDetails } from 'morpher-trading-sdk'
import { MorpherTradeSDK } from 'morpher-trading-sdk';
import { TPortfolioDataPoint, TPosition } from 'morpher-trading-sdk';
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
  tradeComplete: boolean;
  setTradeComplete: (complete?: boolean) => void;
  returns: {[type: string ]: TPortfolioDataPoint[]}
  setReturns: (type: "d" | "w" | "m" | "y", returns?: TPortfolioDataPoint[]) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => {
  const fetchPortfolioData = async () => {
    const { eth_address } = get();
    if (!eth_address) {
      console.log("fetchPortfolioData: No eth_address, skipping fetch.");
      set({ loading: false });
      return;
    }
    console.log("fetchPortfolioData: Starting for address:", eth_address);
    set({ loading: true });
    try {
      const portfolio = await morpherTradeSDK.getPortfolio({ eth_address });
      console.log("fetchPortfolioData: Fetched portfolio:", portfolio);

      const [returnsD, returnsW, returnsM, returnsY] = await Promise.all([
        morpherTradeSDK.getPortfolioReturns({ eth_address, timeframe: 'd' }),
        morpherTradeSDK.getPortfolioReturns({ eth_address, timeframe: 'w' }),
        morpherTradeSDK.getPortfolioReturns({ eth_address, timeframe: 'm' }),
        morpherTradeSDK.getPortfolioReturns({ eth_address, timeframe: 'y' }),
      ]);
      console.log("fetchPortfolioData: Fetched returns.");
      
      set({
        portfolio,
        returns: {
          d: returnsD,
          w: returnsW,
          m: returnsM,
          y: returnsY,
        },
      });
    } catch (error: any) {
      console.error("Failed to fetch portfolio data:", error);
      if (error.message && error.message.includes("No portfolio was found")) {
        console.log("fetchPortfolioData: No portfolio exists for this user. Setting default state.");
        set({
          portfolio: {
            total_portfolio_value: "0",
            positions_count: 0,
            total_portfolio_value_unrealized_pnl: '0',
            total_open_position_value: '0',
          },
          returns: { d: [], w: [], m: [], y: [] },
        });
      } else {
        // For other errors, clear the portfolio to avoid showing stale data
        set({ portfolio: undefined, returns: {} });
      }
    } finally {
      console.log("fetchPortfolioData: Finished, setting loading to false.");
      set({ loading: false });
      sdk.actions.ready();
    }
  };

  return {
    tradeAmount: '',
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
    setEthAddress: (eth_address) => {
      console.log("Setting eth_address:", eth_address);
      const current_eth_address = get().eth_address;
      if (eth_address === current_eth_address) return;

      set({ eth_address });
      if (eth_address) {
        fetchPortfolioData();
        morpherTradeSDK.subscribeToOrder(eth_address, (update: any) => {
          console.log("Order update received:", update);
          set({ orderUpdate: update });
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
