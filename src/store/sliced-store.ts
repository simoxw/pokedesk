import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { del, get, set } from 'idb-keyval';

import { GameStore } from './types';
import { BattleEngine } from '../BattleEngine';
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

// Verifica veloce accessibilità IndexedDB 
async function checkIndexedDBHealth(): Promise<boolean> { 
  try { 
    const testKey = '__idb_health__'; 
    await set(testKey, '1'); 
    await del(testKey); 
    return true; 
  } catch { 
    return false; 
  } 
} 
// Eseguito una sola volta al boot in background 
checkIndexedDBHealth().then(ok => { 
  if (!ok) console.warn('[PokéDesk] IndexedDB non disponibile, uso localStorage'); 
}); 

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
        
        // Fix retroactive: clamp EVs to max 510 per stat group (total 510)
        const fixEvRetroactive = (p: any) => {
          const evs = p.evs || {};
          const totalEvs = Object.values(evs).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) as number;
          if (totalEvs > 510) {
            const scale = 510 / totalEvs;
            const newEvs = Object.fromEntries(
              Object.entries(evs).map(([stat, value]: [string, any]) => [stat, Math.floor((Number(value) || 0) * scale)])
            );
            return { ...p, evs: newEvs };
          }
          return p;
        };
        state.team = state.team.map(fixEvRetroactive);
        state.box = state.box.map(fixEvRetroactive);

        // Fix retroattivo: porta tutti i Pokémon sopra il livello 100 a livello 100
        const clampLevel100 = (p: any) => {
          if (!p || p.level <= 100) return p;
          const cappedLevel = 100;
          const newStats = BattleEngine.calculateStats(
            cappedLevel,
            p.baseStats,
            p.ivs,
            p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            p.nature
          );
          // Calcola exp minima per il livello 100 in base al growth rate
          const gr = p.growthRate ?? 'medium-fast';
          const exp100 = (() => {
            if (gr === 'slow') return Math.floor(5 * 100 ** 3 / 4);
            if (gr === 'medium-slow') return Math.max(0, Math.floor(6/5 * 100**3 - 15*100**2 + 100*100 - 140));
            if (gr === 'fast') return Math.floor(4 * 100 ** 3 / 5);
            return 100 ** 3;
          })();
          return {
            ...p,
            level: cappedLevel,
            exp: exp100,
            stats: newStats,
            currentHp: Math.min(newStats.hp, Math.max(1, p.currentHp)),
          };
        };
        state.team = state.team.map(clampLevel100);
        state.box = state.box.map(clampLevel100);
        
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
