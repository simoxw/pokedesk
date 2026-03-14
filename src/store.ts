import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Pokemon, ScreenName, Medal, Item } from './types';

interface GameStore extends GameState {
  setScreen: (screen: ScreenName) => void;
  setPlayer: (name: string, gender: 'M' | 'F') => void;
  addPokemon: (pokemon: Pokemon) => void;
  updatePokemon: (id: string, updates: Partial<Pokemon>) => void;
  releasePokemon: (id: string) => void;
  useRareCandy: (pokemonId: string) => void;
  useSpeciesCandy: (pokemonId: string, speciesId: number) => void;
  addToTeam: (pokemon: Pokemon, index: number) => void;
  removeFromTeam: (index: number) => void;
  reorderTeam: (oldIndex: number, newIndex: number) => void;
  addCoins: (amount: number) => void;
  addItem: (itemId: string, amount: number) => void;
  useItem: (itemId: string) => void;
  unlockMedal: (id: number) => void;
  addCharge: (amount: number) => void;
  consumeCharge: () => void;
  updatePokedex: (pokemonId: number, status: 'seen' | 'caught') => void;
  incrementStat: (key: keyof GameState['stats']) => void;
  updatePlayTime: (seconds: number) => void;
  gainExp: (pokemonId: string, amount: number) => void;
  resetGame: () => void;
}

const INITIAL_MEDALS: Medal[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  name: `Capopalestra ${i + 1}`,
  type: 'normal', // Will be randomized or set later
  isUnlocked: false,
}));

