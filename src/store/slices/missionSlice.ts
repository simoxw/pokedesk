import { StateCreator } from 'zustand';
import { GEN_RANGES, LEGENDARY_IDS } from '../../data/legendaryIds';
import { DailyMission, GameStore, GenMission, TeamPreset } from '../types';

export type MissionSlice = Pick<
  GameStore,
  | 'dailyMissions'
  | 'genChallenges'
  | 'activePresetCategory'
  | 'pendingMissionToast'
  | 'checkDailyMissions'
  | 'claimMission'
  | 'claimGenMission'
  | 'setActivePresetCategory'
  | 'reportGenBattleResult'
  | 'incrementLeagueMission'
  | 'incrementMasterMission'
>;

type MissionTemplate = {
  type: 'catch' | 'battleWin' | 'defeatGym' | 'useItem' | 'catchShiny' | 'defeatLeague' | 'defeatMaster' | 'battleTower';
  target: number;
  description: string;
  reward: { coins?: number; items?: Record<string, number> };
};

type GenMissionTemplate = {
  type: GenMission['type'];
  target: number;
  description: (category: TeamPreset['category']) => string;
  rewardFactor: number;
  legendaryItem?: Record<string, number>;
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
  { type: 'battleTower', target: 7, description: 'Raggiungi il piano 7 della Torre Lotta', reward: { coins: 1500, items: { rare_candy: 1 } } },
  { type: 'battleTower', target: 25, description: 'Raggiungi il piano 25 della Torre', reward: { coins: 5000, items: { rare_candy: 2, masterball: 1 } } },
];

const GEN_CHALLENGE_REWARDS: Record<TeamPreset['category'], number> = {
  gen1: 300,
  gen2: 400,
  gen3: 500,
  gen4: 600,
  gen5: 700,
  gen6: 800,
  gen7: 850,
  gen8: 900,
  gen9: 950,
  legendary: 1500,
  favorite: 700,
  regional: 900,
};

const GEN_COMMON_POOL: GenMissionTemplate[] = [
  { type: 'genBattleWin', target: 2, description: (c) => `Vinci 2 battaglie con team ${c.toUpperCase()}`, rewardFactor: 0.7 },
  { type: 'genBattleWin', target: 3, description: (c) => `Vinci 3 battaglie con team ${c.toUpperCase()}`, rewardFactor: 1 },
  { type: 'genCatch', target: 2, description: (c) => `Cattura 2 Pokémon ${c.toUpperCase()}`, rewardFactor: 0.6 },
  { type: 'genCatch', target: 3, description: (c) => `Cattura 3 Pokémon ${c.toUpperCase()}`, rewardFactor: 0.85 },
  { type: 'genEvolve', target: 1, description: (c) => `Fai evolvere 1 Pokémon ${c.toUpperCase()}`, rewardFactor: 0.8 },
];

const GEN_SKILL_POOL: GenMissionTemplate[] = [
  { type: 'genNoFaint', target: 1, description: (c) => `Vinci senza perdere Pokémon (${c.toUpperCase()})`, rewardFactor: 1, legendaryItem: { rare_candy: 1 } },
  { type: 'genSoloWin', target: 1, description: (c) => `Vinci con un solo Pokémon in squadra (${c.toUpperCase()})`, rewardFactor: 1 },
];

const SKILL_ENABLED_CATEGORIES: TeamPreset['category'][] = ['gen6', 'gen7', 'gen8', 'gen9', 'legendary'];

export function isPokemonInPresetCategory(pokemon: GameStore['team'][number], category: TeamPreset['category']): boolean {
  if (category === 'favorite') return true;
  if (category === 'legendary') return LEGENDARY_IDS.has(pokemon.pokemonId);
  if (category === 'regional') return pokemon.pokemonId > 10000;
  const range = GEN_RANGES[category];
  if (!range) return false;
  return pokemon.pokemonId >= range[0] && pokemon.pokemonId <= range[1] && !LEGENDARY_IDS.has(pokemon.pokemonId);
}

export function isTeamValidForPresetCategory(team: GameStore['team'], category: TeamPreset['category'] | null): boolean {
  if (!category || team.length === 0) return false;
  return team.every((p) => isPokemonInPresetCategory(p, category));
}

function buildGenMissionFromTemplate(category: TeamPreset['category'], template: GenMissionTemplate, suffix: string): GenMission {
  const baseReward = GEN_CHALLENGE_REWARDS[category] ?? 500;
  return {
    id: `gen_${category}_${template.type}_${template.target}${suffix ? `_${suffix}` : ''}`,
    description: template.description(category),
    type: template.type,
    target: template.target,
    current: 0,
    completed: false,
    claimed: false,
    reward: {
      coins: Math.floor(baseReward * template.rewardFactor),
      ...(category === 'legendary' && template.legendaryItem ? { items: template.legendaryItem } : {}),
    },
  };
}

