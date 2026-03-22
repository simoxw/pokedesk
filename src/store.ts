import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Pokemon, ScreenName, Medal, Item, Move, DailyMission } from './types';
import { api } from './api';
import { BattleEngine } from './BattleEngine';

interface GameStore extends GameState {
  setScreen: (screen: ScreenName) => void;
  setFriendBattleTeam: (team: any[]) => void;
  clearFriendBattleTeam: () => void;
  setPlayer: (name: string, gender: 'M' | 'F') => void;
  updatePlayer: (updates: Partial<GameState['player']>) => void;
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
  consumeSafariCharge: () => void;
  addSafariCharge: (amount: number) => void;
  updatePokedex: (pokemonId: number, status: 'seen' | 'caught') => void;
  incrementStat: (key: keyof GameState['stats']) => void;
  updatePlayTime: (seconds: number) => void;
  gainExp: (pokemonId: string, amount: number) => void;
  resetGame: () => void;
  confirmEvolution: () => void;
  dismissEvolution: () => void;
  dismissNewMove: () => void;
  dismissMedalUnlock: () => void;
  replaceMove: (pokemonId: string, oldMoveId: string, newMove: Move) => void;
  updateSettings: (settings: Partial<GameState['settings']>) => void;
  toggleFavorite: (id: string) => void;
  recordBattleWin: () => void;
  toggleExpShare: () => void;
  checkDailyMissions: () => void;
  claimMission: (id: string) => void;
  startLeagueRun: (regionId: string) => void;
  advanceLeagueTrainer: (trainerIndex: number) => void;
  completeLeagueRegion: (regionId: string, trophyLabel: string) => void;
  abandonLeagueRun: () => void;
}

const MISSION_POOL = [
  { type: 'catch' as const, target: 2, description: 'Cattura 2 Pokémon', reward: { coins: 250 } },
  { type: 'catch' as const, target: 5, description: 'Cattura 5 Pokémon', reward: { coins: 500, items: { pokeball: 3 } } },
  { type: 'catch' as const, target: 3, description: 'Cattura 3 Pokémon', reward: { coins: 300, items: { potion: 2 } } },
  { type: 'catch' as const, target: 1, description: 'Cattura 1 Pokémon', reward: { coins: 150 } },
  { type: 'battleWin' as const, target: 3, description: 'Vinci 3 battaglie', reward: { coins: 350 } },
  { type: 'battleWin' as const, target: 5, description: 'Vinci 5 battaglie', reward: { coins: 600, items: { superpotion: 1 } } },
  { type: 'battleWin' as const, target: 1, description: 'Vinci 1 battaglia', reward: { coins: 150 } },
  { type: 'battleWin' as const, target: 10, description: 'Vinci 10 battaglie', reward: { coins: 900, items: { megaball: 2 } } },
  { type: 'defeatGym' as const, target: 1, description: 'Sconfiggi un Capopalestra', reward: { coins: 1000, items: { rare_candy: 1 } } },
  { type: 'useItem' as const, target: 1, description: 'Usa una pozione', reward: { coins: 100 } },
  { type: 'useItem' as const, target: 3, description: 'Usa 3 oggetti curativi', reward: { coins: 250, items: { potion: 1 } } },
  { type: 'useItem' as const, target: 5, description: 'Usa 5 oggetti curativi', reward: { coins: 400, items: { superpotion: 1 } } },
  { type: 'catchShiny' as const, target: 1, description: 'Cattura uno Shiny ✨', reward: { coins: 2000, items: { rare_candy: 2 } } },
  { type: 'catch' as const, target: 10, description: 'Cattura 10 Pokémon', reward: { coins: 800, items: { ultraball: 1 } } },
];

function generateDailyMissions(): { date: string; missions: DailyMission[] } {
  const today = new Date().toISOString().split('T')[0];
  const shuffled = [...MISSION_POOL].sort(() => Math.random() - 0.5);
  return {
    date: today,
    missions: shuffled.slice(0, 3).map((m, i) => ({
      ...m,
      id: `mission_${i}`,
      current: 0,
      completed: false,
      claimed: false,
    }))
  };
}

