import { StateCreator } from 'zustand';
import { Achievement, GameStore } from '../types';

export type AchievementSlice = Pick<
  GameStore,
  | 'achievements'
  | 'claimedPokedexRewards'
  | 'initializeAchievements'
  | 'updateAchievementProgress'
  | 'unlockAchievement'
  | 'claimPokedexReward'
>;

export const createAchievementSlice: StateCreator<GameStore, [], [], AchievementSlice> = (set) => ({
  achievements: [],
  claimedPokedexRewards: [],
  initializeAchievements: () =>
    set((state) => {
      const allPokemon = [...state.team, ...state.box];
      const shinyCount = allPokemon.filter((p) => p.isShiny).length;
      const caughtEntries = Object.entries(state.pokedex)
        .filter(([, s]) => s === 'caught')
        .map(([id]) => Number(id));
      const gen1Count = caughtEntries.filter((id) => id <= 151).length;
      const gen2Count = caughtEntries.filter((id) => id >= 152 && id <= 251).length;
      const totalCount = caughtEntries.length;

      const achievements: Achievement[] = [
        { id: 'catch_10', name: 'Primo Passo', description: 'Cattura 10 Pokémon', category: 'catch', target: 10, reward: { coins: 500 }, progress: state.stats.totalCaught, unlocked: false },
        { id: 'catch_100', name: 'Cacciatore Esperto', description: 'Cattura 100 Pokémon', category: 'catch', target: 100, reward: { coins: 5000 }, progress: state.stats.totalCaught, unlocked: false },
        { id: 'catch_500', name: 'Maestro Catture', description: 'Cattura 500 Pokémon', category: 'catch', target: 500, reward: { coins: 20000, items: { masterball: 1 } }, progress: state.stats.totalCaught, unlocked: false },
        { id: 'battle_10', name: 'Guerriero', description: 'Vinci 10 battaglie', category: 'battle', target: 10, reward: { coins: 1000 }, progress: state.stats.totalBattles, unlocked: false },
        { id: 'battle_50', name: 'Campione', description: 'Vinci 50 battaglie', category: 'battle', target: 50, reward: { coins: 5000 }, progress: state.stats.totalBattles, unlocked: false },
        { id: 'battle_100', name: 'Leggenda', description: 'Vinci 100 battaglie', category: 'battle', target: 100, reward: { coins: 10000, items: { rare_candy: 5 } }, progress: state.stats.totalBattles, unlocked: false },
        { id: 'shiny_1', name: 'Scintilla', description: 'Cattura 1 Shiny', category: 'shiny', target: 1, reward: { coins: 2000 }, progress: shinyCount, unlocked: false },
        { id: 'shiny_10', name: 'Shiny Hunter', description: 'Cattura 10 Shiny', category: 'shiny', target: 10, reward: { coins: 15000, items: { masterball: 1 } }, progress: shinyCount, unlocked: false },
        { id: 'shiny_50', name: 'Cacciatore di Stelle', description: 'Cattura 50 Shiny', category: 'shiny', target: 50, reward: { coins: 50000, title: 'Shiny Hunter' }, progress: shinyCount, unlocked: false },
        { id: 'pokedex_gen1', name: 'Professor Kanto', description: 'Completa il Pokédex Gen 1', category: 'collection', target: 151, reward: { coins: 10000, items: { rare_candy: 3 } }, progress: gen1Count, unlocked: false },
        { id: 'pokedex_gen2', name: 'Professor Johto', description: 'Completa il Pokédex Gen 2', category: 'collection', target: 100, reward: { coins: 10000, items: { rare_candy: 3 } }, progress: gen2Count, unlocked: false },
        { id: 'pokedex_all', name: 'Professor Pokémon', description: 'Completa tutti i Pokédex', category: 'collection', target: 1008, reward: { coins: 50000, title: 'Professor' }, progress: totalCount, unlocked: false },
        { id: 'col_gen3', name: 'Esploratore Hoenn', description: 'Cattura 50 Pokémon di Gen 3', category: 'collection', target: 50, reward: { coins: 3000, items: { rare_candy: 2 } }, progress: 0, unlocked: false },
        { id: 'col_gen3_full', name: 'Maestro Hoenn', description: 'Cattura tutti i 135 Pokémon di Gen 3', category: 'collection', target: 135, reward: { coins: 10000, items: { rare_candy: 3, masterball: 1 } }, progress: 0, unlocked: false },
        { id: 'col_gen4', name: 'Esploratore Sinnoh', description: 'Cattura 50 Pokémon di Gen 4', category: 'collection', target: 50, reward: { coins: 3000, items: { rare_candy: 2 } }, progress: 0, unlocked: false },
        { id: 'col_gen4_full', name: 'Maestro Sinnoh', description: 'Cattura tutti i 107 Pokémon di Gen 4', category: 'collection', target: 107, reward: { coins: 10000, items: { rare_candy: 3, masterball: 1 } }, progress: 0, unlocked: false },
        { id: 'col_gen5', name: 'Esploratore Unima', description: 'Cattura 50 Pokémon di Gen 5', category: 'collection', target: 50, reward: { coins: 4000, items: { rare_candy: 2 } }, progress: 0, unlocked: false },
        { id: 'col_gen5_full', name: 'Maestro Unima', description: 'Cattura tutti i 156 Pokémon di Gen 5', category: 'collection', target: 156, reward: { coins: 12000, items: { rare_candy: 4, masterball: 1 } }, progress: 0, unlocked: false },
        { id: 'col_gen6', name: 'Esploratore Kalos', description: 'Cattura 30 Pokémon di Gen 6', category: 'collection', target: 30, reward: { coins: 4000, items: { rare_candy: 2 } }, progress: 0, unlocked: false },
        { id: 'col_gen6_full', name: 'Maestro Kalos', description: 'Cattura tutti i 72 Pokémon di Gen 6', category: 'collection', target: 72, reward: { coins: 12000, items: { rare_candy: 4, masterball: 1 } }, progress: 0, unlocked: false },
        { id: 'col_gen7', name: 'Esploratore Alola', description: 'Cattura 30 Pokémon di Gen 7', category: 'collection', target: 30, reward: { coins: 4000, items: { rare_candy: 2 } }, progress: 0, unlocked: false },
        { id: 'col_gen7_full', name: 'Maestro Alola', description: 'Cattura tutti i 88 Pokémon di Gen 7', category: 'collection', target: 88, reward: { coins: 12000, items: { rare_candy: 4, masterball: 2 } }, progress: 0, unlocked: false },
        { id: 'col_gen8', name: 'Esploratore Galar', description: 'Cattura 30 Pokémon di Gen 8', category: 'collection', target: 30, reward: { coins: 4000, items: { rare_candy: 2 } }, progress: 0, unlocked: false },
        { id: 'col_gen8_full', name: 'Maestro Galar', description: 'Cattura tutti i 89 Pokémon di Gen 8', category: 'collection', target: 89, reward: { coins: 12000, items: { rare_candy: 4, masterball: 1 } }, progress: 0, unlocked: false },
        { id: 'league_win', name: 'Aspirante', description: 'Sconfiggi un membro della Lega', category: 'special', target: 1, reward: { coins: 5000 }, progress: 0, unlocked: false },
        { id: 'league_master', name: 'Campione', description: 'Sconfiggi tutti i Master', category: 'special', target: 8, reward: { coins: 20000, title: 'Champion' }, progress: 0, unlocked: false },
        { id: 'no_damage', name: 'Invincibile', description: 'Vinci una battaglia senza subire danni', category: 'special', target: 1, reward: { coins: 3000 }, progress: 0, unlocked: false },
        { id: 'streak_10', name: 'Serie Vincente', description: '10 vittorie consecutive', category: 'special', target: 10, reward: { coins: 5000 }, progress: 0, unlocked: false },
        { id: 'breed_10', name: 'Allevatore', description: 'Schiudi 10 uova', category: 'special', target: 10, reward: { coins: 5000, items: { rare_candy: 5 } }, progress: state.eggs.filter((e) => e.hatchAt < Date.now()).length, unlocked: false },
        { id: 'tower_floor_25', name: 'Guerriero della Torre', description: 'Raggiungi il piano 25 della Torre Lotta', category: 'special', target: 25, reward: { coins: 10000, items: { rare_candy: 3 } }, progress: state.battleTower?.bestFloor ?? 0, unlocked: false },
        { id: 'tower_floor_49', name: 'Maestro della Torre', description: 'Raggiungi il piano 49 della Torre Lotta', category: 'special', target: 49, reward: { coins: 25000, items: { masterball: 2, rare_candy: 5 } }, progress: state.battleTower?.bestFloor ?? 0, unlocked: false },
        { id: 'tower_floor_77', name: 'Leggenda della Torre', description: 'Raggiungi il piano 77 della Torre Lotta', category: 'special', target: 77, reward: { coins: 50000, items: { masterball: 3, rare_candy: 10 }, title: 'Tower Legend' }, progress: state.battleTower?.bestFloor ?? 0, unlocked: false },
      ];

      const existingIds = new Set(state.achievements.map((a) => a.id));
      const merged = [...state.achievements, ...achievements.filter((a) => !existingIds.has(a.id))];
      return { achievements: merged };
    }),
  updateAchievementProgress: (achievementId, progress) =>
    set((state: any) => ({
      achievements: state.achievements.map((a: any) =>
        a.id === achievementId ? { ...a, progress: Math.min(progress, a.target) } : a
      ),
    })),
  unlockAchievement: (achievementId) =>
    set((state: any) => {
      const updated = state.achievements.map((a: any) => (a.id === achievementId ? { ...a, unlocked: true } : a));
      const achievement = state.achievements.find((a: any) => a.id === achievementId);
      if (!achievement) return { achievements: updated };

      const newState: any = { achievements: updated };
      if (achievement.reward.coins) {
        newState.coins = state.coins + achievement.reward.coins;
      }
      if (achievement.reward.items) {
        const newInventory = { ...state.inventory };
        Object.entries(achievement.reward.items).forEach(([itemId, qty]) => {
          newInventory[itemId] = (newInventory[itemId] || 0) + (qty as number);
        });
        newState.inventory = newInventory;
      }
      return newState;
    }),
  claimPokedexReward: (genId) =>
    set((state) => {
      if (state.claimedPokedexRewards.includes(genId)) return {};
      const rewards: Record<string, { coins: number; items: Record<string, number> }> = {
        gen1: { coins: 1000, items: { rare_candy: 2, ultraball: 3 } },
        gen2: { coins: 1000, items: { rare_candy: 2, ultraball: 3 } },
        gen3: { coins: 1500, items: { rare_candy: 3, masterball: 1 } },
        gen4: { coins: 1500, items: { rare_candy: 3, masterball: 1 } },
        gen5: { coins: 2000, items: { rare_candy: 4, masterball: 1 } },
        gen6: { coins: 2000, items: { rare_candy: 4, masterball: 1 } },
        gen7: { coins: 2500, items: { rare_candy: 5, masterball: 2 } },
        gen8: { coins: 2500, items: { rare_candy: 5, masterball: 2 } },
      };
      const reward = rewards[genId];
      if (!reward) return {};
      const newInventory = { ...state.inventory };
      Object.entries(reward.items).forEach(([id, qty]) => {
        newInventory[id] = (newInventory[id] || 0) + qty;
      });
      return {
        claimedPokedexRewards: [...state.claimedPokedexRewards, genId],
        coins: state.coins + reward.coins,
        inventory: newInventory,
      };
    }),
});
