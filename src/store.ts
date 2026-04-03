import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Pokemon, ScreenName, Medal, Item, Move, DailyMission, Egg } from './types';
import { api } from './api';
import { BattleEngine } from './BattleEngine';
import { CatchEngine } from './CatchEngine';

interface GameStore extends GameState {
  setScreen: (screen: ScreenName) => void;
  setFriendBattleTeam: (team: any[]) => void;
  clearFriendBattleTeam: () => void;
  setLeagueBattleTeam: (team: any[]) => void;
  clearLeagueBattleTeam: () => void;
  setLeagueBattleResult: (result: 'win' | 'lose' | null) => void;
  setMasterBattleTeam: (team: any[]) => void;
  clearMasterBattleTeam: () => void;
  setMasterBattleResult: (result: 'win' | 'lose' | null) => void;
  recordMasterWin: (trainerId: string) => void;
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
  startIncubation: (p1: Pokemon, p2: Pokemon) => void;
  hatchEgg: (eggId: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  recordBattleWin: () => void;
  toggleExpShare: () => void;
  checkDailyMissions: () => void;
  claimMission: (id: string) => void;
  startLeagueRun: (regionId: string) => void;
  advanceLeagueTrainer: (trainerIndex: number) => void;
  completeLeagueRegion: (regionId: string, trophyLabel: string) => void;
  abandonLeagueRun: () => void;
  incrementLeagueMission: () => void;
  incrementMasterMission: () => void;
  setIslandLastCatch: (date: string) => void;
  dismissMissionToast: () => void;
  removePokemon: (id: string) => void;
  claimStreak: () => void;
  claimPokedexReward: (genId: string) => void;
}

type MissionTemplate = {
  type: 'catch' | 'battleWin' | 'defeatGym' | 'useItem' | 'catchShiny' | 'defeatLeague' | 'defeatMaster';
  target: number;
  description: string;
  reward: { coins?: number; items?: Record<string, number> };
};

const MISSION_POOL: MissionTemplate[] = [
  { type: 'catch', target: 2, description: 'Cattura 2 Pokémon', reward: { coins: 250 } },
  { type: 'catch', target: 5, description: 'Cattura 5 Pokémon', reward: { coins: 500, items: { pokeball: 3 } } },
  { type: 'catch', target: 3, description: 'Cattura 3 Pokémon', reward: { coins: 300, items: { potion: 2 } } },
  { type: 'catch', target: 1, description: 'Cattura 1 Pokémon', reward: { coins: 150 } },
  { type: 'battleWin', target: 3, description: 'Vinci 3 battaglie', reward: { coins: 350 } },
  { type: 'battleWin', target: 5, description: 'Vinci 5 battaglie', reward: { coins: 600, items: { superpotion: 1 } } },
  { type: 'battleWin', target: 1, description: 'Vinci 1 battaglia', reward: { coins: 150 } },
  { type: 'battleWin', target: 10, description: 'Vinci 10 battaglie', reward: { coins: 900, items: { megaball: 2 } } },
  { type: 'defeatGym', target: 1, description: 'Sconfiggi un Capopalestra', reward: { coins: 1000, items: { rare_candy: 1 } } },
  { type: 'useItem', target: 1, description: 'Usa una pozione', reward: { coins: 100 } },
  { type: 'useItem', target: 3, description: 'Usa 3 oggetti curativi', reward: { coins: 250, items: { potion: 1 } } },
  { type: 'useItem', target: 5, description: 'Usa 5 oggetti curativi', reward: { coins: 400, items: { superpotion: 1 } } },
  { type: 'catchShiny', target: 1, description: 'Cattura uno Shiny ✨', reward: { coins: 2000, items: { rare_candy: 2 } } },
  { type: 'catch', target: 10, description: 'Cattura 10 Pokémon', reward: { coins: 800, items: { ultraball: 1 } } },
  { type: 'defeatLeague', target: 1, description: 'Sconfiggi un membro della Lega', reward: { coins: 1500, items: { rare_candy: 1 } } },
  { type: 'defeatLeague', target: 3, description: 'Sconfiggi 3 membri della Lega', reward: { coins: 3000, items: { rare_candy: 2, ultraball: 2 } } },
  { type: 'defeatMaster', target: 1, description: 'Sconfiggi un Master Trainer', reward: { coins: 2500, items: { rare_candy: 2, masterball: 1 } } },
];

function generateDailyMissions(state: GameState | undefined): { date: string; missions: DailyMission[] } {
  const today = new Date().toISOString().split('T')[0];
  if (!state) {
    return {
      date: today,
      missions: MISSION_POOL.slice(0, 3).map((m, i) => ({
        ...m,
        id: `mission_${i}`,
        current: 0,
        completed: false,
        claimed: false,
      }))
    };
  }

  const medalsCount = (state.medals ?? []).filter(m => m.isUnlocked).length;
  
  let pool = [...MISSION_POOL];
  
  // Escludi missioni Lega se non sbloccata
  if (medalsCount < 40) {
    pool = pool.filter(m => m.type !== 'defeatLeague' && m.type !== 'defeatMaster');
  }
  // Escludi Master se non completata almeno una run
  if ((state.leagueProgress?.completedRuns ?? 0) < 1) {
    pool = pool.filter(m => m.type !== 'defeatMaster');
  }
  
  const shuffled = pool.sort(() => Math.random() - 0.5);
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
  const justCompleted = updated.find((m, i) => m.completed && !state.dailyMissions!.missions[i].completed);
  return {
    dailyMissions: { ...state.dailyMissions, missions: updated },
    ...(justCompleted ? { pendingMissionToast: justCompleted.description } : {}),
  };
}

const STREAK_REWARDS = [
  { coins: 50, item: 'pokeball', qty: 3 },
  { coins: 50, item: 'potion', qty: 3 },
  { coins: 200, item: 'superpotion', qty: 1 },
  { coins: 300, item: 'hyperpotion', qty: 1 },
  { coins: 500, item: 'rare_candy', qty: 1 },
  { coins: 750, item: 'rare_candy', qty: 1 },
  { coins: 1000, item: 'ultraball', qty: 2 },
];

const INITIAL_MEDALS: Medal[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  name: `Capopalestra ${i + 1}`,
  type: 'normal',
  isUnlocked: false,
}));

