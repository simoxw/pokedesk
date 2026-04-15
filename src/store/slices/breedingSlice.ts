import { StateCreator } from 'zustand';
import { api } from '../../api';
import { BattleEngine } from '../../BattleEngine';
import { CatchEngine } from '../../CatchEngine';
import { Egg, GameStore, Pokemon } from '../types';

export type BreedingSlice = Pick<
  GameStore,
  'eggs' | 'startIncubation' | 'hatchEgg'
>;

export const createBreedingSlice: StateCreator<GameStore, [], [], BreedingSlice> = (set, get) => ({
  eggs: [],
  startIncubation: (p1, p2) =>
    set((state) => {
      if (state.eggs.length >= 4) return {};
      const isDitto = (p: Pokemon) => p.pokemonId === 132;
      const compatible = isDitto(p1) || isDitto(p2) || (p1.baseSpeciesId === p2.baseSpeciesId && p1.id !== p2.id);
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
        hatchAt: now + 48 * 3600000,
        ivs: bestIvs,
        nature: CatchEngine.getNature(),
        isShiny: false,
      };
      return { eggs: [...state.eggs, egg] };
    }),
  hatchEgg: async (eggId) => {
    const state = get();
    const egg = state.eggs.find((e) => e.id === eggId);
    if (!egg || Date.now() < egg.hatchAt) return;

    try {
      const pokemonData = await api.getPokemon(egg.basePokemonId);
      const speciesData = await api.getSpecies(egg.basePokemonId);
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

      set((s) => ({
        eggs: s.eggs.filter((e) => e.id !== eggId),
        team: s.team.length < 4 ? [...s.team, newPokemon] : s.team,
        box: s.team.length >= 4 ? [...s.box, newPokemon] : s.box,
        stats: {
          ...s.stats,
          totalCaught: s.stats.totalCaught + 1,
        },
      }));
      get().updatePokedex(newPokemon.pokemonId, 'caught', newPokemon.types[0]);
      const currentBreed = get().achievements.find((a) => a.id === 'breed_10')?.progress ?? 0;
      get().updateAchievementProgress('breed_10', currentBreed + 1);
    } catch (e) {
      console.error('Failed to hatch egg:', e);
    }
  },
});
