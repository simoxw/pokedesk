import { StateCreator } from 'zustand';
import { GameStore } from '../types';

export type PlayerSlice = Pick<
  GameStore,
  'player' | 'streak' | 'lastStreakDate' | 'setPlayer' | 'updatePlayer' | 'updatePlayTime' | 'claimStreak'
>;

const STREAK_REWARDS = [
  { coins: 50, item: 'pokeball', qty: 3 },
  { coins: 50, item: 'potion', qty: 3 },
  { coins: 200, item: 'superpotion', qty: 1 },
  { coins: 300, item: 'hyperpotion', qty: 1 },
  { coins: 500, item: 'rare_candy', qty: 1 },
  { coins: 750, item: 'rare_candy', qty: 1 },
  { coins: 1000, item: 'ultraball', qty: 2 },
  { coins: 1100, item: 'ultraball', qty: 2 },
  { coins: 1200, item: 'rare_candy', qty: 1 },
  { coins: 1300, item: 'ultraball', qty: 3 },
  { coins: 1500, item: 'hyperpotion', qty: 2 },
  { coins: 1600, item: 'rare_candy', qty: 2 },
  { coins: 1800, item: 'ultraball', qty: 4 },
  { coins: 2000, item: 'masterball', qty: 1 },
];

export const createPlayerSlice: StateCreator<GameStore, [], [], PlayerSlice> = (set) => ({
  player: { name: '', gender: 'M' as const, createdAt: Date.now(), playTime: 0 },
  streak: 0,
  lastStreakDate: null,
  setPlayer: (name, gender) =>
    set({
      player: { name, gender, createdAt: Date.now(), playTime: 0 },
      isFirstRun: false,
    }),
  updatePlayer: (updates) =>
    set((state) => ({
      player: { ...state.player, ...updates },
    })),
  updatePlayTime: (seconds) =>
    set((state) => ({
      player: { ...state.player, playTime: state.player.playTime + seconds },
    })),
  claimStreak: () =>
    set((state) => {
      const today = new Date().toLocaleDateString('en-CA');
      if (state.lastStreakDate === today) return {};
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
      const nextStreak = state.lastStreakDate === yesterday ? (state.streak || 0) + 1 : 1;
      const streak = ((nextStreak - 1) % STREAK_REWARDS.length) + 1;
      const reward = STREAK_REWARDS[streak - 1];
      return {
        lastStreakDate: today,
        streak,
        coins: state.coins + reward.coins,
        inventory: { ...state.inventory, [reward.item]: (state.inventory[reward.item] || 0) + reward.qty },
      };
    }),
});
