import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Pokemon, ScreenName, Medal, Item, Move, DailyMission, Egg, Achievement, TeamPreset } from './types';
import { LEGENDARY_IDS, GEN_RANGES } from './data/legendaryIds';
import { api } from './api';
import { BattleEngine } from './BattleEngine';
import { CatchEngine } from './CatchEngine';
import { checkLevelUp } from './services/levelUpService';
import { TOWER_MILESTONES } from './services/battleTowerService';

interface GameStore extends GameState {
  battleWinStreak: number;
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
  updatePokedex: (pokemonId: number, status: 'seen' | 'caught', primaryType?: string) => void;
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
  resetBattleStreak: () => void;
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
  savePokedexTypes: (types: Record<number, string>) => void;
  initializeAchievements: () => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  unlockAchievement: (achievementId: string) => void;
  saveTeamPreset: (category: TeamPreset['category'], pokemonIds: string[]) => void;
  loadTeamPreset: (category: TeamPreset['category']) => void;
  deleteTeamPreset: (category: TeamPreset['category']) => void;
  startBattleTower: () => void;
  advanceBattleTowerFloor: () => void;
  abandonBattleTower: () => void;
  claimBattleTowerReward: (floor: number) => void;
}

type MissionTemplate = {
  type: 'catch' | 'battleWin' | 'defeatGym' | 'useItem' | 'catchShiny' | 'defeatLeague' | 'defeatMaster' | 'battleTower';
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
  { 
    type: 'battleTower', 
    target: 7, 
    description: 'Raggiungi il piano 7 della Torre Lotta', 
    reward: { coins: 1500, items: { rare_candy: 1 } } 
  }, 
  { 
    type: 'battleTower', 
    target: 25, 
    description: 'Raggiungi il piano 25 della Torre', 
    reward: { coins: 5000, items: { rare_candy: 2, masterball: 1 } } 
  },
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
  type: DailyMission['type'],
  value?: number
): Partial<GameState> {
  if (!state.dailyMissions) return {};
  const today = new Date().toISOString().split('T')[0];
  if (state.dailyMissions.date !== today) return {};
  const updated = state.dailyMissions.missions.map(m => {
    if (m.type === type && !m.completed) {
      const newCurrent = value !== undefined ? value : m.current + 1;
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
      pokedexTypes: {},
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
      battleWinStreak: 0,
      achievements: [],
      teamPresets: {},
      battleTower: { 
        currentFloor: 0, 
        bestFloor: 0, 
        isActive: false, 
        teamSnapshot: [], 
        claimedFloorRewards: [], 
      },
      
      // actions
      setScreen: (screen: ScreenName) => set({ currentScreen: screen }),
      setPlayer: (name: string, gender: 'M' | 'F') => 
        set({ player: { name, gender, createdAt: Date.now(), playTime: 0 }, isFirstRun: false }),
      updatePlayer: (updates: Partial<GameState['player']>) => 
        set((state) => ({ player: { ...state.player, ...updates } })),
      addPokemon: (pokemon: Pokemon) => set((state) => { 
        const missionUpdates = updateMissionProgress(state, 'catch'); 
        const shinyUpdates = pokemon.isShiny ? updateMissionProgress({ ...state, ...missionUpdates }, 'catchShiny') : {}; 
        const newPokedexTypes = pokemon.types?.[0] 
          ? { ...state.pokedexTypes, [pokemon.pokemonId]: pokemon.types[0] } 
          : state.pokedexTypes; 
        if (state.team.length < 4) { 
          return { 
            team: [...state.team, pokemon], 
            pokedex: { ...state.pokedex, [pokemon.pokemonId]: 'caught' }, 
            pokedexTypes: newPokedexTypes,
            ...missionUpdates, 
            ...shinyUpdates, 
          }; 
        } 
        return { 
          box: [...state.box, pokemon], 
          pokedex: { ...state.pokedex, [pokemon.pokemonId]: 'caught' }, 
          pokedexTypes: newPokedexTypes,
          ...missionUpdates, 
          ...shinyUpdates, 
        }; 
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

          // Evolution and Move learning check (non-blocking)
          checkLevelUp(p, newLevel, p.moves, get, set).catch(console.error);

          // Registra la specie nel Pokédex (sincronizzazione retroattiva)
          get().updatePokedex(p.pokemonId, 'caught', p.types[0]);

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

      useSpeciesCandy: (pokemonId: string, speciesId: number) => set((state) => {
        const CANDY_COST = 3;
        const candyKey = `candy_${speciesId}`;
        if ((state.inventory[candyKey] || 0) < CANDY_COST) return {};
        const applyTo = (list: any[]) => list.map(p => {
          if (p.id !== pokemonId || (p.pokemonId !== speciesId && p.baseSpeciesId !== speciesId) || p.level >= 100) return p;
          const newLevel = p.level + 1;
          const newStats = BattleEngine.calculateStats(
            newLevel,
            p.baseStats,
            p.ivs,
            p.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
            p.nature
          );

          // Evolution and Move learning check (non-blocking)
          checkLevelUp(p, newLevel, p.moves, get, set).catch(console.error);

          // Registra la specie nel Pokédex (sincronizzazione retroattiva)
          get().updatePokedex(p.pokemonId, 'caught', p.types[0]);

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
      useItem: (itemId: string) => set((state) => { 
        const healItems = new Set(['potion', 'superpotion', 'hyperpotion', 'full_heal']); 
        const missionUpdates = healItems.has(itemId) ? updateMissionProgress(state, 'useItem') : {}; 
        return { 
          inventory: { ...state.inventory, [itemId]: Math.max(0, (state.inventory[itemId] || 0) - 1) }, 
          ...missionUpdates, 
        }; 
      }),
      unlockMedal: (id: number) => set((state) => ({
        medals: state.medals.map(m => m.id === id ? { ...m, isUnlocked: true } : m)
      })),
      addCharge: (amount: number) => set((state) => ({
        charges: Math.min(6, state.charges + amount),
        lastTickTimestamp: Date.now(),
      })),
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
      addSafariCharge: (amount: number) => set((state) => ({
        safariCharges: Math.min(8, state.safariCharges + amount),
        lastSafariTickTimestamp: Date.now(),
      })),
      updatePokedex: (pokemonId: number, status: 'seen' | 'caught', primaryType?: string) => set((state) => {
        const current = state.pokedex[pokemonId];
        if (current === 'caught') return {}; // Don't downgrade caught to seen
        return { 
          pokedex: { ...state.pokedex, [pokemonId]: status },
          ...(primaryType ? { pokedexTypes: { ...state.pokedexTypes, [pokemonId]: primaryType } } : {}),
        };
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

        let newExp = pokemon.exp + amount;
        let newLevel = pokemon.level;
        let newStats = pokemon.stats;

        // Track levels gained for move learning
        const levelsGained: number[] = [];

        while (newLevel < 100) {
          const nextLevelExp = BattleEngine.getExpForNextLevel(newLevel, pokemon.growthRate);
          if (newExp >= nextLevelExp) {
            newLevel += 1;
            levelsGained.push(newLevel);
            newStats = BattleEngine.calculateStats(
              newLevel, pokemon.baseStats, pokemon.ivs,
              pokemon.evs ?? { hp:0, attack:0, defense:0, spAtk:0, spDef:0, speed:0 },
              pokemon.nature
            );
          } else {
            break;
          }
        }

        const hpDiff = newStats.hp - pokemon.stats.hp;
        const newCurrentHp = Math.min(newStats.hp, pokemon.currentHp + hpDiff);

        // Evolution and Move learning check (non-blocking)
        if (newLevel > pokemon.level) {
          checkLevelUp(pokemon, newLevel, pokemon.moves, get, set).catch(console.error);
          // Registra comunque la specie attuale nel Pokédex (sincronizzazione retroattiva)
          get().updatePokedex(pokemon.pokemonId, 'caught', pokemon.types[0]);
        }

        return {
          team: state.team.map(p => p.id === pokemonId
            ? { ...p, exp: newExp, level: newLevel, stats: newStats, currentHp: newCurrentHp }
            : p),
          box: state.box.map(p => p.id === pokemonId
            ? { ...p, exp: newExp, level: newLevel, stats: newStats, currentHp: newCurrentHp }
            : p),
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
        pokedexTypes: {},
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
        battleWinStreak: 0,
        achievements: [],
        teamPresets: {},
      }),
      confirmEvolution: () => set((state) => {
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
            p.level, newBaseStats, p.ivs,
            p.evs ?? { hp:0, attack:0, defense:0, spAtk:0, spDef:0, speed:0 },
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

        // Registra nel Pokédex la nuova forma
        get().updatePokedex(pending.newPokemonId, 'caught', pending.newTypes?.[0]);

        return {
          team: updatedTeam,
          box: updatedBox,
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
          hatchAt: now + 72 * 3600000, // 72 ore in millisecondi
          ivs: bestIvs,
          nature: CatchEngine.getNature(),
          isShiny: false,
        };
        return { eggs: [...state.eggs, egg] };
      }),
      hatchEgg: async (eggId: string) => {
        const state = get();
        const egg = state.eggs.find(e => e.id === eggId);
        if (!egg || Date.now() < egg.hatchAt) return;
        
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
            stats: {
              ...state.stats,
              totalCaught: state.stats.totalCaught + 1,
            },
          }));

          // Aggiorna Pokedex dopo il set
          get().updatePokedex(newPokemon.pokemonId, 'caught', newPokemon.types[0]);

          const currentBreed = get().achievements.find(a => a.id === 'breed_10')?.progress ?? 0;
          get().updateAchievementProgress('breed_10', currentBreed + 1);
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
          return { 
            currentBattlePath: { battlesWon, nextIsBoss }, 
            battleWinStreak: (state.battleWinStreak ?? 0) + 1,
            ...updateMissionProgress(state, 'battleWin') 
          };
        } else {
          const nextMedal = state.medals.find(m => !m.isUnlocked);
          let newMedals = state.medals;
          if (nextMedal) {
            newMedals = state.medals.map(m => m.id === nextMedal.id ? { ...m, isUnlocked: true } : m);
          }
          const gymUpdates = updateMissionProgress(state, 'defeatGym');
          const winUpdates = updateMissionProgress({ ...state, ...gymUpdates }, 'battleWin');
          return {
            currentBattlePath: { battlesWon: 0, nextIsBoss: false },
            battleWinStreak: 0,
            medals: newMedals,
            pendingMedalUnlock: nextMedal ? { ...nextMedal, isUnlocked: true } : null,
            ...gymUpdates,
            ...winUpdates,
          };
        }
      }),
      resetBattleStreak: () => set({ battleWinStreak: 0 }),
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
        const allRegions = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar']; 
        const alreadyCompleted = state.leagueProgress.completedRegions.includes(regionId); 
        const newCompleted = alreadyCompleted 
          ? state.leagueProgress.completedRegions 
          : [...state.leagueProgress.completedRegions, regionId]; 
        const allDone = allRegions.every(r => newCompleted.includes(r)); 
        // Trofei: aggiungi solo se non già presente (deduplicazione) 
        const newTrophies = state.leagueProgress.trophies.includes(trophyLabel) 
          ? state.leagueProgress.trophies 
          : [...state.leagueProgress.trophies, trophyLabel]; 
        return { 
          leagueProgress: { 
            ...state.leagueProgress, 
            // Se ciclo completato: resetta per nuovo giro, altrimenti aggiorna 
            completedRegions: allDone ? [] : newCompleted, 
            trophies: newTrophies, // mai resettato, accumula tutti i trofei unici 
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
      incrementLeagueMission: () => set((state) => {
        const leagueUpdates = updateMissionProgress(state, 'defeatLeague');
        const winUpdates = updateMissionProgress({ ...state, ...leagueUpdates }, 'battleWin');
        return {
          ...leagueUpdates,
          ...winUpdates
        };
      }),
      incrementMasterMission: () => set((state) => {
        const masterUpdates = updateMissionProgress(state, 'defeatMaster');
        const winUpdates = updateMissionProgress({ ...state, ...masterUpdates }, 'battleWin');
        return {
          ...masterUpdates,
          ...winUpdates
        };
      }),
      setIslandLastCatch: (date: string) => set({ islandLastCatch: date }),
      dismissMissionToast: () => set({ pendingMissionToast: null }),
      removePokemon: (id: string) => set((state) => ({
        team: state.team.filter(p => p.id !== id),
        box: state.box.filter(p => p.id !== id),
      })),
      claimStreak: () => set((state) => {
        const today = new Date().toLocaleDateString('en-CA');
        if (state.lastStreakDate === today) return {};
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
        const streak = state.lastStreakDate === yesterday ? (state.streak || 0) + 1 : 1;
        const reward = streak <= 7 ? STREAK_REWARDS[streak - 1] : STREAK_REWARDS[6];
        return {
          lastStreakDate: today,
          streak,
          coins: state.coins + reward.coins,
          inventory: { ...state.inventory, [reward.item]: (state.inventory[reward.item] || 0) + reward.qty },
        };
      }),
      claimPokedexReward: (genId: string): void => {
        set((state) => {
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
        });
      },
      savePokedexTypes: (types: Record<number, string>) => set((state) => ({
        pokedexTypes: { ...state.pokedexTypes, ...types }
      })),
       initializeAchievements: (): void => {
         set((state) => {
           const allPokemon = [...state.team, ...state.box];
           const shinyCount = allPokemon.filter(p => p.isShiny).length;
           const caughtEntries = Object.entries(state.pokedex).filter(([, s]) => s === 'caught').map(([id]) => Number(id)); 
           const gen1Count = caughtEntries.filter(id => id <= 151).length; 
           const gen2Count = caughtEntries.filter(id => id >= 152 && id <= 251).length; 
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
             { id: 'col_gen8_full', name: 'Maestro Galar', description: 'Cattura tutti i 89 Pokémon di Gen 8', category: 'collection', target: 89, reward: { coins: 12000, items: { rare_candy: 4, masterball: 2 } }, progress: 0, unlocked: false },
             { id: 'league_win', name: 'Aspirante', description: 'Sconfiggi un membro della Lega', category: 'special', target: 1, reward: { coins: 5000 }, progress: 0, unlocked: false },
             { id: 'league_master', name: 'Campione', description: 'Sconfiggi tutti i Master', category: 'special', target: 8, reward: { coins: 20000, title: 'Champion' }, progress: 0, unlocked: false },
             { id: 'no_damage', name: 'Invincibile', description: 'Vinci una battaglia senza subire danni', category: 'special', target: 1, reward: { coins: 3000 }, progress: 0, unlocked: false },
             { id: 'streak_10', name: 'Serie Vincente', description: '10 vittorie consecutive', category: 'special', target: 10, reward: { coins: 5000 }, progress: 0, unlocked: false },
             { id: 'breed_10', name: 'Allevatore', description: 'Schiudi 10 uova', category: 'special', target: 10, reward: { coins: 5000, items: { rare_candy: 5 } }, progress: state.eggs.filter(e => e.hatchAt < Date.now()).length, unlocked: false },
           { 
             id: 'tower_floor_25', 
             name: 'Guerriero della Torre', 
             description: 'Raggiungi il piano 25 della Torre Lotta', 
             category: 'special', 
             target: 25, 
             reward: { coins: 10000, items: { rare_candy: 3 } }, 
             progress: state.battleTower?.bestFloor ?? 0, 
             unlocked: false, 
           }, 
           { 
             id: 'tower_floor_49', 
             name: 'Maestro della Torre', 
             description: 'Raggiungi il piano 49 della Torre Lotta', 
             category: 'special', 
             target: 49, 
             reward: { coins: 25000, items: { masterball: 2, rare_candy: 5 } }, 
             progress: state.battleTower?.bestFloor ?? 0, 
             unlocked: false, 
           }, 
           { 
             id: 'tower_floor_77', 
             name: 'Leggenda della Torre', 
             description: 'Raggiungi il piano 77 della Torre Lotta', 
             category: 'special', 
             target: 77, 
             reward: { coins: 50000, items: { masterball: 3, rare_candy: 10 }, title: 'Tower Legend' }, 
             progress: state.battleTower?.bestFloor ?? 0, 
             unlocked: false, 
           } 
         ];

           // Mantieni gli achievement già sbloccati, aggiungi quelli mancanti 
           const existingIds = new Set(state.achievements.map((a: any) => a.id)); 
           const merged = [ 
             ...state.achievements, 
             ...achievements.filter(a => !existingIds.has(a.id)), 
           ]; 
           return { achievements: merged }; 
         });
       },
      updateAchievementProgress: (achievementId: string, progress: number): void => {
        set((state: any) => ({
          achievements: state.achievements.map((a: any) => 
            a.id === achievementId ? { ...a, progress: Math.min(progress, a.target) } : a
          )
        }));
      },
      unlockAchievement: (achievementId: string): void => {
        set((state: any) => {
          const updated = state.achievements.map((a: any) => 
            a.id === achievementId ? { ...a, unlocked: true } : a
          );
          const achievement = state.achievements.find((a: any) => a.id === achievementId);
          if (!achievement) return { achievements: updated };
          
          let newState: any = { achievements: updated };
          
          // Aggiungi monete
          if (achievement.reward.coins) {
            newState.coins = state.coins + achievement.reward.coins;
          }
          
          // Aggiungi items
          if (achievement.reward.items) {
            const newInventory = { ...state.inventory };
            Object.entries(achievement.reward.items).forEach(([itemId, qty]) => {
              newInventory[itemId] = (newInventory[itemId] || 0) + qty;
            });
            newState.inventory = newInventory;
          }
          
          return newState;
         });
       },
      saveTeamPreset: (category, pokemonIds) => set((state) => {
        const ownedById = new Map([...state.team, ...state.box].map((p) => [p.id, p]));
        const isValidForCategory = (pokemon: Pokemon) => {
          if (category === 'favorite') return true;
          if (category === 'legendary') return LEGENDARY_IDS.has(pokemon.pokemonId);
          const range = GEN_RANGES[category];
          if (!range) return true;
          return pokemon.pokemonId >= range[0] && pokemon.pokemonId <= range[1] && !LEGENDARY_IDS.has(pokemon.pokemonId);
        };
        const uniqueIds = [...new Set(pokemonIds)];
        const validatedIds = uniqueIds
          .map((id) => ownedById.get(id))
          .filter((p): p is Pokemon => Boolean(p))
          .filter((p) => isValidForCategory(p))
          .map((p) => p.id)
          .slice(0, 4);
        return {
          teamPresets: {
            ...state.teamPresets,
            [category]: {
              label: category,
              category,
              pokemonIds: validatedIds,
              updatedAt: Date.now(),
            }
          }
        };
      }),
      loadTeamPreset: (category) => set((state) => {
        const preset = state.teamPresets[category];
        if (!preset) return {};
        const allPokemon = [...state.team, ...state.box];
        const byId = new Map(allPokemon.map((p) => [p.id, p]));
        const validPokemon = [...new Set(preset.pokemonIds)]
          .map((id) => byId.get(id))
          .filter((p): p is Pokemon => Boolean(p))
          .slice(0, 4);
        if (validPokemon.length === 0) return {};
        const teamIds = new Set(validPokemon.map((p) => p.id));
        const newBox = allPokemon.filter((p) => !teamIds.has(p.id));
        return {
          team: validPokemon,
          box: newBox,
        };
      }),
      deleteTeamPreset: (category) => set((state) => {
        const next = { ...state.teamPresets };
        delete next[category];
        return { teamPresets: next };
      }),
       startBattleTower: () => {
         set((state) => ({
           battleTower: {
             ...state.battleTower,
             isActive: true,
             currentFloor: 1,
             teamSnapshot: JSON.parse(JSON.stringify(state.team)),
           }
         }));
       },
       advanceBattleTowerFloor: () => {
         set((state) => {
           const nextFloor = state.battleTower.currentFloor + 1;
           const newBest = Math.max(state.battleTower.bestFloor, nextFloor);
           
           // Ripristina PP tra i piani
           const restoredTeam = state.team.map(p => ({
             ...p,
             moves: p.moves.map(m => ({ ...m, pp: m.maxPp }))
           }));

           // Update achievements
           get().updateAchievementProgress('tower_floor_25', newBest); 
           get().updateAchievementProgress('tower_floor_49', newBest); 
           get().updateAchievementProgress('tower_floor_77', newBest);
           
           // Update missions
           const towerMissionUpdates = updateMissionProgress(state, 'battleTower', nextFloor);
           const winMissionUpdates = updateMissionProgress({ ...state, ...towerMissionUpdates }, 'battleWin');
           
           return {
             team: restoredTeam,
             battleTower: {
               ...state.battleTower,
               currentFloor: nextFloor,
               bestFloor: newBest,
             },
             ...towerMissionUpdates,
             ...winMissionUpdates
           };
         });
       },
       abandonBattleTower: () => {
         set((state) => {
           const healedTeam = state.team.map(p => 
             p.currentHp === 0 ? { ...p, currentHp: 1 } : p
           );
           return {
             team: healedTeam,
             battleTower: {
               ...state.battleTower,
               isActive: false,
               currentFloor: 0,
               teamSnapshot: [],
             }
           };
         });
       },
       claimBattleTowerReward: (floor: number) => {
         const state = get();
         if (state.battleTower.claimedFloorRewards.includes(floor)) return;
         
         const milestone = TOWER_MILESTONES[floor];
         if (!milestone) return;
         
         const newInventory = { ...state.inventory };
         Object.entries(milestone.items).forEach(([id, qty]) => {
           newInventory[id] = (newInventory[id] || 0) + qty;
         });
         
         set((state) => ({
           coins: state.coins + milestone.coins,
           inventory: newInventory,
           battleTower: {
             ...state.battleTower,
             claimedFloorRewards: [...state.battleTower.claimedFloorRewards, floor],
           },
           ...(floor === 25 ? { pendingMissionToast: '⚡ Modalità Elite sbloccata! Dal piano 25: squadre Lv.100!' } : {}),
         }));
       },
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
        if (!state.pokedexTypes) state.pokedexTypes = {};

        // Sincronizzazione retroattiva: se pokedexTypes è incompleto, popolalo dai Pokémon posseduti
        [...state.team, ...state.box].forEach(p => {
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
        // Deduplica trofei nei save esistenti 
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
      }
    }
  )
);

