import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { del, get, set } from 'idb-keyval';

import { GameStore } from './types';
import { createAchievementSlice } from './slices/achievementSlice';
import { createBreedingSlice } from './slices/breedingSlice';
import { createInventorySlice } from './slices/inventorySlice';
import { createMissionSlice } from './slices/missionSlice';
import { createPlayerSlice } from './slices/playerSlice';
import { createPokemonSlice } from './slices/pokemonSlice';
import { createProgressSlice } from './slices/progressSlice';
import { createTeamSlice } from './slices/teamSlice';
import { createUiSlice } from './slices/uiSlice';

const SAVE_KEY = 'pokedesk-save';
const LEGACY_BACKUP_KEY = 'pokedesk-save-legacy-backup';
const MIGRATION_FLAG_KEY = 'pokedesk-idb-migrated';
const hasLocalStorage = typeof localStorage !== 'undefined';
const hasIndexedDB = typeof indexedDB !== 'undefined';

const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const migrationDone = hasLocalStorage ? localStorage.getItem(MIGRATION_FLAG_KEY) : null;
      if (!migrationDone && hasLocalStorage) {
        const legacyData = localStorage.getItem(name);
        if (legacyData) {
          if (hasIndexedDB) {
            await set(name, legacyData);
            const written = await get<string>(name);
            if (written === legacyData) {
              localStorage.setItem(LEGACY_BACKUP_KEY, legacyData);
              localStorage.setItem(MIGRATION_FLAG_KEY, Date.now().toString());
              console.log('[PokéDesk] ✅ Migrazione IndexedDB completata con successo');
            } else {
              console.warn('[PokéDesk] ⚠️ Verifica migrazione fallita');
              return legacyData;
            }
          } else {
            return legacyData;
          }
        }
      }
      if (hasIndexedDB) {
        const value = await get<string>(name);
        if (value !== undefined && value !== null) return value;
      }
      return hasLocalStorage ? localStorage.getItem(name) : null;
    } catch (err) {
      console.warn('[PokéDesk] IndexedDB non disponibile → fallback localStorage', err);
      return hasLocalStorage ? localStorage.getItem(name) : null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (hasIndexedDB) {
        await set(name, value);
      }
      if (hasLocalStorage && localStorage.getItem(MIGRATION_FLAG_KEY)) {
        localStorage.removeItem(name);
      }
    } catch (err) {
      console.warn('[PokéDesk] Scrittura IndexedDB fallita → localStorage', err);
      if (hasLocalStorage) localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (hasIndexedDB) await del(name);
    } catch (err) {
      console.warn('[PokéDesk] Errore remove IndexedDB', err);
    }
    if (hasLocalStorage) {
      localStorage.removeItem(name);
      localStorage.removeItem(LEGACY_BACKUP_KEY);
      localStorage.removeItem(MIGRATION_FLAG_KEY);
    }
  },
};

export const useStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createPlayerSlice(...a),
      ...createUiSlice(...a),
      ...createInventorySlice(...a),
      ...createTeamSlice(...a),
      ...createPokemonSlice(...a),
      ...createProgressSlice(...a),
      ...createMissionSlice(...a),
      ...createAchievementSlice(...a),
      ...createBreedingSlice(...a),
    }),
    {
      name: SAVE_KEY,
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const clampHp = (p: any) => ({
          ...p,
          currentHp: Math.min(p.stats?.hp ?? p.currentHp, Math.max(0, p.currentHp)),
        });
        state.team = state.team.map(clampHp);
        state.box = state.box.map(clampHp);
        state.pendingEvolution = null;
        state.pendingNewMoveQueue = [];
        if (!state.eggs) state.eggs = [];
        if (!state.pokedexTypes) state.pokedexTypes = {};
        [...state.team, ...state.box].forEach((p) => {
          if (p.pokemonId && p.types?.[0] && !state.pokedexTypes[p.pokemonId]) {
            state.pokedexTypes[p.pokemonId] = p.types[0];
          }
        });
        state.leagueBattleTeam = null;
        state.leagueBattleResult = null;
        state.masterBattleTeam = null;
        state.masterBattleResult = null;
        if (!state.masterProgress) state.masterProgress = { defeatedIds: [] };
        if (!state.claimedPokedexRewards) state.claimedPokedexRewards = [];
        if (state.battleWinStreak === undefined) state.battleWinStreak = 0;
        if (!state.achievements) state.achievements = [];
        if (state.leagueProgress?.trophies) {
          state.leagueProgress.trophies = [...new Set(state.leagueProgress.trophies)];
        }
        if (!state.battleTower) {
          state.battleTower = {
            currentFloor: 0,
            bestFloor: 0,
            isActive: false,
            teamSnapshot: [],
            claimedFloorRewards: [],
          };
        }
        if (!state.teamPresets) state.teamPresets = {};
        if (!state.dojoTrainingCount) state.dojoTrainingCount = {};
        if (state.activePresetCategory === undefined) state.activePresetCategory = null;
        if (state.genChallenges === undefined) state.genChallenges = null;
        
        // Auto-unlock exp_share and exp_boost if 40+ medals unlocked
        const bossesWon = (state.medals || []).filter((m: any) => m.isUnlocked).length;
        if (bossesWon >= 40) {
          if ((state.inventory['exp_share'] || 0) === 0) {
            state.inventory = { ...state.inventory, exp_share: 1 };
          }
          if ((state.inventory['exp_boost'] || 0) === 0) {
            state.inventory = { ...state.inventory, exp_boost: 1 };
          }
        }
      },
    }
  )
);
