import { create } from "zustand";

interface NavigationState {
  page: string;
  history: string[];
  navigate: (pageName: string) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  page: "home",
  history: [],
  navigate: (pageName: string) => {
    const history = get().history;
    history.push(pageName);
    set({ page: pageName, history });
  },
  back: () => {
    const history = get().history;

    if (history && history.length > 0) {
      const pageName = history.pop();
      set({ page: pageName, history });
    }
  },
}));
