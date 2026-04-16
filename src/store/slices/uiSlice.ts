import { StateCreator } from 'zustand';
import { BattleEngine } from '../../BattleEngine';
import { GameStore, Pokemon, ScreenName } from '../types';
import { isPokemonInPresetCategory, isTeamValidForPresetCategory, updateGenMissionProgress } from './missionSlice';

export type UiSlice = Pick<
  GameStore,
  | 'currentScreen'
  | 'pendingEvolution'
  | 'pendingNewMoveQueue'
  | 'pendingMissionToast'
  | 'pendingMedalUnlock'
  | 'isFirstRun'
  | 'settings'
  | 'expShareActive'
  | 'friendBattleTeam'
  | 'leagueBattleTeam'
  | 'leagueBattleResult'
  | 'masterBattleTeam'
  | 'masterBattleResult'
  | 'setScreen'
  | 'confirmEvolution'
  | 'dismissEvolution'
  | 'dismissNewMove'
  | 'dismissMedalUnlock'
  | 'dismissMissionToast'
  | 'updateSettings'
  | 'toggleExpShare'
  | 'expBoostActive'
  | 'toggleExpBoost'
  | 'setFriendBattleTeam'
  | 'clearFriendBattleTeam'
  | 'setLeagueBattleTeam'
  | 'clearLeagueBattleTeam'
  | 'setLeagueBattleResult'
  | 'setMasterBattleTeam'
  | 'clearMasterBattleTeam'
  | 'setMasterBattleResult'
>;

export const createUiSlice: StateCreator<GameStore, [], [], UiSlice> = (set, get) => ({
  currentScreen: 'START_SCREEN' as ScreenName,
  pendingEvolution: null,
  pendingNewMoveQueue: [],
  pendingMissionToast: null,
  pendingMedalUnlock: null,
  isFirstRun: true,
  settings: { audio: true, notifications: true },
  expShareActive: false,
  expBoostActive: false,
  friendBattleTeam: null,
  leagueBattleTeam: null,
  leagueBattleResult: null,
  masterBattleTeam: null,
  masterBattleResult: null,
  setScreen: (screen) => set({ currentScreen: screen }),
  confirmEvolution: () =>
    set((state) => {
      const pending = state.pendingEvolution;
      if (!pending) return {};
      const updatePkmn = (p: Pokemon) => {
        if (p.id !== pending.pokemonId) return p;

        if (!pending.newBaseStats) {
          return {
            ...p,
            pokemonId: pending.newPokemonId,
            name: pending.newName,
            types: pending.newTypes ?? p.types,
          };
        }

        const newBaseStats = pending.newBaseStats;
        const newStats = BattleEngine.calculateStats(
          p.level,
          newBaseStats,
          p.ivs,
          p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
          p.nature
        );
        return {
          ...p,
          pokemonId: pending.newPokemonId,
          name: pending.newName,
          baseStats: newBaseStats,
          types: pending.newTypes ?? p.types,
          stats: newStats,
          currentHp: Math.min(newStats.hp, p.currentHp + (newStats.hp - p.stats.hp)),
        };
      };
      const updatedTeam = state.team.map(updatePkmn);
      const updatedBox = state.box.map(updatePkmn);

      // Keep Pokédex sync behavior identical to legacy implementation.
      get().updatePokedex(pending.newPokemonId, 'caught', pending.newTypes?.[0]);

      const evolvedPokemon = [...updatedTeam, ...updatedBox].find((p) => p.id === pending.pokemonId);
      const genEvolveUpdates =
        evolvedPokemon &&
        state.activePresetCategory &&
        isPokemonInPresetCategory(evolvedPokemon, state.activePresetCategory) &&
        isTeamValidForPresetCategory(state.team, state.activePresetCategory)
          ? updateGenMissionProgress(state, 'genEvolve')
          : {};

      return {
        team: updatedTeam,
        box: updatedBox,
        pendingEvolution: null,
        ...genEvolveUpdates,
      };
    }),
  dismissEvolution: () => set({ pendingEvolution: null }),
  dismissNewMove: () =>
    set((state) => ({
      pendingNewMoveQueue: (state.pendingNewMoveQueue ?? []).slice(1),
    })),
  dismissMedalUnlock: () => set({ pendingMedalUnlock: null }),
  dismissMissionToast: () => set({ pendingMissionToast: null }),
  updateSettings: (updates) => set((state) => ({ settings: { ...state.settings, ...updates } })),
  toggleExpShare: () => set((state) => ({ expShareActive: !state.expShareActive })),
  toggleExpBoost: () => set((state) => ({ expBoostActive: !state.expBoostActive })),
  setFriendBattleTeam: (team) => set({ friendBattleTeam: team }),
  clearFriendBattleTeam: () => set({ friendBattleTeam: null }),
  setLeagueBattleTeam: (team) => set({ leagueBattleTeam: team }),
  clearLeagueBattleTeam: () => set({ leagueBattleTeam: null }),
  setLeagueBattleResult: (result) => set({ leagueBattleResult: result }),
  setMasterBattleTeam: (team) => set({ masterBattleTeam: team }),
  clearMasterBattleTeam: () => set({ masterBattleTeam: null }),
  setMasterBattleResult: (result) => set({ masterBattleResult: result }),
});
