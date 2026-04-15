import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../store';
import type { Pokemon } from '../types';

vi.mock('../services/levelUpService', () => ({
  checkLevelUp: vi.fn(async () => undefined),
}));

vi.mock('../api', () => ({
  api: {
    getPokemon: vi.fn(async () => ({
      stats: [
        { base_stat: 45 },
        { base_stat: 49 },
        { base_stat: 49 },
        { base_stat: 65 },
        { base_stat: 65 },
        { base_stat: 45 },
      ],
      types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
    })),
    getSpecies: vi.fn(async () => ({
      names: [{ name: 'Bulbasaur' }],
      growth_rate: { name: 'medium' },
    })),
    getPokemonMoves: vi.fn(async () => []),
    getItalianName: vi.fn((names: Array<{ name: string }>) => names[0]?.name ?? 'Pokemon'),
  },
}));

vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => null),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}));

const makePokemon = (overrides: Partial<Pokemon> = {}): Pokemon => ({
  id: `pkm-${Math.random().toString(36).slice(2, 8)}`,
  pokemonId: 1,
  name: 'Bulbasaur',
  level: 10,
  exp: 0,
  types: ['grass', 'poison'],
  stats: { hp: 40, attack: 30, defense: 30, spAtk: 30, spDef: 30, speed: 30 },
  baseStats: { hp: 40, attack: 30, defense: 30, spAtk: 30, spDef: 30, speed: 30 },
  ivs: { hp: 20, attack: 20, defense: 20, spAtk: 20, spDef: 20, speed: 20 },
  evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
  nature: 'Hardy',
  moves: [],
  currentHp: 40,
  status: null,
  isShiny: false,
  caughtAt: Date.now(),
  growthRate: 'medium',
  baseSpeciesId: 1,
  ...overrides,
});

