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
  | 'LEAGUE_BATTLE_SCREEN';
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
  type: 'catch' | 'battleWin' | 'defeatGym' | 'useItem' | 'catchShiny';
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  reward: { coins?: number; items?: Record<string, number> };
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
  pendingNewMove: { pokemonId: string; move: Move } | null;
  favorites: string[];
  friendBattleTeam: any[] | null;
  leagueBattleTeam: any[] | null;
  leagueBattleResult: 'win' | 'lose' | null;
  isFirstRun: boolean;
  dailyMissions: { date: string; missions: DailyMission[] } | null;
  leagueProgress: {
    completedRuns: number;
    completedRegions: string[];
    trophies: string[];
    currentRun: { regionId: string; trainerIndex: number; defeatedTrainers: number[] } | null;
  };
  currentScreen: ScreenName;
}

export interface GameState {
  player: {
    name: string;
    gender: 'M' | 'F';
    createdAt: number;
    playTime: number;
  };
  team: Pokemon[];
  box: Pokemon[];
  inventory: Record<string, number>;
  coins: number;
  medals: Medal[];
  currentBattlePath: {
    battlesWon: number;
    nextIsBoss: boolean;
  };
  charges: number;
  lastTickTimestamp: number;
  safariCharges: number;
  lastSafariTickTimestamp: number;
  pokedex: Record<number, 'seen' | 'caught'>;
  stats: {
    totalCaught: number;
    totalBattles: number;
    shiniesFound: number;
    pokemonReleased: number;
  };
  settings: {
    audio: boolean;
    notifications: boolean;
  };
  expShareActive: boolean;
  pendingMedalUnlock: Medal | null;
  pendingEvolution: {
    pokemonId: string;
    newPokemonId: number;
    newName: string;
    newTypes?: PokemonType[];
    newBaseStats?: Stats;
  } | null;
  pendingNewMove: {
    pokemonId: string;
    move: Move;
  } | null;
  favorites: string[];
  friendBattleTeam: any[] | null;
  isFirstRun: boolean;
  dailyMissions: {
    date: string;
    missions: DailyMission[];
  } | null;
  leagueProgress: {
    completedRuns: number;
    completedRegions: string[];
    trophies: string[];
    currentRun: {
      regionId: string;
      trainerIndex: number;
      defeatedTrainers: number[];
    } | null;
  };
  currentScreen: ScreenName;
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
