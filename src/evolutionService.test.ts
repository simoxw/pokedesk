import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { checkLevelUp } from './services/levelUpService';
import type { Pokemon } from './types';

const mockPokemon: Pokemon = {
  id: 'test-pkmn',
  pokemonId: 1,
  name: 'Bulbasaur',
  level: 15,
  exp: 0,
  types: ['grass', 'poison'],
  stats: { hp: 45, attack: 49, defense: 49, spAtk: 65, spDef: 65, speed: 45 },
  baseStats: { hp: 45, attack: 49, defense: 49, spAtk: 65, spDef: 65, speed: 45 },
  ivs: { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
  evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
  nature: 'Quirky',
  moves: [],
  currentHp: 45,
  status: null,
  isShiny: false,
  caughtAt: Date.now(),
  growthRate: 'medium',
  baseSpeciesId: 1,
};

describe('Evolution and regional evolution service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it('getEvolutionTarget returns next evolution when level requirement is met', async () => {
    const chain = {
      chain: {
        species: { name: 'bulbasaur' },
        evolves_to: [
          {
            species: { name: 'ivysaur' },
            evolution_details: [
              { trigger: { name: 'level-up' }, min_level: 16 }
            ],
            evolves_to: []
          }
        ]
      }
    };

    vi.spyOn(api, 'getEvolutionChain').mockResolvedValue(chain as any);
    vi.spyOn(api, 'getPokemon').mockImplementation(async (query: any) => {
      if (query === 'ivysaur') return { id: 2, stats: [] } as any;
      return null as any;
    });
    vi.spyOn(api, 'getSpecies').mockResolvedValue({ names: [{ name: 'Ivysaur', language: { name: 'en' } }] } as any);

    const result = await api.getEvolutionTarget({ name: 'bulbasaur', evolution_chain: { url: 'chain' } } as any, 16);
    expect(result).toEqual({ newId: 2, newName: 'Ivysaur' });
  });

  it('getEvolutionByItem resolves regional stone evolution for regional forms', async () => {
    const currentPkm = { name: 'sandshrew-alola' } as any;
    const nextPkm = {
      id: 10011,
      name: 'sandslash-alola',
      stats: [
        { stat: { name: 'hp' }, base_stat: 75 },
        { stat: { name: 'attack' }, base_stat: 100 },
        { stat: { name: 'defense' }, base_stat: 110 },
        { stat: { name: 'special-attack' }, base_stat: 45 },
        { stat: { name: 'special-defense' }, base_stat: 55 },
        { stat: { name: 'speed' }, base_stat: 65 },
      ],
      types: [{ type: { name: 'ice' } }, { type: { name: 'ground' } }],
    } as any;

    vi.spyOn(api, 'getPokemon').mockImplementation(async (query: any) => {
      if (query === 10010) return currentPkm;
      if (query === 'sandslash-alola') return nextPkm;
      return null as any;
    });
    vi.spyOn(api, 'getSpecies').mockResolvedValue({ names: [{ name: 'Sandslash-Alola', language: { name: 'en' } }] } as any);

    const result = await api.getEvolutionByItem({ id: 10010 } as any, 'ice-stone', 10010);

    expect(result).toEqual({
      newId: 10011,
      newName: 'Sandslash-Alola',
      newBaseStats: {
        hp: 75,
        attack: 100,
        defense: 110,
        spAtk: 45,
        spDef: 55,
        speed: 65,
      },
      newTypes: ['ice', 'ground'],
    });
  });

  it('checkLevelUp sets pendingEvolution on normal level-up evolution', async () => {
    const updatePokemon = vi.fn();
    const setStore = vi.fn();

    vi.spyOn(api, 'getPokemon').mockResolvedValue({ stats: [], types: [] } as any);
    vi.spyOn(api, 'getSpecies').mockResolvedValue({ names: [{ name: 'Bulbasaur', language: { name: 'en' } }], evolution_chain: { url: 'chain' } } as any);
    vi.spyOn(api, 'getMovesLearnedAtLevel').mockResolvedValue([] as any);
    vi.spyOn(api, 'getEvolutionTarget').mockResolvedValue({ newId: 2, newName: 'Ivysaur' } as any);

    await checkLevelUp(
      mockPokemon,
      16,
      [],
      () => ({ updatePokemon, pendingEvolution: null, pendingNewMoveQueue: [] }),
      setStore
    );

    expect(setStore).toHaveBeenCalledWith(expect.objectContaining({
      pendingEvolution: expect.objectContaining({ newPokemonId: 2, newName: 'Ivysaur' })
    }));
  });

  it('checkLevelUp does not call getEvolutionTarget for regional forms that evolve via level lookup', async () => {
    const updatePokemon = vi.fn();
    const setStore = vi.fn();
    const regionalPokemon = { ...mockPokemon, pokemonId: 10010 };

    vi.spyOn(api, 'getPokemon').mockResolvedValue({ stats: [], types: [] } as any);
    vi.spyOn(api, 'getSpecies').mockResolvedValue({ names: [{ name: 'Sandshrew-Alola', language: { name: 'en' } }], evolution_chain: { url: 'chain' } } as any);
    vi.spyOn(api, 'getMovesLearnedAtLevel').mockResolvedValue([] as any);
    const evolutionSpy = vi.spyOn(api, 'getEvolutionTarget');

    await checkLevelUp(
      regionalPokemon,
      16,
      [],
      () => ({ updatePokemon, pendingEvolution: null, pendingNewMoveQueue: [] }),
      setStore
    );

    expect(evolutionSpy).not.toHaveBeenCalled();
    expect(setStore).not.toHaveBeenCalledWith(expect.objectContaining({ pendingEvolution: expect.anything() }));
  });

  it('checkLevelUp queues evolution for regional forms with a level evolution trigger', async () => {
    const updatePokemon = vi.fn();
    const setStore = vi.fn();
    const regionalPokemon = { ...mockPokemon, pokemonId: 10022, name: 'Darumaka-Galar' };
    const nextPokemon = { id: 10023, stats: [], types: [] } as any;

    vi.spyOn(api, 'getPokemon').mockImplementation(async (query: any) => {
      if (query === 10022) return { name: 'darumaka-galar', stats: [], types: [] } as any;
      if (query === 'darmanitan-galar-standard') return nextPokemon;
      return null as any;
    });
    vi.spyOn(api, 'getSpecies').mockResolvedValue({ names: [{ name: 'Darmanitan-Galar', language: { name: 'en' } }] } as any);
    vi.spyOn(api, 'getMovesLearnedAtLevel').mockResolvedValue([] as any);
    const evolutionSpy = vi.spyOn(api, 'getEvolutionTarget');

    await checkLevelUp(
      regionalPokemon,
      35,
      [],
      () => ({ updatePokemon, pendingEvolution: null, pendingNewMoveQueue: [] }),
      setStore
    );

    expect(evolutionSpy).not.toHaveBeenCalled();
    expect(setStore).toHaveBeenCalledWith(expect.objectContaining({ pendingEvolution: expect.objectContaining({ newPokemonId: 10023, newName: 'Darmanitan-Galar' }) }));
  });
});