export const useStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // initial state
      player: { name: '', gender: 'M' as const, createdAt: Date.now(), playTime: 0 },
      team: [],
      box: [],
      inventory: {},
      coins: 0,
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
      leagueProgress: { currentRun: null, completedRegions: [], trophies: [], completedRuns: 0 },
      masterProgress: { defeatedIds: [] },
      claimedPokedexRewards: [],
      currentScreen: 'START_SCREEN' as ScreenName,
      lastStreakDate: null,
      islandLastCatch: null,
      pendingEvolution: null,
      pendingNewMoveQueue: [],
      eggs: [],
      favorites: [],
      friendBattleTeam: null,
      leagueBattleTeam: null,
      leagueBattleResult: null,
      masterBattleTeam: null,
      masterBattleResult: null,
      isFirstRun: true,
      dailyMissions: null,
      pendingMissionToast: null,
      streak: 0,
      
      // actions
      setScreen: (screen: ScreenName) => set({ currentScreen: screen }),
      setPlayer: (name: string, gender: 'M' | 'F') => 
        set({ player: { name, gender, createdAt: Date.now(), playTime: 0 }, isFirstRun: false }),
      updatePlayer: (updates: Partial<GameState['player']>) => 
        set((state) => ({ player: { ...state.player, ...updates } })),
      addPokemon: (pokemon: Pokemon) => set((state) => {
        if (state.team.length < 4) {
          return { team: [...state.team, pokemon], pokedex: { ...state.pokedex, [pokemon.pokemonId]: 'caught' } };
        }
        return { box: [...state.box, pokemon], pokedex: { ...state.pokedex, [pokemon.pokemonId]: 'caught' } };
      }),
      updatePokemon: (id: string, updates: Partial<Pokemon>) => set((state) => ({
        team: state.team.map(p => p.id === id ? { ...p, ...updates } : p),
        box: state.box.map(p => p.id === id ? { ...p, ...updates } : p),
      })),
      releasePokemon: (id: string) => set((state) => {
        const pkmn = [...state.team, ...state.box].find(p => p.id === id);
        if (!pkmn) return {};
        const candyKey = `candy_${pkmn.baseSpeciesId ?? pkmn.pokemonId}`;
        return {
          team: state.team.filter(p => p.id !== id),
          box: state.box.filter(p => p.id !== id),
          inventory: {
            ...state.inventory,
            [candyKey]: (state.inventory[candyKey] || 0) + 1,
          },
          stats: { ...state.stats, pokemonReleased: state.stats.pokemonReleased + 1 },
        };
      }),
      useRareCandy: (pokemonId: string) => set((state) => {
        const CANDY_COST = 1;
        if ((state.inventory['rare_candy'] || 0) < CANDY_COST) return {};
        const applyTo = (list: any[]) => list.map(p => {
          if (p.id !== pokemonId || p.level >= 100) return p;
          const newLevel = p.level + 1;
          const newStats = BattleEngine.calculateStats(
            newLevel,
            p.baseStats,
            p.ivs,
            p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            p.nature
          );
          return { ...p, level: newLevel, stats: newStats };
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
              const freshPkmn = useStore.getState().team.find((t: any) => t.id === p.id) ?? useStore.getState().box.find((t: any) => t.id === p.id);
              const currentMoves = freshPkmn?.moves ?? p.moves;
              for (const newMove of learnedMoves) {
                const alreadyHas = currentMoves.some((m: any) => m.id === newMove.id) ?? false;
                if (!alreadyHas) {
                  if (currentMoves.length < 4) {
                    useStore.getState().updatePokemon(p.id, { moves: [...currentMoves, newMove] });
                  } else {
                    set((state) => ({ pendingNewMoveQueue: [...(state.pendingNewMoveQueue ?? []), { pokemonId: p.id, move: newMove }] }));
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
                  const newBaseStats = CatchEngine.getBaseStats(newPokemonData);
                  set((state) => ({
                    pendingEvolution: {
                      pokemonId: p.id,
                      newPokemonId: evolution.newId,
                      newName: newPokemonData.name,
                      newTypes: newPokemonData.types.map((t: any) => t.type.name),
                      newBaseStats,
                    },
                  }));
                } catch (e) {
                  console.error('Failed to load evolution data:', e);
                }
              }
            } catch (e) {
              console.error('Async evolution/move check failed:', e);
            }
          })();

          return { ...p, level: newLevel, stats: newStats };
        });
        return {
          team: applyTo(state.team),
          box: applyTo(state.box),
          inventory: { ...state.inventory, [candyKey]: state.inventory[candyKey] - CANDY_COST }
        };
      }),

      addToTeam: (pokemon: Pokemon, index: number) => set((state) => {
        if (index < 0 || index >= 6) return {};
        const newTeam = [...state.team];
        newTeam[index] = pokemon;
        return { team: newTeam, box: state.box.filter(p => p.id !== pokemon.id) };
      }),
      removeFromTeam: (index: number) => set((state) => {
        if (index < 0 || index >= state.team.length) return {};
        return {
          team: state.team.filter((_, i) => i !== index),
          box: [...state.box, state.team[index]],
        };
      }),
      reorderTeam: (oldIndex: number, newIndex: number) => set((state) => {
        const newTeam = [...state.team];
        const [movedPokemon] = newTeam.splice(oldIndex, 1);
        newTeam.splice(newIndex, 0, movedPokemon);
        return { team: newTeam };
      }),
      addCoins: (amount: number) => set((state) => ({ coins: state.coins + amount })),
      addItem: (itemId: string, amount: number) => set((state) => ({
        inventory: { ...state.inventory, [itemId]: (state.inventory[itemId] || 0) + amount }
      })),
      useItem: (itemId: string) => set((state) => ({
        inventory: { ...state.inventory, [itemId]: Math.max(0, (state.inventory[itemId] || 0) - 1) }
      })),
      unlockMedal: (id: number) => set((state) => ({
        medals: state.medals.map(m => m.id === id ? { ...m, isUnlocked: true } : m)
      })),
      addCharge: (amount: number) => set((state) => ({
        charges: Math.min(10, state.charges + amount),
        lastTickTimestamp: Date.now(),
      })),
      consumeCharge: () => set((state) => ({
        charges: Math.max(0, state.charges - 1),
      })),
      consumeSafariCharge: () => set((state) => ({
        safariCharges: Math.max(0, state.safariCharges - 1),
      })),
      addSafariCharge: (amount: number) => set((state) => ({
        safariCharges: Math.min(30, state.safariCharges + amount),
        lastSafariTickTimestamp: Date.now(),
      })),
      updatePokedex: (pokemonId: number, status: 'seen' | 'caught') => set((state) => {
        const current = state.pokedex[pokemonId];
        if (current === 'caught') return {}; // Don't downgrade caught to seen
        return { pokedex: { ...state.pokedex, [pokemonId]: status } };
      }),
      incrementStat: (key: keyof GameState['stats']) => set((state) => ({
        stats: { ...state.stats, [key]: state.stats[key] + 1 }
      })),
      updatePlayTime: (seconds: number) => set((state) => ({
        player: { ...state.player, playTime: state.player.playTime + seconds }
      })),
      gainExp: (pokemonId: string, amount: number) => set((state) => {
        const pokemon = [...state.team, ...state.box].find(p => p.id === pokemonId);
        if (!pokemon) return {};
        const newExp = pokemon.exp + amount;
        const nextLevelExp = BattleEngine.getExpForNextLevel(pokemon.level, pokemon.growthRate);
        if (newExp >= nextLevelExp) {
          const newLevel = pokemon.level + 1;
          const newStats = BattleEngine.calculateStats(newLevel, pokemon.baseStats, pokemon.ivs, pokemon.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, pokemon.nature);
          const newNextLevelExp = BattleEngine.getExpForNextLevel(newLevel, pokemon.growthRate);
          return {
            team: state.team.map(p => p.id === pokemonId ? { ...p, exp: newExp, level: newLevel, stats: newStats } : p),
            box: state.box.map(p => p.id === pokemonId ? { ...p, exp: newExp, level: newLevel, stats: newStats } : p),
          };
        }
        return {
          team: state.team.map(p => p.id === pokemonId ? { ...p, exp: newExp } : p),
          box: state.box.map(p => p.id === pokemonId ? { ...p, exp: newExp } : p),
        };
      }),
      resetGame: () => set({
        player: { name: '', gender: 'M' as const, createdAt: Date.now(), playTime: 0 },
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
        leagueProgress: { currentRun: null, completedRegions: [], trophies: [], completedRuns: 0 },
        masterProgress: { defeatedIds: [] },
        currentScreen: 'START_SCREEN' as ScreenName,
        favorites: [],
        friendBattleTeam: null,
        leagueBattleTeam: null,
        leagueBattleResult: null,
        masterBattleTeam: null,
        masterBattleResult: null,
        pendingEvolution: null,
        pendingNewMoveQueue: [],
        eggs: [],
        claimedPokedexRewards: [],
        lastStreakDate: null,
        islandLastCatch: null,
        pendingMissionToast: null,
        settings: { audio: true, notifications: true },
        expShareActive: false,
        pendingMedalUnlock: null,
        streak: 0,
      }),
      confirmEvolution: () => set((state) => {
        const pending = state.pendingEvolution;
        if (!pending) return {};
        const updatePkmn = (p: Pokemon) => {
          if (p.id !== pending.pokemonId) return p;
          return {
            ...p,
            pokemonId: pending.newPokemonId,
            name: pending.newName,
            baseStats: pending.newBaseStats!,
            types: pending.newTypes ?? p.types,
          };
        };
        return {
          team: state.team.map(updatePkmn),
          box: state.box.map(updatePkmn),
          pendingEvolution: null,
        };
      }),
      dismissEvolution: () => set({ pendingEvolution: null }),
      dismissNewMove: () => set((state) => ({
        pendingNewMoveQueue: (state.pendingNewMoveQueue ?? []).slice(1)
      })),
      dismissMedalUnlock: () => set({ pendingMedalUnlock: null }),
      replaceMove: (pokemonId: string, oldMoveId: string, newMove: Move) => set((state) => {
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
          pendingNewMoveQueue: (state.pendingNewMoveQueue ?? []).slice(1)
        };
      }),
      updateSettings: (updates: Partial<GameState['settings']>) => set((state) => ({ settings: { ...state.settings, ...updates } })),
      setFriendBattleTeam: (team: any[]) => set({ friendBattleTeam: team }),
      clearFriendBattleTeam: () => set({ friendBattleTeam: null }),
      setLeagueBattleTeam: (team: any[]) => set({ leagueBattleTeam: team }),
      clearLeagueBattleTeam: () => set({ leagueBattleTeam: null }),
      setLeagueBattleResult: (result: 'win' | 'lose' | null) => set({ leagueBattleResult: result }),
      setMasterBattleTeam: (team: any[]) => set({ masterBattleTeam: team }),
      clearMasterBattleTeam: () => set({ masterBattleTeam: null }),
      setMasterBattleResult: (result: 'win' | 'lose' | null) => set({ masterBattleResult: result }),
      recordMasterWin: (trainerId: string) => set((state) => ({
        masterProgress: {
          defeatedIds: state.masterProgress.defeatedIds.includes(trainerId)
            ? state.masterProgress.defeatedIds
            : [...state.masterProgress.defeatedIds, trainerId],
        },
      })),
      startIncubation: (p1: Pokemon, p2: Pokemon) => set((state) => {
        if (state.eggs.length >= 4) return {};
        const isDitto = (p: Pokemon) => p.pokemonId === 132;
        const compatible =
          isDitto(p1) || isDitto(p2) ||
          (p1.baseSpeciesId === p2.baseSpeciesId && p1.id !== p2.id);
        if (!compatible) return {};
        const nonDitto = isDitto(p1) ? p2 : p1;
        const bestIvs = {
          hp: Math.max(p1.ivs.hp, p2.ivs.hp),
          attack: Math.max(p1.ivs.attack, p2.ivs.attack),
          defense: Math.max(p1.ivs.defense, p2.ivs.defense),
          spAtk: Math.max(p1.ivs.spAtk, p2.ivs.spAtk),
          spDef: Math.max(p1.ivs.spDef, p2.ivs.spDef),
          speed: Math.max(p1.ivs.speed, p2.ivs.speed),
        };
        const now = Date.now();
        const egg: Egg = {
          id: Math.random().toString(36).substr(2, 9),
          parent1Id: p1.id,
          parent2Id: p2.id,
          basePokemonId: nonDitto.baseSpeciesId,
          baseSpeciesId: nonDitto.baseSpeciesId,
          createdAt: now,
          hatchAt: now + 40000,
          ivs: bestIvs,
          nature: CatchEngine.getNature(),
          isShiny: false,
        };
        return { eggs: [...state.eggs, egg] };
      }),
      hatchEgg: async (eggId: string) => {
        const state = get();
        const egg = state.eggs.find(e => e.id === eggId);
        if (!egg) return;
        
        try {
          // Fetch Pokemon data from API
          const pokemonData = await api.getPokemon(egg.basePokemonId);
          const speciesData = await api.getSpecies(egg.basePokemonId);
          
          // Build complete Pokemon object
          const baseStats = {
            hp: pokemonData.stats[0].base_stat,
            attack: pokemonData.stats[1].base_stat,
            defense: pokemonData.stats[2].base_stat,
            spAtk: pokemonData.stats[3].base_stat,
            spDef: pokemonData.stats[4].base_stat,
            speed: pokemonData.stats[5].base_stat,
          };
          
          const stats = BattleEngine.calculateStats(
            1,
            baseStats,
            egg.ivs,
            { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            egg.nature
          );
          
          const moves = await api.getPokemonMoves(pokemonData, 1);
          
          const newPokemon: Pokemon = {
            id: Math.random().toString(36).substr(2, 9),
            pokemonId: egg.basePokemonId,
            name: api.getItalianName(speciesData.names),
            level: 1,
            exp: 0,
            types: pokemonData.types.map((t: any) => t.type.name),
            stats,
            baseStats,
            ivs: egg.ivs,
            evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            nature: egg.nature,
            moves,
            currentHp: stats.hp,
            status: null,
            isShiny: egg.isShiny,
            caughtAt: Date.now(),
            growthRate: speciesData.growth_rate.name,
            baseSpeciesId: egg.baseSpeciesId,
          };
          
          set((state) => ({
            eggs: state.eggs.filter(e => e.id !== eggId),
            team: state.team.length < 4 ? [...state.team, newPokemon] : state.team,
            box: state.team.length >= 4 ? [...state.box, newPokemon] : state.box,
            pokedex: { ...state.pokedex, [newPokemon.pokemonId]: 'caught' },
          }));
        } catch (e) {
          console.error('Failed to hatch egg:', e);
        }
      },
      toggleFavorite: (id: string) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter(fid => fid !== id)
          : [...state.favorites, id],
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
      toggleExpShare: () => set((state) => ({ expShareActive: !state.expShareActive })),
      checkDailyMissions: () => set((state) => {
        if (!state.dailyMissions) {
          return { dailyMissions: generateDailyMissions(state) };
        }
        const today = new Date().toISOString().split('T')[0];
        if (state.dailyMissions.date === today) return {};
        return { dailyMissions: generateDailyMissions(state) };
      }),
      claimMission: (id: string) => set((state) => {
        if (!state.dailyMissions) return {};
        const mission = state.dailyMissions.missions.find(m => m.id === id);
        if (!mission || mission.claimed) return {};
        const newInventory = { ...state.inventory };
        if (mission.reward.items) {
          Object.entries(mission.reward.items).forEach(([itemId, amount]) => {
            newInventory[itemId] = (newInventory[itemId] || 0) + amount;
          });
        }
        return {
          coins: state.coins + (mission.reward.coins || 0),
          inventory: newInventory,
          dailyMissions: {
            ...state.dailyMissions,
            missions: state.dailyMissions.missions.map(m =>
              m.id === id ? { ...m, claimed: true } : m
            ),
          },
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
        const allRegions = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar'];
        const newCompleted = alreadyCompleted
          ? state.leagueProgress.completedRegions
          : [...state.leagueProgress.completedRegions, regionId];
        const allDone = allRegions.every(r => newCompleted.includes(r));
        return {
          leagueProgress: {
            ...state.leagueProgress,
            completedRegions: allDone ? [] : newCompleted,
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
      incrementLeagueMission: () => set((state) => ({
        ...updateMissionProgress(state, 'defeatLeague')
      })),
      incrementMasterMission: () => set((state) => ({
        ...updateMissionProgress(state, 'defeatMaster')
      })),
      setIslandLastCatch: (date: string) => set({ islandLastCatch: date }),
      dismissMissionToast: () => set({ pendingMissionToast: null }),
      removePokemon: (id: string) => set((state) => ({
        team: state.team.filter(p => p.id !== id),
        box: state.box.filter(p => p.id !== id),
      })),
      claimStreak: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        if (state.lastStreakDate === today) return {};
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const streak = state.lastStreakDate === yesterday ? (state.streak || 0) + 1 : 1;
        const reward = streak <= 7 ? STREAK_REWARDS[streak - 1] : STREAK_REWARDS[6];
        return {
          lastStreakDate: today,
          streak,
          coins: state.coins + reward.coins,
          inventory: { ...state.inventory, [reward.item]: (state.inventory[reward.item] || 0) + reward.qty },
        };
      }),
      claimPokedexReward: (genId: string) => set((state) => {
        if (state.claimedPokedexRewards.includes(genId)) return {};
        const REWARDS: Record<string, { coins: number; items: Record<string, number> }> = {
          'gen1': { coins: 1000, items: { rare_candy: 2, ultraball: 3 } },
          'gen2': { coins: 1000, items: { rare_candy: 2, ultraball: 3 } },
          'gen3': { coins: 1500, items: { rare_candy: 3, masterball: 1 } },
          'gen4': { coins: 1500, items: { rare_candy: 3, masterball: 1 } },
          'gen5': { coins: 2000, items: { rare_candy: 4, masterball: 1 } },
          'gen6': { coins: 2000, items: { rare_candy: 4, masterball: 1 } },
          'gen7': { coins: 2500, items: { rare_candy: 5, masterball: 2 } },
          'gen8': { coins: 2500, items: { rare_candy: 5, masterball: 2 } },
        };
        const reward = REWARDS[genId];
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
        state.pendingNewMoveQueue = [];
        if (!state.eggs) state.eggs = [];
        state.leagueBattleTeam = null;
        state.leagueBattleResult = null;
        state.masterBattleTeam = null;
        state.masterBattleResult = null;
        if (!state.masterProgress) state.masterProgress = { defeatedIds: [] };
        if (!state.claimedPokedexRewards) state.claimedPokedexRewards = [];
      }
    }
  )
);
