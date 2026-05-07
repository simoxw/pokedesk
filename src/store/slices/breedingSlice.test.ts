import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../index';
import type { Pokemon } from '../../types';
import { api } from '../../api';

vi.mock('../../api', () => ({
  api: {
    getPokemon: vi.fn(),
    getSpecies: vi.fn(),
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

describe('Breeding Logic Tests (Regional & Mega)', () => {
  beforeEach(() => {
    useStore.getState().resetGame();
    vi.clearAllMocks();
  });

  it('should correctly handle Regional Forms in breeding', async () => {
    // 1. Setup: Vulpix Alola (ID > 10000)
    const vulpixAlola = makePokemon({
      pokemonId: 10103, // ID fittizio > 10000
      name: 'Vulpix-Alola',
      baseSpeciesId: 37, // Vulpix base
      types: ['ice'],
    });
    const ditto = makePokemon({ pokemonId: 132, name: 'Ditto', baseSpeciesId: 132 });

    // 2. Start Incubation
    useStore.getState().startIncubation(vulpixAlola, ditto);
    
    const state = useStore.getState();
    const egg = state.eggs[0];

    expect(egg).toBeDefined();
    expect(egg.pokemonName).toBe('Vulpix-Alola');
    expect(egg.regionalSlug).toBe('vulpix-alola'); // Dovrebbe trovarlo in REGIONAL_FORMS
    expect(egg.basePokemonId).toBe(37);

    // 3. Hatch Egg
    // Mock API responses for hatch
    vi.spyOn(api, 'getPokemon').mockImplementation(async (id: any) => {
      if (id === 'vulpix-alola') {
        return {
          id: 10103,
          stats: Array(6).fill({ base_stat: 50 }),
          types: [{ type: { name: 'ice' } }],
        };
      }
      return {
        id: 37,
        stats: Array(6).fill({ base_stat: 40 }),
        types: [{ type: { name: 'fire' } }],
      };
    });
    vi.spyOn(api, 'getSpecies').mockResolvedValue({
      names: [{ name: 'Vulpix' }],
      growth_rate: { name: 'medium' },
    });

    // Fast-forward time
    useStore.setState({
      eggs: state.eggs.map(e => ({ ...e, hatchAt: Date.now() - 1000 }))
    });

    await useStore.getState().hatchEgg(egg.id);

    const newState = useStore.getState();
    const hatched = newState.team[0]; // Poiché il team era vuoto

    expect(hatched.pokemonId).toBe(10103); // È nato un Vulpix Alola!
    expect(hatched.types).toContain('ice');
    expect(hatched.name).toBe('Vulpix');
  });

  it('should correctly handle Mega Evolutions in breeding (should hatch base form)', async () => {
    // 1. Setup: Mega Kangaskhan (ID > 10000)
    const megaKangaskhan = makePokemon({
      pokemonId: 10039, // ID fittizio > 10000
      name: 'Mega Kangaskhan',
      baseSpeciesId: 115, // Kangaskhan base
      types: ['normal'],
    });
    const ditto = makePokemon({ pokemonId: 132, name: 'Ditto', baseSpeciesId: 132 });

    // 2. Start Incubation
    useStore.getState().startIncubation(megaKangaskhan, ditto);
    
    const state = useStore.getState();
    const egg = state.eggs[0];

    expect(egg).toBeDefined();
    expect(egg.pokemonName).toBe('Mega Kangaskhan');
    expect(egg.regionalSlug).toBeUndefined(); // Le mega NON sono regionali
    expect(egg.basePokemonId).toBe(115);

    // 3. Hatch Egg
    // Mock API responses for hatch
    vi.spyOn(api, 'getPokemon').mockImplementation(async (id: any) => {
      return {
        id: 115, // Deve tornare la forma base
        stats: Array(6).fill({ base_stat: 105 }),
        types: [{ type: { name: 'normal' } }],
      };
    });
    vi.spyOn(api, 'getSpecies').mockResolvedValue({
      names: [{ name: 'Kangaskhan' }],
      growth_rate: { name: 'medium' },
    });

    // Fast-forward time
    useStore.setState({
      eggs: state.eggs.map(e => ({ ...e, hatchAt: Date.now() - 1000 }))
    });

    await useStore.getState().hatchEgg(egg.id);

    const newState = useStore.getState();
    const hatched = newState.team[0];

    expect(hatched.pokemonId).toBe(115); // È nato un Kangaskhan normale!
    expect(hatched.name).toBe('Kangaskhan');
  });

  it('should correctly handle normal Pokemon breeding', async () => {
    const bulbasaur = makePokemon({ pokemonId: 1, name: 'Bulbasaur', baseSpeciesId: 1 });
    const ditto = makePokemon({ pokemonId: 132, name: 'Ditto', baseSpeciesId: 132 });

    useStore.getState().startIncubation(bulbasaur, ditto);
    const egg = useStore.getState().eggs[0];

    expect(egg.regionalSlug).toBeUndefined();
    expect(egg.basePokemonId).toBe(1);

    vi.spyOn(api, 'getPokemon').mockResolvedValue({
      id: 1,
      stats: Array(6).fill({ base_stat: 45 }),
      types: [{ type: { name: 'grass' } }],
    });
    vi.spyOn(api, 'getSpecies').mockResolvedValue({
      names: [{ name: 'Bulbasaur' }],
      growth_rate: { name: 'medium' },
    });

    useStore.setState({
      eggs: [{ ...egg, hatchAt: Date.now() - 1000 }]
    });

    await useStore.getState().hatchEgg(egg.id);

    const hatched = useStore.getState().team[0];
    expect(hatched.pokemonId).toBe(1);
    expect(hatched.name).toBe('Bulbasaur');
  });

  it('should inherit best IVs from parents', () => {
    const p1 = makePokemon({ ivs: { hp: 31, attack: 10, defense: 10, spAtk: 10, spDef: 10, speed: 10 } });
    const p2 = makePokemon({ ivs: { hp: 10, attack: 31, defense: 10, spAtk: 10, spDef: 10, speed: 10 } });

    useStore.getState().startIncubation(p1, p2);
    const egg = useStore.getState().eggs[0];

    expect(egg.ivs.hp).toBe(31);
    expect(egg.ivs.attack).toBe(31);
    expect(egg.ivs.defense).toBe(10);
  });
});