describe('Store Gameplay Slices', () => {
  beforeEach(() => {
    useStore.getState().resetGame();
    useStore.setState({
      dailyMissions: null,
      genChallenges: null,
      pendingMissionToast: null,
      activePresetCategory: null,
    });
  });

  it('addPokemon puts pokemon in team and updates pokedex', () => {
    const p = makePokemon();
    useStore.getState().addPokemon(p);
    const state = useStore.getState();
    expect(state.team.some((x) => x.id === p.id)).toBe(true);
    expect(state.box.some((x) => x.id === p.id)).toBe(false);
    expect(state.pokedex[p.pokemonId]).toBe('caught');
    expect(state.pokedexTypes[p.pokemonId]).toBe(p.types[0]);
  });

  it('addPokemon sends pokemon to box when team has 4', () => {
    const starters = [1, 4, 7, 25].map((id, i) =>
      makePokemon({ id: `team-${i}`, pokemonId: id, baseSpeciesId: id, name: `Pkm${id}` })
    );
    useStore.setState({ team: starters, box: [] });
    const extra = makePokemon({ id: 'extra-1', pokemonId: 39, baseSpeciesId: 39, name: 'Jigglypuff' });
    useStore.getState().addPokemon(extra);
    const state = useStore.getState();
    expect(state.team).toHaveLength(4);
    expect(state.box.some((x) => x.id === extra.id)).toBe(true);
  });

  it('useItem decrements inventory and updates mission progress', () => {
    const today = new Date().toISOString().split('T')[0];
    useStore.setState({
      inventory: { potion: 2 },
      dailyMissions: {
        date: today,
        missions: [
          {
            id: 'm1',
            description: 'Usa una pozione',
            type: 'useItem',
            target: 1,
            current: 0,
            completed: false,
            claimed: false,
            reward: { coins: 100 },
          },
        ],
      },
    });
    useStore.getState().useItem('potion');
    const state = useStore.getState();
    expect(state.inventory.potion).toBe(1);
    expect(state.dailyMissions?.missions[0].current).toBe(1);
    expect(state.dailyMissions?.missions[0].completed).toBe(true);
  });

  it('recordBattleWin increments streak and battle path when not boss', () => {
    useStore.setState({
      currentBattlePath: { battlesWon: 2, nextIsBoss: false },
      battleWinStreak: 4,
    });
    useStore.getState().recordBattleWin();
    const state = useStore.getState();
    expect(state.currentBattlePath.battlesWon).toBe(3);
    expect(state.currentBattlePath.nextIsBoss).toBe(false);
    expect(state.battleWinStreak).toBe(5);
  });

  it('recordBattleWin in boss state unlocks next medal and resets streak/path', () => {
    useStore.setState({
      currentBattlePath: { battlesWon: 15, nextIsBoss: true },
      battleWinStreak: 10,
      medals: [
        { id: 0, name: 'M1', type: 'normal', isUnlocked: true },
        { id: 1, name: 'M2', type: 'normal', isUnlocked: false },
      ] as any,
    });
    useStore.getState().recordBattleWin();
    const state = useStore.getState();
    expect(state.currentBattlePath).toEqual({ battlesWon: 0, nextIsBoss: false });
    expect(state.battleWinStreak).toBe(0);
    expect(state.medals.find((m) => m.id === 1)?.isUnlocked).toBe(true);
    expect(state.pendingMedalUnlock?.id).toBe(1);
  });

  it('confirmEvolution updates pokemon and clears pending evolution', () => {
    const p = makePokemon({ id: 'evo-1', pokemonId: 1, name: 'Bulbasaur' });
    useStore.setState({
      team: [p],
      pendingEvolution: {
        pokemonId: p.id,
        newPokemonId: 2,
        newName: 'Ivysaur',
        newTypes: ['grass', 'poison'],
        newBaseStats: { hp: 60, attack: 62, defense: 63, spAtk: 80, spDef: 80, speed: 60 },
      },
    });
    useStore.getState().confirmEvolution();
    const state = useStore.getState();
    expect(state.team[0].pokemonId).toBe(2);
    expect(state.team[0].name).toBe('Ivysaur');
    expect(state.pendingEvolution).toBeNull();
  });

  it('saveTeamPreset and loadTeamPreset rebuild team/box correctly', () => {
    const p1 = makePokemon({ id: 'g1a', pokemonId: 1, baseSpeciesId: 1 });
    const p2 = makePokemon({ id: 'g1b', pokemonId: 25, baseSpeciesId: 25 });
    const p3 = makePokemon({ id: 'g2a', pokemonId: 152, baseSpeciesId: 152 });
    useStore.setState({ team: [p1], box: [p2, p3] });
    useStore.getState().saveTeamPreset('gen1', [p1.id, p2.id, p3.id]);
    useStore.setState({ team: [p3], box: [p1, p2] });
    useStore.getState().loadTeamPreset('gen1');
    const state = useStore.getState();
    expect(state.team.map((p) => p.id).sort()).toEqual([p1.id, p2.id].sort());
    expect(state.activePresetCategory).toBe('gen1');
    expect(state.box.some((p) => p.id === p3.id)).toBe(true);
  });

  it('startIncubation and hatchEgg complete full flow', async () => {
    const p1 = makePokemon({ id: 'b1', pokemonId: 1, baseSpeciesId: 1 });
    const p2 = makePokemon({ id: 'b2', pokemonId: 2, baseSpeciesId: 1 });
    useStore.setState({ team: [p1, p2], box: [], eggs: [] });
    useStore.getState().startIncubation(p1, p2);
    let state = useStore.getState();
    expect(state.eggs.length).toBe(1);
    const eggId = state.eggs[0].id;
    useStore.setState((s) => ({
      eggs: s.eggs.map((e) => (e.id === eggId ? { ...e, hatchAt: Date.now() - 1 } : e)),
    }));
    await useStore.getState().hatchEgg(eggId);
    state = useStore.getState();
    expect(state.eggs.find((e) => e.id === eggId)).toBeUndefined();
    expect(state.team.length + state.box.length).toBeGreaterThanOrEqual(3);
    const hatched = [...state.team, ...state.box].find((p) => p.caughtAt > p1.caughtAt);
    expect(hatched).toBeTruthy();
    if (hatched) {
      expect(state.pokedex[hatched.pokemonId]).toBe('caught');
    }
  });
});