function pickRandomUniqueTemplates(pool: GenMissionTemplate[], count: number): GenMissionTemplate[] {
  const copy = [...pool];
  const picked: GenMissionTemplate[] = [];
  const seen = new Set<string>();
  while (copy.length > 0 && picked.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    const [candidate] = copy.splice(idx, 1);
    const key = `${candidate.type}:${candidate.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(candidate);
  }
  return picked;
}

function buildGenChallengeMissions(category: TeamPreset['category']): GenMission[] {
  const commonPicked = pickRandomUniqueTemplates(GEN_COMMON_POOL, SKILL_ENABLED_CATEGORIES.includes(category) ? 3 : 4);
  const missions = commonPicked.map((t, i) => buildGenMissionFromTemplate(category, t, `c${i}`));
  if (!SKILL_ENABLED_CATEGORIES.includes(category)) return missions.slice(0, 4);
  const [skillTemplate] = pickRandomUniqueTemplates(GEN_SKILL_POOL, 1);
  if (!skillTemplate) return missions.slice(0, 4);
  return [...missions, buildGenMissionFromTemplate(category, skillTemplate, 's0')].slice(0, 4);
}

export function generateGenChallenges(category: TeamPreset['category'] | null): GameStore['genChallenges'] {
  if (!category) return null;
  const today = new Date().toISOString().split('T')[0];
  return {
    date: today,
    category,
    missions: buildGenChallengeMissions(category),
  };
}

export function updateGenMissionProgress(state: GameStore, type: GenMission['type'], increment = 1): Partial<GameStore> {
  if (!state.genChallenges || !state.activePresetCategory) return {};
  const today = new Date().toISOString().split('T')[0];
  if (state.genChallenges.date !== today) return {};
  if (state.genChallenges.category !== state.activePresetCategory) return {};
  if (!isTeamValidForPresetCategory(state.team, state.activePresetCategory)) return {};
  const updated = state.genChallenges.missions.map((m) => {
    if (m.type !== type || m.completed) return m;
    const nextCurrent = Math.min(m.target, m.current + increment);
    return { ...m, current: nextCurrent, completed: nextCurrent >= m.target };
  });
  const justCompleted = updated.find((m, i) => m.completed && !state.genChallenges!.missions[i].completed);
  return {
    genChallenges: { ...state.genChallenges, missions: updated },
    ...(justCompleted ? { pendingMissionToast: justCompleted.description } : {}),
  };
}

function generateDailyMissions(state: GameStore | undefined): { date: string; missions: DailyMission[] } {
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
      })),
    };
  }
  const medalsCount = (state.medals ?? []).filter((m) => m.isUnlocked).length;
  let pool = [...MISSION_POOL];
  if (medalsCount < 40) {
    pool = pool.filter((m) => m.type !== 'defeatLeague' && m.type !== 'defeatMaster');
  }
  if ((state.leagueProgress?.completedRuns ?? 0) < 1) {
    pool = pool.filter((m) => m.type !== 'defeatMaster');
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
    })),
  };
}

export function updateMissionProgress(state: GameStore, type: DailyMission['type'], value?: number): Partial<GameStore> {
  if (!state.dailyMissions) return {};
  const today = new Date().toISOString().split('T')[0];
  if (state.dailyMissions.date !== today) return {};
  const updated = state.dailyMissions.missions.map((m) => {
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

export const createMissionSlice: StateCreator<GameStore, [], [], MissionSlice> = (set) => ({
  dailyMissions: null,
  genChallenges: null,
  activePresetCategory: null,
  pendingMissionToast: null,
  checkDailyMissions: () =>
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const next: Partial<GameStore> = {};
      if (!state.dailyMissions) {
        next.dailyMissions = generateDailyMissions(state);
      } else if (state.dailyMissions.date !== today) {
        next.dailyMissions = generateDailyMissions(state);
      }
      if (state.activePresetCategory) {
        if (!state.genChallenges || state.genChallenges.date !== today || state.genChallenges.category !== state.activePresetCategory) {
          next.genChallenges = generateGenChallenges(state.activePresetCategory);
        }
      }
      return next;
    }),
  claimMission: (id) =>
    set((state) => {
      if (!state.dailyMissions) return {};
      const mission = state.dailyMissions.missions.find((m) => m.id === id);
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
          missions: state.dailyMissions.missions.map((m) => (m.id === id ? { ...m, claimed: true } : m)),
        },
      };
    }),
  claimGenMission: (id) =>
    set((state) => {
      if (!state.genChallenges) return {};
      const mission = state.genChallenges.missions.find((m) => m.id === id);
      if (!mission || mission.claimed || !mission.completed) return {};
      const newInventory = { ...state.inventory };
      if (mission.reward.items) {
        Object.entries(mission.reward.items).forEach(([itemId, amount]) => {
          newInventory[itemId] = (newInventory[itemId] || 0) + amount;
        });
      }
      return {
        coins: state.coins + (mission.reward.coins || 0),
        inventory: newInventory,
        genChallenges: {
          ...state.genChallenges,
          missions: state.genChallenges.missions.map((m) => (m.id === id ? { ...m, claimed: true } : m)),
        },
      };
    }),
  setActivePresetCategory: (category) =>
    set((state) => {
      const nextChallenges = generateGenChallenges(category);
      return {
        activePresetCategory: category,
        genChallenges: nextChallenges ?? state.genChallenges,
      };
    }),
  reportGenBattleResult: (result) =>
    set((state) => {
      if (!result.win) return {};
      let merged: Partial<GameStore> = updateGenMissionProgress(state, 'genBattleWin');
      if (result.noFaint) merged = { ...merged, ...updateGenMissionProgress({ ...state, ...merged } as GameStore, 'genNoFaint') };
      if (result.solo) merged = { ...merged, ...updateGenMissionProgress({ ...state, ...merged } as GameStore, 'genSoloWin') };
      return merged;
    }),
  incrementLeagueMission: () =>
    set((state) => {
      const leagueUpdates = updateMissionProgress(state, 'defeatLeague');
      const winUpdates = updateMissionProgress({ ...state, ...leagueUpdates } as GameStore, 'battleWin');
      return {
        ...leagueUpdates,
        ...winUpdates,
      };
    }),
  incrementMasterMission: () =>
    set((state) => {
      const masterUpdates = updateMissionProgress(state, 'defeatMaster');
      const winUpdates = updateMissionProgress({ ...state, ...masterUpdates } as GameStore, 'battleWin');
      return {
        ...masterUpdates,
        ...winUpdates,
      };
    }),
});
