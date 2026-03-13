import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Pokemon, ScreenName, Medal, Item } from './types';

interface GameStore extends GameState {
  setScreen: (screen: ScreenName) => void;
  setPlayer: (name: string, gender: 'M' | 'F') => void;
  addPokemon: (pokemon: Pokemon) => void;
  updatePokemon: (id: string, updates: Partial<Pokemon>) => void;
  releasePokemon: (id: string) => void;
  addToTeam: (pokemon: Pokemon, index: number) => void;
  removeFromTeam: (index: number) => void;
  addCoins: (amount: number) => void;
  addItem: (itemId: string, amount: number) => void;
  useItem: (itemId: string) => void;
  unlockMedal: (id: number) => void;
  addCharge: (amount: number) => void;
  consumeCharge: () => void;
  updatePokedex: (pokemonId: number, status: 'seen' | 'caught') => void;
  incrementStat: (key: keyof GameState['stats']) => void;
  updatePlayTime: (seconds: number) => void;
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
      releasePokemon: (id) => set((state) => ({
        box: state.box.filter(p => p.id !== id),
        stats: { ...state.stats, pokemonReleased: state.stats.pokemonReleased + 1 }
      })),
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
      consumeCharge: () => set((state) => ({ charges: Math.max(0, state.charges - 1) })),
      updatePokedex: (id, status) => set((state) => ({
        pokedex: { ...state.pokedex, [id]: status === 'caught' ? 'caught' : (state.pokedex[id] === 'caught' ? 'caught' : 'seen') }
      })),
      incrementStat: (key) => set((state) => ({ stats: { ...state.stats, [key]: state.stats[key] + 1 } })),
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
        currentScreen: 'START_SCREEN'
      }),
    }),
    {
      name: 'pokedesk-save',
    }
  )
);
