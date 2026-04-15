import { StateCreator } from 'zustand';
import { GameStore } from '../types';
import { updateMissionProgress } from './missionSlice';

export type InventorySlice = Pick<
  GameStore,
  'coins' | 'inventory' | 'addCoins' | 'addItem' | 'useItem'
>;

export const createInventorySlice: StateCreator<GameStore, [], [], InventorySlice> = (set) => ({
  coins: 0,
  inventory: {},
  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  addItem: (itemId, amount) =>
    set((state) => ({
      inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] || 0) + amount },
    })),
  useItem: (itemId) =>
    set((state) => {
      const availableQty = state.inventory[itemId] || 0;
      if (availableQty <= 0) return {};
      const healItems = new Set(['potion', 'superpotion', 'hyperpotion', 'full_heal']);
      const missionUpdates = healItems.has(itemId) ? updateMissionProgress(state, 'useItem') : {};
      return {
        inventory: { ...state.inventory, [itemId]: availableQty - 1 },
        ...missionUpdates,
      };
    }),
});
