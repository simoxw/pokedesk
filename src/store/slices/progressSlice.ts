import { StateCreator } from 'zustand';
import { TOWER_MILESTONES } from '../../services/battleTowerService';
import { GameStore, Medal } from '../types';
import { updateGenMissionProgress, updateMissionProgress } from './missionSlice';

export type ProgressSlice = Pick<
  GameStore,
  | 'medals'
  | 'leagueProgress'
  | 'masterProgress'
  | 'battleTower'
  | 'currentBattlePath'
  | 'battleWinStreak'
  | 'charges'
  | 'lastTickTimestamp'
  | 'safariCharges'
  | 'lastSafariTickTimestamp'
  | 'islandLastCatch'
  | 'regionalCharges'
  | 'lastRegionalTickTimestamp'
  | 'unlockMedal'
  | 'addCharge'
  | 'consumeCharge'
  | 'consumeSafariCharge'
  | 'addSafariCharge'
  | 'consumeRegionalCharge'
  | 'addRegionalCharge'
  | 'resetGame'
  | 'startLeagueRun'
  | 'advanceLeagueTrainer'
  | 'completeLeagueRegion'
  | 'abandonLeagueRun'
  | 'recordMasterWin'
  | 'recordBattleWin'
  | 'resetBattleStreak'
  | 'startBattleTower'
  | 'advanceBattleTowerFloor'
  | 'abandonBattleTower'
  | 'claimBattleTowerReward'
  | 'setIslandLastCatch'
>;

const INITIAL_MEDALS: Medal[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  name: `Capopalestra ${i + 1}`,
  type: 'normal',
  isUnlocked: false,
}));

