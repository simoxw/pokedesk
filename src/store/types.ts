export type {
  ScreenName,
  Pokemon,
  Move,
  Medal,
  DailyMission,
  Egg,
  Achievement,
  TeamPreset,
  GenMission,
  GameState,
} from '../types';

import type {
  ScreenName,
  Pokemon,
  Move,
  DailyMission,
  Egg,
  Achievement,
  TeamPreset,
  GameState,
} from '../types';

export interface GameStore extends GameState {
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
  toggleExpBoost: () => void;
  checkDailyMissions: () => void;
  claimMission: (id: string) => void;
  claimGenMission: (id: string) => void;
  setActivePresetCategory: (category: TeamPreset['category'] | null) => void;
  reportGenBattleResult: (result: { win: boolean; noFaint?: boolean; solo?: boolean }) => void;
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
  trainPokemon: (pokemonId: string, category: 'iv' | 'ev', stat: keyof Pokemon['ivs'], amount?: number) => void;
}
