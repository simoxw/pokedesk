import { StateCreator } from 'zustand';
import { BattleEngine } from '../../BattleEngine';
import { checkLevelUp } from '../../services/levelUpService';
import { GameStore, Pokemon } from '../types';
import {
  isPokemonInPresetCategory,
  isTeamValidForPresetCategory,
  updateGenMissionProgress,
  updateMissionProgress,
} from './missionSlice';

export type PokemonSlice = Pick<
  GameStore,
  | 'pokedex'
  | 'pokedexTypes'
  | 'stats'
  | 'dojoTrainingCount'
  | 'addPokemon'
  | 'updatePokemon'
  | 'releasePokemon'
  | 'useRareCandy'
  | 'useSpeciesCandy'
  | 'gainExp'
  | 'replaceMove'
  | 'updatePokedex'
  | 'incrementStat'
  | 'savePokedexTypes'
  | 'trainPokemon'
>;

export const createPokemonSlice: StateCreator<GameStore, [], [], PokemonSlice> = (set, get) => ({
  pokedex: {},
  pokedexTypes: {},
  dojoTrainingCount: {},
  stats: { totalCaught: 0, totalBattles: 0, shiniesFound: 0, pokemonReleased: 0 },
  addPokemon: (pokemon) =>
    set((state) => {
      const missionUpdates = updateMissionProgress(state, 'catch');
      const shinyUpdates = pokemon.isShiny ? updateMissionProgress({ ...state, ...missionUpdates } as GameStore, 'catchShiny') : {};
      const genCatchUpdates =
        state.activePresetCategory &&
        isPokemonInPresetCategory(pokemon, state.activePresetCategory) &&
        isTeamValidForPresetCategory(state.team, state.activePresetCategory)
          ? updateGenMissionProgress({ ...state, ...missionUpdates, ...shinyUpdates } as GameStore, 'genCatch')
          : {};
      const newPokedexTypes = pokemon.types?.[0] ? { ...state.pokedexTypes, [pokemon.pokemonId]: pokemon.types[0] } : state.pokedexTypes;
      if (state.team.length < 4) {
        return {
          team: [...state.team, pokemon],
          pokedex: { ...state.pokedex, [pokemon.pokemonId]: 'caught' },
          pokedexTypes: newPokedexTypes,
          ...missionUpdates,
          ...shinyUpdates,
          ...genCatchUpdates,
        };
      }
      return {
        box: [...state.box, pokemon],
        pokedex: { ...state.pokedex, [pokemon.pokemonId]: 'caught' },
        pokedexTypes: newPokedexTypes,
        ...missionUpdates,
        ...shinyUpdates,
        ...genCatchUpdates,
      };
    }),
  useRareCandy: (pokemonId) =>
    set((state) => {
      const CANDY_COST = 1;
      if ((state.inventory.rare_candy || 0) < CANDY_COST) return {};
      const applyTo = (list: Pokemon[]) =>
        list.map((p) => {
          if (p.id !== pokemonId || p.level >= 100) return p;
          const newLevel = p.level + 1;
          const newStats = BattleEngine.calculateStats(
            newLevel,
            p.baseStats,
            p.ivs,
            p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            p.nature
          );
          checkLevelUp(p, newLevel, p.moves, get, set).catch(console.error);
          get().updatePokedex(p.pokemonId, 'caught', p.types[0]);
          const newCurrentHp = Math.min(newStats.hp, Math.max(0, p.currentHp + (newStats.hp - p.stats.hp)));
          const expForNewLevel = (() => {
            const gr = p.growthRate ?? 'medium';
            if (gr === 'slow') return Math.floor((5 * newLevel ** 3) / 4);
            if (gr === 'medium-slow') return Math.max(0, Math.floor((6 / 5) * newLevel ** 3 - 15 * newLevel ** 2 + 100 * newLevel - 140));
            if (gr === 'fast') return Math.floor((4 * newLevel ** 3) / 5);
            return Math.floor(newLevel ** 3);
          })();
          const newExp = Math.max(p.exp, expForNewLevel);
          return { ...p, level: newLevel, exp: newExp, stats: newStats, currentHp: newCurrentHp };
        });
      return {
        team: applyTo(state.team),
        box: applyTo(state.box),
        inventory: { ...state.inventory, rare_candy: state.inventory.rare_candy - CANDY_COST },
      };
    }),
  useSpeciesCandy: (pokemonId, speciesId) =>
    set((state) => {
      const CANDY_COST = 3;
      const candyKey = `candy_${speciesId}`;
      if ((state.inventory[candyKey] || 0) < CANDY_COST) return {};
      const applyTo = (list: Pokemon[]) =>
        list.map((p) => {
          if (p.id !== pokemonId || (p.pokemonId !== speciesId && p.baseSpeciesId !== speciesId) || p.level >= 100) return p;
          const newLevel = p.level + 1;
          const newStats = BattleEngine.calculateStats(
            newLevel,
            p.baseStats,
            p.ivs,
            p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            p.nature
          );
          checkLevelUp(p, newLevel, p.moves, get, set).catch(console.error);
          get().updatePokedex(p.pokemonId, 'caught', p.types[0]);
          const newCurrentHp = Math.min(newStats.hp, Math.max(0, p.currentHp + (newStats.hp - p.stats.hp)));
          const expForNewLevel = (() => {
            const gr = p.growthRate ?? 'medium';
            if (gr === 'slow') return Math.floor((5 * newLevel ** 3) / 4);
            if (gr === 'medium-slow') return Math.max(0, Math.floor((6 / 5) * newLevel ** 3 - 15 * newLevel ** 2 + 100 * newLevel - 140));
            if (gr === 'fast') return Math.floor((4 * newLevel ** 3) / 5);
            return Math.floor(newLevel ** 3);
          })();
          const newExp = Math.max(p.exp, expForNewLevel);
          return { ...p, level: newLevel, exp: newExp, stats: newStats, currentHp: newCurrentHp };
        });
      return {
        team: applyTo(state.team),
        box: applyTo(state.box),
        inventory: { ...state.inventory, [candyKey]: state.inventory[candyKey] - CANDY_COST },
      };
    }),
  gainExp: (pokemonId, amount) =>
    set((state) => {
      const pokemon = [...state.team, ...state.box].find((p) => p.id === pokemonId);
      if (!pokemon) return {};
      let newExp = pokemon.exp + amount;
      let newLevel = pokemon.level;
      let newStats = pokemon.stats;
      while (newLevel < 100) {
        const nextLevelExp = BattleEngine.getExpForNextLevel(newLevel, pokemon.growthRate);
        if (newExp >= nextLevelExp) {
          newLevel += 1;
          newStats = BattleEngine.calculateStats(
            newLevel,
            pokemon.baseStats,
            pokemon.ivs,
            pokemon.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            pokemon.nature
          );
        } else {
          break;
        }
      }
      const hpDiff = newStats.hp - pokemon.stats.hp;
      const newCurrentHp = Math.min(newStats.hp, pokemon.currentHp + hpDiff);
      if (newLevel > pokemon.level) {
        checkLevelUp(pokemon, newLevel, pokemon.moves, get, set).catch(console.error);
        get().updatePokedex(pokemon.pokemonId, 'caught', pokemon.types[0]);
      }
      return {
        team: state.team.map((p) => (p.id === pokemonId ? { ...p, exp: newExp, level: newLevel, stats: newStats, currentHp: newCurrentHp } : p)),
        box: state.box.map((p) => (p.id === pokemonId ? { ...p, exp: newExp, level: newLevel, stats: newStats, currentHp: newCurrentHp } : p)),
      };
    }),
  updatePokedex: (pokemonId, status, primaryType) =>
    set((state) => {
      const current = state.pokedex[pokemonId];
      if (current === 'caught') return {};
      return {
        pokedex: { ...state.pokedex, [pokemonId]: status },
        ...(primaryType ? { pokedexTypes: { ...state.pokedexTypes, [pokemonId]: primaryType } } : {}),
      };
    }),
  incrementStat: (key) =>
    set((state) => ({
      stats: { ...state.stats, [key]: state.stats[key] + 1 },
    })),
  savePokedexTypes: (types) =>
    set((state) => ({
      pokedexTypes: { ...state.pokedexTypes, ...types },
    })),
  updatePokemon: (id, updates) =>
    set((state) => ({
      team: state.team.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      box: state.box.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  trainPokemon: (pokemonId: string, category: 'iv' | 'ev', stat: keyof Pokemon['ivs'], amount: number = 1) =>
    set((state) => {
      const pokemon = state.team.find((p) => p.id === pokemonId) ?? state.box.find((p) => p.id === pokemonId);
      if (!pokemon) return {};

      if (category === 'iv') {
        const currentIv = pokemon.ivs[stat];
        if (currentIv >= 31) return {};
        const trainingCount = state.dojoTrainingCount[pokemonId] ?? 0;
        const cost = 1000 + 2000 * trainingCount;
        if (state.coins < cost) return {};
        const newIvs = { ...pokemon.ivs, [stat]: Math.min(31, currentIv + 1) };
        const newStats = BattleEngine.calculateStats(pokemon.level, pokemon.baseStats, newIvs, pokemon.evs, pokemon.nature);
        const hpDiff = newStats.hp - pokemon.stats.hp;
        const newCurrentHp = Math.min(newStats.hp, Math.max(0, pokemon.currentHp + hpDiff));
        const updatedPokemon = { ...pokemon, ivs: newIvs, stats: newStats, currentHp: newCurrentHp };
        return {
          team: state.team.map((p) => (p.id === pokemonId ? updatedPokemon : p)),
          box: state.box.map((p) => (p.id === pokemonId ? updatedPokemon : p)),
          coins: state.coins - cost,
          dojoTrainingCount: { ...state.dojoTrainingCount, [pokemonId]: trainingCount + 1 },
        };
      }

      if (category === 'ev') {
        const totalEvs = Object.values(pokemon.evs).reduce((sum, value) => sum + value, 0);
        const addAmount = Math.max(1, Math.min(Math.floor(amount), 510 - totalEvs));
        if (addAmount <= 0) return {};
        const cost = 500 * addAmount;
        if (state.coins < cost) return {};
        const newEvs = { ...pokemon.evs, [stat]: pokemon.evs[stat] + addAmount };
        const newStats = BattleEngine.calculateStats(pokemon.level, pokemon.baseStats, pokemon.ivs, newEvs, pokemon.nature);
        const hpDiff = newStats.hp - pokemon.stats.hp;
        const newCurrentHp = Math.min(newStats.hp, Math.max(0, pokemon.currentHp + hpDiff));
        const updatedPokemon = { ...pokemon, evs: newEvs, stats: newStats, currentHp: newCurrentHp };
        return {
          team: state.team.map((p) => (p.id === pokemonId ? updatedPokemon : p)),
          box: state.box.map((p) => (p.id === pokemonId ? updatedPokemon : p)),
          coins: state.coins - cost,
        };
      }

      return {};
    }),
  releasePokemon: (id) =>
    set((state) => {
      const pkmn = [...state.team, ...state.box].find((p) => p.id === id);
      if (!pkmn) return {};
      const candyKey = `candy_${pkmn.baseSpeciesId ?? pkmn.pokemonId}`;
      return {
        team: state.team.filter((p) => p.id !== id),
        box: state.box.filter((p) => p.id !== id),
        inventory: {
          ...state.inventory,
          [candyKey]: (state.inventory[candyKey] || 0) + 1,
        },
        stats: { ...state.stats, pokemonReleased: state.stats.pokemonReleased + 1 },
      };
    }),
  replaceMove: (pokemonId, oldMoveId, newMove) =>
    set((state) => {
      const updatePkmn = (p: (typeof state.team)[number]) => {
        if (p.id !== pokemonId) return p;
        const moves = [...p.moves];
        const index = moves.findIndex((m) => m.id === oldMoveId);
        if (index !== -1) {
          moves[index] = newMove;
        } else if (moves.length < 4) {
          moves.push(newMove);
        }
        return { ...p, moves };
      };
      return {
        team: state.team.map(updatePkmn),
        box: state.box.map(updatePkmn),
        pendingNewMoveQueue: (state.pendingNewMoveQueue ?? []).slice(1),
      };
    }),
});