export const createProgressSlice: StateCreator<GameStore, [], [], ProgressSlice> = (set, get) => ({
  medals: INITIAL_MEDALS,
  leagueProgress: { currentRun: null, completedRegions: [], trophies: [], completedRuns: 0 },
  masterProgress: { defeatedIds: [] },
  battleTower: { currentFloor: 0, bestFloor: 0, isActive: false, teamSnapshot: [], claimedFloorRewards: [] },
  currentBattlePath: { battlesWon: 0, nextIsBoss: false },
  battleWinStreak: 0,
  charges: 6,
  lastTickTimestamp: Date.now(),
  safariCharges: 0,
  lastSafariTickTimestamp: Date.now(),
  islandLastCatch: null,
  regionalCharges: 3,
  lastRegionalTickTimestamp: Date.now(),
  unlockMedal: (id) =>
    set((state) => ({
      medals: state.medals.map((m) => (m.id === id ? { ...m, isUnlocked: true } : m)),
    })),
  startLeagueRun: (regionId) =>
    set((state) => ({
      leagueProgress: {
        ...state.leagueProgress,
        currentRun: { regionId, trainerIndex: 0, defeatedTrainers: [] },
      },
    })),
  advanceLeagueTrainer: (trainerIndex) =>
    set((state) => {
      if (!state.leagueProgress.currentRun) return {};
      return {
        leagueProgress: {
          ...state.leagueProgress,
          currentRun: {
            ...state.leagueProgress.currentRun,
            trainerIndex: trainerIndex + 1,
            defeatedTrainers: [...state.leagueProgress.currentRun.defeatedTrainers, trainerIndex],
          },
        },
      };
    }),
  completeLeagueRegion: (regionId, trophyLabel) =>
    set((state) => {
      const allRegions = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar'];
      const alreadyCompleted = state.leagueProgress.completedRegions.includes(regionId);
      const newCompleted = alreadyCompleted ? state.leagueProgress.completedRegions : [...state.leagueProgress.completedRegions, regionId];
      const allDone = allRegions.every((r) => newCompleted.includes(r));
      const newTrophies = state.leagueProgress.trophies.includes(trophyLabel)
        ? state.leagueProgress.trophies
        : [...state.leagueProgress.trophies, trophyLabel];
      return {
        leagueProgress: {
          ...state.leagueProgress,
          completedRegions: allDone ? [] : newCompleted,
          trophies: newTrophies,
          completedRuns: allDone ? state.leagueProgress.completedRuns + 1 : state.leagueProgress.completedRuns,
          currentRun: null,
        },
      };
    }),
  abandonLeagueRun: () =>
    set((state) => ({
      leagueProgress: { ...state.leagueProgress, currentRun: null },
    })),
  recordMasterWin: (trainerId) =>
    set((state) => ({
      masterProgress: {
        defeatedIds: state.masterProgress.defeatedIds.includes(trainerId)
          ? state.masterProgress.defeatedIds
          : [...state.masterProgress.defeatedIds, trainerId],
      },
    })),
  addCharge: (amount) =>
    set((state) => ({
      charges: Math.min(6, state.charges + amount),
      lastTickTimestamp: Date.now(),
    })),
  consumeCharge: () =>
    set((state) => {
      if (state.charges >= 6) {
        return { charges: 5, lastTickTimestamp: Date.now() };
      }
      return { charges: Math.max(0, state.charges - 1) };
    }),
  consumeSafariCharge: () =>
    set((state) => {
      if (state.safariCharges >= 8) {
        return { safariCharges: 7, lastSafariTickTimestamp: Date.now() };
      }
      return { safariCharges: Math.max(0, state.safariCharges - 1) };
    }),
  addSafariCharge: (amount) =>
    set((state) => ({
      safariCharges: Math.min(8, state.safariCharges + amount),
      lastSafariTickTimestamp: Date.now(),
    })),
  resetGame: () =>
    set({
      player: { name: '', gender: 'M' as const, createdAt: Date.now(), playTime: 0 },
      team: [],
      box: [],
      inventory: { pokeball: 10, potion: 5, full_heal: 2 },
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
      genChallenges: null,
      activePresetCategory: null,
      leagueProgress: { currentRun: null, completedRegions: [], trophies: [], completedRuns: 0 },
      masterProgress: { defeatedIds: [] },
      currentScreen: 'START_SCREEN',
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
      regionalCharges: 3,
      lastRegionalTickTimestamp: Date.now(),
      pendingMissionToast: null,
      settings: { audio: true, notifications: true },
      expShareActive: false,
      pendingMedalUnlock: null,
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
    }),
  recordBattleWin: () =>
    set((state) => {
      let { battlesWon, nextIsBoss } = state.currentBattlePath;
      if (!nextIsBoss) {
        battlesWon += 1;
        if (battlesWon % 15 === 0) {
          nextIsBoss = true;
        }
        const dailyUpdates = updateMissionProgress(state, 'battleWin');
        const genWinUpdates = updateGenMissionProgress({ ...state, ...dailyUpdates } as GameStore, 'genBattleWin');
        return {
          currentBattlePath: { battlesWon, nextIsBoss },
          battleWinStreak: (state.battleWinStreak ?? 0) + 1,
          ...dailyUpdates,
          ...genWinUpdates,
        };
      }
      const nextMedal = state.medals.find((m) => !m.isUnlocked);
      let newMedals = state.medals;
      if (nextMedal) {
        newMedals = state.medals.map((m) => (m.id === nextMedal.id ? { ...m, isUnlocked: true } : m));
      }
      const gymUpdates = updateMissionProgress(state, 'defeatGym');
      const winUpdates = updateMissionProgress({ ...state, ...gymUpdates } as GameStore, 'battleWin');
      const genWinUpdates = updateGenMissionProgress({ ...state, ...gymUpdates, ...winUpdates } as GameStore, 'genBattleWin');
      return {
        currentBattlePath: { battlesWon: 0, nextIsBoss: false },
        battleWinStreak: 0,
        medals: newMedals,
        pendingMedalUnlock: nextMedal ? { ...nextMedal, isUnlocked: true } : null,
        ...gymUpdates,
        ...winUpdates,
        ...genWinUpdates,
      };
    }),
  resetBattleStreak: () => set({ battleWinStreak: 0 }),
  startBattleTower: () =>
    set((state) => ({
      battleTower: {
        ...state.battleTower,
        isActive: true,
        currentFloor: 1,
        teamSnapshot: JSON.parse(JSON.stringify(state.team)),
      },
    })),
  advanceBattleTowerFloor: () =>
    set((state) => {
      const nextFloor = state.battleTower.currentFloor + 1;
      const newBest = Math.max(state.battleTower.bestFloor, nextFloor);
      get().updateAchievementProgress('tower_floor_25', newBest);
      get().updateAchievementProgress('tower_floor_49', newBest);
      get().updateAchievementProgress('tower_floor_77', newBest);
      const towerMissionUpdates = updateMissionProgress(state, 'battleTower', nextFloor);
      const winMissionUpdates = updateMissionProgress({ ...state, ...towerMissionUpdates } as GameStore, 'battleWin');
      return {
        team: state.team.map((p) => ({
          ...p,
          moves: p.moves.map((m) => ({ ...m, pp: m.maxPp })),
        })),
        battleTower: {
          ...state.battleTower,
          currentFloor: nextFloor,
          bestFloor: newBest,
        },
        ...towerMissionUpdates,
        ...winMissionUpdates,
      };
    }),
  abandonBattleTower: () =>
    set((state) => ({
      team: state.team.map((p) => (p.currentHp === 0 ? { ...p, currentHp: 1 } : p)),
      battleTower: {
        ...state.battleTower,
        isActive: false,
        currentFloor: 0,
        teamSnapshot: [],
      },
    })),
  claimBattleTowerReward: (floor) =>
    set((state) => {
      if (state.battleTower.claimedFloorRewards.includes(floor)) return {};
      const milestone = TOWER_MILESTONES[floor];
      if (!milestone) return {};
      const newInventory = { ...state.inventory };
      Object.entries(milestone.items).forEach(([id, qty]) => {
        newInventory[id] = (newInventory[id] || 0) + qty;
      });
      return {
        coins: state.coins + milestone.coins,
        inventory: newInventory,
        battleTower: {
          ...state.battleTower,
          claimedFloorRewards: [...state.battleTower.claimedFloorRewards, floor],
        },
        ...(floor === 25 ? { pendingMissionToast: '⚡ Modalità Elite sbloccata! Dal piano 25: squadre Lv.100!' } : {}),
      };
    }),
  setIslandLastCatch: (date) => set({ islandLastCatch: date }),
  consumeRegionalCharge: () =>
    set((state) => {
      if (state.regionalCharges >= 3) {
        return { regionalCharges: 2, lastRegionalTickTimestamp: Date.now() };
      }
      return { regionalCharges: Math.max(0, state.regionalCharges - 1) };
    }),
  addRegionalCharge: (amount) =>
    set((state) => ({
      regionalCharges: Math.min(3, state.regionalCharges + amount),
      lastRegionalTickTimestamp: Date.now(),
    })),
});