function updateMissionProgress(
  state: GameState,
  type: DailyMission['type']
): Partial<GameState> {
  if (!state.dailyMissions) return {};
  const today = new Date().toISOString().split('T')[0];
  if (state.dailyMissions.date !== today) return {};
  const updated = state.dailyMissions.missions.map(m => {
    if (m.type === type && !m.completed) {
      const newCurrent = m.current + 1;
      return { ...m, current: newCurrent, completed: newCurrent >= m.target };
    }
    return m;
  });
  return { dailyMissions: { ...state.dailyMissions, missions: updated } };
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
      inventory: { 'pokeball': 10, 'potion': 5, 'full_heal': 2 },
      coins: 500,
      medals: INITIAL_MEDALS,
      currentBattlePath: { battlesWon: 0, nextIsBoss: false },
      charges: 6,
      lastTickTimestamp: Date.now(),
      safariCharges: 0,
      lastSafariTickTimestamp: Date.now(),
      pokedex: {},
      stats: { totalCaught: 0, totalBattles: 0, shiniesFound: 0, pokemonReleased: 0 },
      settings: { audio: true, notifications: true },
      expShareActive: false,
      pendingMedalUnlock: null,
      pendingEvolution: null,
      pendingNewMove: null,
      favorites: [],
      friendBattleTeam: null,
      isFirstRun: true,
      dailyMissions: null,
      leagueProgress: {
        completedRuns: 0,
        completedRegions: [],
        trophies: [],
        currentRun: null,
      },
      currentScreen: 'START_SCREEN',

      setScreen: (screen) => set({ currentScreen: screen }),
      setPlayer: (name, gender) => set({ player: { name, gender, createdAt: Date.now(), playTime: 0 }, isFirstRun: false }),
      updatePlayer: (updates) => set((state) => ({ player: { ...state.player, ...updates } })),
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
        const pkmn = [...state.team, ...state.box].find(p => p.id === id);
        if (!pkmn) return {};
        const candyKey = `candy_${pkmn.baseSpeciesId ?? pkmn.pokemonId}`;
        const currentAmount = state.inventory[candyKey] || 0;
        return {
          team: state.team.filter(p => p.id !== id),
          box: state.box.filter(p => p.id !== id),
          inventory: { ...state.inventory, [candyKey]: currentAmount + 1 },
          stats: { ...state.stats, pokemonReleased: state.stats.pokemonReleased + 1 }
        };
      }),

      useRareCandy: (id) => set((state) => {
        const CANDY_COST = 1;
        if ((state.inventory['rare_candy'] || 0) < CANDY_COST) return {};
        const applyTo = (list: any[]) => list.map(p => {
          if (p.id !== id || p.level >= 100) return p;
          const newLevel = p.level + 1;
          const newStats = BattleEngine.calculateStats(
            newLevel,
            p.baseStats,
            p.ivs,
            p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            p.nature
          );

          // Evolution and Move learning check (non-blocking)
          (async () => {
            try {
              const pokemonData = await api.getPokemon(p.pokemonId);
              const speciesData = await api.getSpecies(p.pokemonId);
              
              // Moves check
              const learnedMoves = await api.getMovesLearnedAtLevel(pokemonData, newLevel);
              const freshPkmn = useStore.getState().team.find(t => t.id === p.id) ?? useStore.getState().box.find(t => t.id === p.id);
              const currentMoves = freshPkmn?.moves ?? p.moves;
              for (const newMove of learnedMoves) {
                const alreadyHas = currentMoves.some(m => m.id === newMove.id) ?? false;
                if (!alreadyHas) {
                  if (currentMoves.length < 4) {
                    useStore.getState().updatePokemon(p.id, { moves: [...currentMoves, newMove] });
                  } else {
                    set({ pendingNewMove: { pokemonId: p.id, move: newMove } });
                    break; // Only present the first one as pending
                  }
                }
              }

              // Evolution check
              const evolution = await api.getEvolutionTarget(speciesData, newLevel);
              if (evolution && !useStore.getState().pendingEvolution) {
                try {
                  const newPokemonData = await api.getPokemon(evolution.newId);
                  const newTypes = newPokemonData.types.map((t: any) => t.type.name);
                  const newBaseStats = {
                    hp: newPokemonData.stats[0].base_stat,
                    attack: newPokemonData.stats[1].base_stat,
                    defense: newPokemonData.stats[2].base_stat,
                    spAtk: newPokemonData.stats[3].base_stat,
                    spDef: newPokemonData.stats[4].base_stat,
                    speed: newPokemonData.stats[5].base_stat,
                  };
                  set({ pendingEvolution: { pokemonId: p.id, newPokemonId: evolution.newId, newName: evolution.newName, newTypes, newBaseStats } });
                } catch {
                  set({ pendingEvolution: { pokemonId: p.id, newPokemonId: evolution.newId, newName: evolution.newName } });
                }
              }
            } catch (e) {
              console.error("Error checking for evolution/moves:", e);
            }
          })();

          const newCurrentHp = Math.min(newStats.hp, Math.max(0, p.currentHp + (newStats.hp - p.stats.hp)));
          const expForNewLevel = (() => {
            const gr = p.growthRate ?? 'medium';
            if (gr === 'slow') return Math.floor(5 * newLevel ** 3 / 4);
            if (gr === 'medium-slow') return Math.max(0, Math.floor(6/5 * newLevel**3 - 15*newLevel**2 + 100*newLevel - 140));
            if (gr === 'fast') return Math.floor(4 * newLevel ** 3 / 5);
            return Math.floor(newLevel ** 3);
          })();
          const newExp = Math.max(p.exp, expForNewLevel);
          return { ...p, level: newLevel, exp: newExp, stats: newStats, currentHp: newCurrentHp };
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
          const newStats = BattleEngine.calculateStats(
            newLevel,
            p.baseStats,
            p.ivs,
            p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            p.nature
          );

          // Evolution and Move learning check (non-blocking)
          (async () => {
            try {
              const pokemonData = await api.getPokemon(p.pokemonId);
              const speciesData = await api.getSpecies(p.pokemonId);
              
              // Moves check
              const learnedMoves = await api.getMovesLearnedAtLevel(pokemonData, newLevel);
              const freshPkmn = useStore.getState().team.find(t => t.id === p.id) ?? useStore.getState().box.find(t => t.id === p.id);
              const currentMoves = freshPkmn?.moves ?? p.moves;
              for (const newMove of learnedMoves) {
                const alreadyHas = currentMoves.some(m => m.id === newMove.id) ?? false;
                if (!alreadyHas) {
                  if (currentMoves.length < 4) {
                    useStore.getState().updatePokemon(p.id, { moves: [...currentMoves, newMove] });
                  } else {
                    set({ pendingNewMove: { pokemonId: p.id, move: newMove } });
                    break; // Only present the first one as pending
                  }
                }
              }

              // Evolution check
              console.log('[EVO CHECK]', p.pokemonId, p.name, 'livello:', newLevel, 'speciesData.name:', speciesData.name);
              const evolution = await api.getEvolutionTarget(speciesData, newLevel);
              console.log('[EVO RESULT]', evolution);
              if (evolution && !useStore.getState().pendingEvolution) {
                try {
                  const newPokemonData = await api.getPokemon(evolution.newId);
                  const newTypes = newPokemonData.types.map((t: any) => t.type.name);
                  const newBaseStats = {
                    hp: newPokemonData.stats[0].base_stat,
                    attack: newPokemonData.stats[1].base_stat,
                    defense: newPokemonData.stats[2].base_stat,
                    spAtk: newPokemonData.stats[3].base_stat,
                    spDef: newPokemonData.stats[4].base_stat,
                    speed: newPokemonData.stats[5].base_stat,
                  };
                  set({ pendingEvolution: { pokemonId: p.id, newPokemonId: evolution.newId, newName: evolution.newName, newTypes, newBaseStats } });
                } catch {
                  set({ pendingEvolution: { pokemonId: p.id, newPokemonId: evolution.newId, newName: evolution.newName } });
                }
              }
            } catch (e) {
              console.error("Error checking for evolution/moves:", e);
            }
          })();

          const newCurrentHp = Math.min(newStats.hp, Math.max(0, p.currentHp + (newStats.hp - p.stats.hp)));
          const expForNewLevel = (() => {
            const gr = p.growthRate ?? 'medium';
            if (gr === 'slow') return Math.floor(5 * newLevel ** 3 / 4);
            if (gr === 'medium-slow') return Math.max(0, Math.floor(6/5 * newLevel**3 - 15*newLevel**2 + 100*newLevel - 140));
            if (gr === 'fast') return Math.floor(4 * newLevel ** 3 / 5);
            return Math.floor(newLevel ** 3);
          })();
          const newExp = Math.max(p.exp, expForNewLevel);
          return { ...p, level: newLevel, exp: newExp, stats: newStats, currentHp: newCurrentHp };
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
      useItem: (itemId) => set((state) => {
        const isHeal = ['potion', 'superpotion', 'hyperpotion', 'full_heal'].includes(itemId);
        const missionUpdate = isHeal ? updateMissionProgress(state, 'useItem') : {};
        return {
          inventory: { ...state.inventory, [itemId]: Math.max(0, (state.inventory[itemId] || 0) - 1) },
          ...missionUpdate
        };
      }),
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
      consumeSafariCharge: () => set((state) => {
        if (state.safariCharges >= 8) {
          return { safariCharges: 7, lastSafariTickTimestamp: Date.now() };
        }
        return { safariCharges: Math.max(0, state.safariCharges - 1) };
      }),
      addSafariCharge: (amount) => set((state) => ({
        safariCharges: Math.min(8, state.safariCharges + amount)
      })),
      updatePokedex: (id, status) => set((state) => ({
        pokedex: { ...state.pokedex, [id]: status === 'caught' ? 'caught' : (state.pokedex[id] === 'caught' ? 'caught' : 'seen') }
      })),
      incrementStat: (key) => set((state) => {
        const missionUpdate =
          key === 'totalCaught' ? updateMissionProgress(state, 'catch') :
          key === 'shiniesFound' ? updateMissionProgress(state, 'catchShiny') :
          {};
        return {
          stats: { ...state.stats, [key]: state.stats[key] + 1 },
          ...missionUpdate
        };
      }),
      gainExp: (id, amount) => set((state) => {
        const expTable: Record<string, (lvl: number) => number> = {
          'slow': (l) => Math.floor(5 * l ** 3 / 4),
          'medium-slow': (l) => Math.floor((6/5) * Math.pow(l, 3) - 15 * Math.pow(l, 2) + 100 * l - 140),
          'medium': (l) => Math.floor(Math.pow(l, 3)),
          'fast': (l) => Math.floor(4 * Math.pow(l, 3) / 5),
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
            const newStats = BattleEngine.calculateStats(
              newLevel,
              p.baseStats,
              p.ivs,
              p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
              p.nature
            );

            // Evolution and Move learning check (non-blocking)
            (async () => {
              try {
                const pokemonData = await api.getPokemon(p.pokemonId);
                const speciesData = await api.getSpecies(p.pokemonId);
                
                // Moves check for all intermediate levels
                const newMovesToLearn: Move[] = [];
                for (let lvl = p.level + 1; lvl <= newLevel; lvl++) {
                  const learnedMoves = await api.getMovesLearnedAtLevel(pokemonData, lvl);
                  for (const newMove of learnedMoves) {
                    const alreadyHas = p.moves.some(m => m.id === newMove.id);
                    const alreadyInList = newMovesToLearn.some(m => m.id === newMove.id);
                    if (!alreadyHas && !alreadyInList) {
                      newMovesToLearn.push(newMove);
                    }
                  }
                }
                // Process accumulated moves
                for (const move of newMovesToLearn) {
                  const freshPkmn = useStore.getState().team.find(t => t.id === p.id) ?? useStore.getState().box.find(t => t.id === p.id);
                  const currentMoves = freshPkmn?.moves ?? p.moves;
                  if (currentMoves.length < 4) {
                    useStore.getState().updatePokemon(p.id, { moves: [...currentMoves, move] });
                  } else {
                    set({ pendingNewMove: { pokemonId: p.id, move: move } });
                    break; // Only present the first one as pending
                  }
                }

                // Evolution check only for final level
                const evolution = await api.getEvolutionTarget(speciesData, newLevel);
                if (evolution && !useStore.getState().pendingEvolution && !useStore.getState().pendingNewMove) {
                  try {
                    const newPokemonData = await api.getPokemon(evolution.newId);
                    const newTypes = newPokemonData.types.map((t: any) => t.type.name);
                    const newBaseStats = {
                      hp: newPokemonData.stats[0].base_stat,
                      attack: newPokemonData.stats[1].base_stat,
                      defense: newPokemonData.stats[2].base_stat,
                      spAtk: newPokemonData.stats[3].base_stat,
                      spDef: newPokemonData.stats[4].base_stat,
                      speed: newPokemonData.stats[5].base_stat,
                    };
                    set({ pendingEvolution: { pokemonId: p.id, newPokemonId: evolution.newId, newName: evolution.newName, newTypes, newBaseStats } });
                  } catch {
                    set({ pendingEvolution: { pokemonId: p.id, newPokemonId: evolution.newId, newName: evolution.newName } });
                  }
                }
              } catch (e) {
                console.error("Error checking for evolution/moves:", e);
              }
            })();

            const newCurrentHp = Math.min(newStats.hp, Math.max(0, p.currentHp + (newStats.hp - p.stats.hp)));
            return { ...p, level: newLevel, exp: remainingExp, stats: newStats, currentHp: newCurrentHp };
          }
          return { ...p, exp: remainingExp };
        });
        return {
          team: updateTeamOrBox(state.team),
          box: updateTeamOrBox(state.box),
        };
      }),
      updatePlayTime: (seconds) => set((state) => ({ player: { ...state.player, playTime: state.player.playTime + seconds } })),
      confirmEvolution: () => set((state) => { 
        const { pendingEvolution } = state; 
        if (!pendingEvolution) return {}; 
        const { pokemonId, newPokemonId, newName, newTypes, newBaseStats } = pendingEvolution; 
        const updatePkmn = (p: Pokemon) => { 
          if (p.id !== pokemonId) return p; 
          const types = newTypes ?? p.types; 
          const baseStats = newBaseStats ?? p.baseStats; 
          const newStats =  newBaseStats 
            ? BattleEngine.calculateStats(p.level, baseStats, p.ivs, p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, p.nature) 
            : p.stats; 
          const hpGain = newBaseStats ? Math.max(0, newStats.hp - p.stats.hp) : 0; 
          return { ...p, pokemonId: newPokemonId, name: newName, types, baseStats, stats: newStats, currentHp: Math.min(newStats.hp, p.currentHp + hpGain) }; 
        }; 
        return { 
          team: state.team.map(updatePkmn), 
          box: state.box.map(updatePkmn), 
          pendingEvolution: null 
        }; 
      }), 
      dismissEvolution: () => set({ pendingEvolution: null }),
      dismissNewMove: () => set({ pendingNewMove: null }),
      dismissMedalUnlock: () => set({ pendingMedalUnlock: null }),
      replaceMove: (pokemonId, oldMoveId, newMove) => set((state) => {
        const updatePkmn = (p: Pokemon) => {
          if (p.id !== pokemonId) return p;
          const moves = [...p.moves];
          const index = moves.findIndex(m => m.id === oldMoveId);
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
          pendingNewMove: null
        };
      }),
      updateSettings: (updates) => set((state) => ({ settings: { ...state.settings, ...updates } })),
      setFriendBattleTeam: (team) => set({ friendBattleTeam: team }),
      clearFriendBattleTeam: () => set({ friendBattleTeam: null }),
      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter(f => f !== id)
          : [...state.favorites, id]
      })),
      toggleExpShare: () => set((state) => ({ expShareActive: !state.expShareActive })),
      checkDailyMissions: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        if (state.dailyMissions?.date === today) return {};
        return { dailyMissions: generateDailyMissions() };
      }),
      claimMission: (id) => set((state) => {
        if (!state.dailyMissions) return {};
        const mission = state.dailyMissions.missions.find(m => m.id === id);
        if (!mission || !mission.completed || mission.claimed) return {};
        const { coins = 0, items = {} } = mission.reward;
        const newInventory = { ...state.inventory };
        for (const [itemId, amount] of Object.entries(items)) {
          newInventory[itemId] = (newInventory[itemId] || 0) + amount;
        }
        return {
          coins: state.coins + coins,
          inventory: newInventory,
          dailyMissions: {
            ...state.dailyMissions,
            missions: state.dailyMissions.missions.map(m =>
              m.id === id ? { ...m, claimed: true } : m
            )
          }
        };
      }),
      startLeagueRun: (regionId: string) => set((state) => ({
        leagueProgress: {
          ...state.leagueProgress,
          currentRun: { regionId, trainerIndex: 0, defeatedTrainers: [] },
        }
      })),
      advanceLeagueTrainer: (trainerIndex: number) => set((state) => {
        if (!state.leagueProgress.currentRun) return {};
        return {
          leagueProgress: {
            ...state.leagueProgress,
            currentRun: {
              ...state.leagueProgress.currentRun,
              trainerIndex: trainerIndex + 1,
              defeatedTrainers: [...state.leagueProgress.currentRun.defeatedTrainers, trainerIndex],
            }
          }
        };
      }),
      completeLeagueRegion: (regionId: string, trophyLabel: string) => set((state) => {
        const alreadyCompleted = state.leagueProgress.completedRegions.includes(regionId);
        const allRegions = ['kanto','johto','hoenn','sinnoh','unova','kalos','alola','galar'];
        const newCompleted = alreadyCompleted
          ? state.leagueProgress.completedRegions
          : [...state.leagueProgress.completedRegions, regionId];
        const allDone = allRegions.every(r => newCompleted.includes(r));
        return {
          leagueProgress: {
            ...state.leagueProgress,
            completedRegions: newCompleted,
            trophies: alreadyCompleted
              ? state.leagueProgress.trophies
              : [...state.leagueProgress.trophies, trophyLabel],
            completedRuns: allDone
              ? state.leagueProgress.completedRuns + 1
              : state.leagueProgress.completedRuns,
            currentRun: null,
          }
        };
      }),
      abandonLeagueRun: () => set((state) => ({
        leagueProgress: { ...state.leagueProgress, currentRun: null }
      })),
      recordBattleWin: () => set((state) => {
        let { battlesWon, nextIsBoss } = state.currentBattlePath;
        if (!nextIsBoss) {
          battlesWon += 1;
          if (battlesWon % 15 === 0) {
            nextIsBoss = true;
          }
          return { currentBattlePath: { battlesWon, nextIsBoss }, ...updateMissionProgress(state, 'battleWin') };
        } else {
          const nextMedal = state.medals.find(m => !m.isUnlocked);
          let newMedals = state.medals;
          if (nextMedal) {
            newMedals = state.medals.map(m => m.id === nextMedal.id ? { ...m, isUnlocked: true } : m);
          }
          return {
            currentBattlePath: { battlesWon: 0, nextIsBoss: false },
            medals: newMedals,
            pendingMedalUnlock: nextMedal ? { ...nextMedal, isUnlocked: true } : null,
            ...updateMissionProgress(state, 'defeatGym'),
          };
        }
      }),
      resetGame: () => set({
        player: { name: '', gender: 'M', createdAt: Date.now(), playTime: 0 },
        team: [],
        box: [],
        inventory: { 'pokeball': 10, 'potion': 5, 'full_heal': 2 },
        coins: 500,
        medals: INITIAL_MEDALS,
        currentBattlePath: { battlesWon: 0, nextIsBoss: false },
        charges: 6,
        lastTickTimestamp: Date.now(),
        safariCharges: 0,
        lastSafariTickTimestamp: Date.now(),
        pokedex: {},
        stats: { totalCaught: 0, totalBattles: 0, shiniesFound: 0, pokemonReleased: 0 },
        isFirstRun: true,
        dailyMissions: null,
        leagueProgress: {
          completedRuns: 0,
          completedRegions: [],
          trophies: [],
          currentRun: null,
        },
        currentScreen: 'START_SCREEN',
        settings: { audio: true, notifications: true },
        expShareActive: false,
        pendingEvolution: null,
        pendingNewMove: null,
        favorites: [],
        friendBattleTeam: null,
      }),
    }),
    {
      name: 'pokedesk-save',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const clampHp = (p: any) => ({
          ...p,
          currentHp: Math.min(p.stats?.hp ?? p.currentHp, Math.max(0, p.currentHp))
        });
        state.team = state.team.map(clampHp);
        state.box = state.box.map(clampHp);
        state.pendingEvolution = null;
        state.pendingNewMove = null;
      }
    }
  )
);
