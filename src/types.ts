export type ScreenName =
  | 'START_SCREEN'
  | 'STARTER_DRAFT'
  | 'HUB_SCREEN'
  | 'CATCH_SCREEN'
  | 'BATTLE_SCREEN'
  | 'SAFARI_SCREEN'
  | 'TEAM_SCREEN'
  | 'BOX_SCREEN'
  | 'BAG_SCREEN'
  | 'POKEDEX_SCREEN'
  | 'SHOP_SCREEN'
  | 'PROFILE_SCREEN'
  | 'TRADE_SCREEN'
  | 'OPTIONS_SCREEN'
  | 'FRIEND_BATTLE_SCREEN'
  | 'LEAGUE_SELECT_SCREEN'
  | 'LEAGUE_BATTLE_SCREEN'
  | 'MASTER_BATTLE_SCREEN'
  | 'ISLAND_SCREEN'
  | 'ACHIEVEMENT_SCREEN'
  | 'BATTLE_TOWER_SCREEN';
export type PokemonType = 
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice' 
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' 
  | 'bug' | 'rock' | 'ghost' | 'dragon' | 'steel' | 'fairy' | 'dark';

export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  priority: number;
  category: 'physical' | 'special' | 'status';
  description: string;
  effectChance?: number;
  statusEffect?: StatusEffect;
  meta?: any;
  stat_changes?: Array<{ change: number; stat: { name: string } }>;
}

export type StatusEffect = 'PSN' | 'BRN' | 'PAR' | 'SLP' | 'FRZ' | null;

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export interface Egg {
  id: string;
  parent1Id: string;
  parent2Id: string;
  basePokemonId: number;
  baseSpeciesId: number;
  ivs: Stats;
  nature: string;
  isShiny: boolean;
  createdAt: number;
  hatchAt: number;
}

export interface Pokemon {
  id: string; // Unique instance ID
  pokemonId: number; // PokéAPI ID
  name: string;
  customName?: string;
  level: number;
  exp: number;
  types: PokemonType[];
  stats: Stats;
  baseStats: Stats;
  ivs: Stats;
  evs: Stats;
  nature: string;
  moves: Move[];
  currentHp: number;
  status: StatusEffect;
  sleepTurns?: number;
  isShiny: boolean;
  caughtAt: number;
  growthRate: string;
  baseSpeciesId: number;
  spriteUrl?: string;
}

export interface Item {
  id: string;
  name: string;
  type: 'ball' | 'heal' | 'status' | 'pp' | 'level';
  cost: number;
  unlockMedals: number;
  effect: string;
}

export interface Medal {
  id: number;
  name: string;
  type: PokemonType;
  isUnlocked: boolean;
}

export interface DailyMission {
  id: string;
  description: string;
  type: 'catch' | 'battleWin' | 'defeatGym' | 'useItem' | 'catchShiny' | 'defeatLeague' | 'defeatMaster';
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  reward: { coins?: number; items?: Record<string, number> };
}

export interface BattleTowerState {
  currentFloor: number;
  bestFloor: number;
  isActive: boolean;
  teamSnapshot: Pokemon[];
  claimedFloorRewards: number[];
}

export interface GameState {
  player: { name: string; gender: 'M' | 'F'; createdAt: number; playTime: number };
  team: Pokemon[];
  box: Pokemon[];
  inventory: Record<string, number>;
  coins: number;
  medals: Medal[];
  currentBattlePath: { battlesWon: number; nextIsBoss: boolean };
  charges: number;
  lastTickTimestamp: number;
  safariCharges: number;
  lastSafariTickTimestamp: number;
  pokedex: Record<number, 'seen' | 'caught'>;
  stats: { totalCaught: number; totalBattles: number; shiniesFound: number; pokemonReleased: number };
  settings: { audio: boolean; notifications: boolean };
  expShareActive: boolean;
  pendingMedalUnlock: Medal | null;
  pendingEvolution: { pokemonId: string; newPokemonId: number; newName: string; newTypes?: PokemonType[]; newBaseStats?: Stats } | null;
  pendingNewMoveQueue: { pokemonId: string; move: Move }[];
  eggs: Egg[];
  favorites: string[];
  friendBattleTeam: any[] | null;
  leagueBattleTeam: any[] | null;
  leagueBattleResult: 'win' | 'lose' | null;
  masterBattleTeam: any[] | null;
  masterBattleResult: 'win' | 'lose' | null;
  isFirstRun: boolean;
  dailyMissions: { date: string; missions: DailyMission[] } | null;
  islandLastCatch: string | null;
  pendingMissionToast: string | null;
  streak: number;
  lastStreakDate: string | null;
  achievements: Achievement[];
  leagueProgress: {
    completedRuns: number;
    completedRegions: string[];
    trophies: string[];
    currentRun: { regionId: string; trainerIndex: number; defeatedTrainers: number[] } | null;
  };
  masterProgress: { defeatedIds: string[] };
  claimedPokedexRewards: string[];
  currentScreen: ScreenName;
  battleWinStreak: number;
  battleTower: BattleTowerState;
}

export interface PokemonSpecies {
  id: number;
  name: string;
  names: { name: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  evolution_chain: { url: string };
  growth_rate: { name: string };
}

export interface EvolutionChain {
  chain: {
    species: { name: string; url: string };
    evolves_to: any[];
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'catch' | 'battle' | 'shiny' | 'collection' | 'special';
  progress: number;
  target: number;
  reward: { coins: number; items?: Record<string, number>; title?: string };
  unlocked: boolean;
  retroactive?: boolean;
}