export const useStore = create<GameStore>()(
  persist(
    (set) => ({
      player: { name: '', gender: 'M', createdAt: Date.now(), playTime: 0 },
      team: [],
      box: [],
      inventory: { 'pokeball': 10, 'potion': 5, 'antidote': 2 },
      coins: 500,
      medals: INITIAL_MEDALS,
      currentBattlePath: { battlesWon: 0, nextIsBoss: false },
      charges: 6,
      lastTickTimestamp: Date.now(),
      pokedex: {},
      stats: { totalCaught: 0, totalBattles: 0, shiniesFound: 0, pokemonReleased: 0 },
      settings: { audio: true, notifications: true },
      isFirstRun: true,
      currentScreen: 'START_SCREEN',

      setScreen: (screen) => set({ currentScreen: screen }),
      setPlayer: (name, gender) => set({ player: { name, gender, createdAt: Date.now(), playTime: 0 }, isFirstRun: false }),
      addPokemon: (pokemon) => set((state) => {
        if (state.team.length < 4) {
          return { team: [...state.team, pokemon], pokedex: { ...state.pokedex, [pokemon.pokemonId]: 'caught' } };
        }
        return { box: [...state.box, pokemon], pokedex: { ...state.pokedex, [pokemon.pokemonId]: 'caught' } };
      }),
      updatePokemon: (id, updates) => set((state) => ({
        team: state.team.map(p => p.id === id ? { ...p, ...updates } : p),
        box: state.box.map(p => p.id === id ? { ...p, ...updates } : p),
      })),
      releasePokemon: (id) => set((state) => {
        const pkmn = state.box.find(p => p.id === id);
        if (!pkmn) return {};
        const candyKey = `candy_${pkmn.pokemonId}`;
        return {
          box: state.box.filter(p => p.id !== id),
          inventory: { ...state.inventory, [candyKey]: (state.inventory[candyKey] || 0) + 1 },
          stats: { ...state.stats, pokemonReleased: state.stats.pokemonReleased + 1 }
        };
      }),

      useRareCandy: (id) => set((state) => {
        const CANDY_COST = 1;
        if ((state.inventory['rare_candy'] || 0) < CANDY_COST) return {};
        const applyTo = (list: any[]) => list.map(p => {
          if (p.id !== id || p.level >= 100) return p;
          const newLevel = p.level + 1;
          const newStats = {
            hp: Math.floor(((2 * p.baseStats.hp + p.ivs.hp) * newLevel) / 100) + newLevel + 10,
            attack: Math.floor(((2 * p.baseStats.attack + p.ivs.attack) * newLevel) / 100) + 5,
            defense: Math.floor(((2 * p.baseStats.defense + p.ivs.defense) * newLevel) / 100) + 5,
            spAtk: Math.floor(((2 * p.baseStats.spAtk + p.ivs.spAtk) * newLevel) / 100) + 5,
            spDef: Math.floor(((2 * p.baseStats.spDef + p.ivs.spDef) * newLevel) / 100) + 5,
            speed: Math.floor(((2 * p.baseStats.speed + p.ivs.speed) * newLevel) / 100) + 5,
          };
          return { ...p, level: newLevel, stats: newStats, currentHp: p.currentHp + (newStats.hp - p.stats.hp) };
        });
        return {
          team: applyTo(state.team),
          box: applyTo(state.box),
          inventory: { ...state.inventory, rare_candy: state.inventory['rare_candy'] - CANDY_COST }
        };
      }),

      useSpeciesCandy: (id, speciesId) => set((state) => {
        const CANDY_COST = 3;
        const candyKey = `candy_${speciesId}`;
        if ((state.inventory[candyKey] || 0) < CANDY_COST) return {};
        const applyTo = (list: any[]) => list.map(p => {
          if (p.id !== id || (p.pokemonId !== speciesId && p.baseSpeciesId !== speciesId) || p.level >= 100) return p;
          const newLevel = p.level + 1;
          const newStats = {
            hp: Math.floor(((2 * p.baseStats.hp + p.ivs.hp) * newLevel) / 100) + newLevel + 10,
            attack: Math.floor(((2 * p.baseStats.attack + p.ivs.attack) * newLevel) / 100) + 5,
            defense: Math.floor(((2 * p.baseStats.defense + p.ivs.defense) * newLevel) / 100) + 5,
            spAtk: Math.floor(((2 * p.baseStats.spAtk + p.ivs.spAtk) * newLevel) / 100) + 5,
            spDef: Math.floor(((2 * p.baseStats.spDef + p.ivs.spDef) * newLevel) / 100) + 5,
            speed: Math.floor(((2 * p.baseStats.speed + p.ivs.speed) * newLevel) / 100) + 5,
          };
          return { ...p, level: newLevel, stats: newStats, currentHp: p.currentHp + (newStats.hp - p.stats.hp) };
        });
        return {
          team: applyTo(state.team),
          box: applyTo(state.box),
          inventory: { ...state.inventory, [candyKey]: state.inventory[candyKey] - CANDY_COST }
        };
      }),
      addToTeam: (pokemon, index) => set((state) => {
        const newTeam = [...state.team];
        const newBox = state.box.filter(p => p.id !== pokemon.id);
        if (newTeam[index]) newBox.push(newTeam[index]);
        newTeam[index] = pokemon;
        return { team: newTeam, box: newBox };
      }),
      removeFromTeam: (index) => set((state) => {
        const newTeam = [...state.team];
        const removed = newTeam.splice(index, 1)[0];
        return { team: newTeam, box: [...state.box, removed] };
      }),
      reorderTeam: (oldIndex, newIndex) => set((state) => {
        const newTeam = [...state.team];
        const [moved] = newTeam.splice(oldIndex, 1);
        newTeam.splice(newIndex, 0, moved);
        return { team: newTeam };
      }),
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      addItem: (itemId, amount) => set((state) => ({
        inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] || 0) + amount }
      })),
      useItem: (itemId) => set((state) => ({
        inventory: { ...state.inventory, [itemId]: Math.max(0, (state.inventory[itemId] || 0) - 1) }
      })),
      unlockMedal: (id) => set((state) => ({
        medals: state.medals.map(m => m.id === id ? { ...m, isUnlocked: true } : m)
      })),
      addCharge: (amount) => set((state) => ({ charges: Math.min(6, state.charges + amount) })),
      consumeCharge: () => set((state) => {
        if (state.charges >= 6) {
          return { charges: 5, lastTickTimestamp: Date.now() };
        }
        return { charges: Math.max(0, state.charges - 1) };
      }),
      updatePokedex: (id, status) => set((state) => ({
        pokedex: { ...state.pokedex, [id]: status === 'caught' ? 'caught' : (state.pokedex[id] === 'caught' ? 'caught' : 'seen') }
      })),
      incrementStat: (key) => set((state) => ({ stats: { ...state.stats, [key]: state.stats[key] + 1 } })),
      gainExp: (id, amount) => set((state) => {
        const expTable: Record<string, (lvl: number) => number> = {
          'slow': (l) => Math.floor(5 * l ** 3 / 4),
          'medium-slow': (l) => l < 2 ? 0 : Math.max(0, Math.floor(6/5 * l**3 - 15*l**2 + 100*l - 140)),
          'medium': (l) => Math.floor(l ** 3),
          'fast': (l) => Math.floor(4 * l ** 3 / 5),
        };
        const updateTeamOrBox = (list: any[]) => list.map(p => {
          if (p.id !== id) return p;
          if (p.level >= 100) return p;
          const newExp = p.exp + amount;
          const getExpNeeded = expTable[p.growthRate] ?? expTable['medium'];
          let newLevel = p.level;
          let remainingExp = newExp;
          while (newLevel < 100 && remainingExp >= getExpNeeded(newLevel + 1)) {
            newLevel++;
          }
          if (newLevel > p.level) {
            // Ricalcola stats al nuovo livello 
            const newStats = {
              hp: Math.floor(((2 * p.baseStats.hp + p.ivs.hp) * newLevel) / 100) + newLevel + 10,
              attack: Math.floor(((2 * p.baseStats.attack + p.ivs.attack) * newLevel) / 100) + 5,
              defense: Math.floor(((2 * p.baseStats.defense + p.ivs.defense) * newLevel) / 100) + 5,
              spAtk: Math.floor(((2 * p.baseStats.spAtk + p.ivs.spAtk) * newLevel) / 100) + 5,
              spDef: Math.floor(((2 * p.baseStats.spDef + p.ivs.spDef) * newLevel) / 100) + 5,
              speed: Math.floor(((2 * p.baseStats.speed + p.ivs.speed) * newLevel) / 100) + 5,
            };
            return { ...p, level: newLevel, exp: remainingExp, stats: newStats, currentHp: p.currentHp + (newStats.hp - p.stats.hp) };
          }
          return { ...p, exp: remainingExp };
        });
        return {
          team: updateTeamOrBox(state.team),
          box: updateTeamOrBox(state.box),
        };
      }),
      updatePlayTime: (seconds) => set((state) => ({ player: { ...state.player, playTime: state.player.playTime + seconds } })),
      resetGame: () => set({
        player: { name: '', gender: 'M', createdAt: Date.now(), playTime: 0 },
        team: [],
        box: [],
        inventory: { 'pokeball': 10, 'potion': 5, 'antidote': 2 },
        coins: 500,
        medals: INITIAL_MEDALS,
        currentBattlePath: { battlesWon: 0, nextIsBoss: false },
        charges: 6,
        lastTickTimestamp: Date.now(),
        pokedex: {},
        stats: { totalCaught: 0, totalBattles: 0, shiniesFound: 0, pokemonReleased: 0 },
        isFirstRun: true,
        currentScreen: 'START_SCREEN',
        settings: { audio: true, notifications: true }
      }),
    }),
    {
      name: 'pokedesk-save',
    }
  )
);
