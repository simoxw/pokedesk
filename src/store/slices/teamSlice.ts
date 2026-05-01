import { StateCreator } from 'zustand';
import { GameStore } from '../types';
import { GEN_RANGES, LEGENDARY_IDS } from '../../data/legendaryIds';
import { generateGenChallenges } from './missionSlice';

export type TeamSlice = Pick<
  GameStore,
  | 'team'
  | 'box'
  | 'favorites'
  | 'teamPresets'
  | 'addToTeam'
  | 'removeFromTeam'
  | 'reorderTeam'
  | 'toggleFavorite'
  | 'removePokemon'
  | 'saveTeamPreset'
  | 'loadTeamPreset'
  | 'deleteTeamPreset'
>;

export const createTeamSlice: StateCreator<GameStore, [], [], TeamSlice> = (set) => ({
  team: [],
  box: [],
  favorites: [],
  teamPresets: {},
  addToTeam: (pokemon, index) =>
    set((state) => {
      if (index < 0 || index >= 6) return {};
      const newTeam = [...state.team];
      newTeam[index] = pokemon;
      return {
        team: newTeam,
        box: state.box.filter((p) => p.id !== pokemon.id),
      };
    }),
  removeFromTeam: (index) =>
    set((state) => {
      if (index < 0 || index >= state.team.length) return {};
      return {
        team: state.team.filter((_, i) => i !== index),
        box: [...state.box, state.team[index]],
      };
    }),
  reorderTeam: (oldIndex, newIndex) =>
    set((state) => {
      const newTeam = [...state.team];
      const [movedPokemon] = newTeam.splice(oldIndex, 1);
      newTeam.splice(newIndex, 0, movedPokemon);
      return { team: newTeam };
    }),
  toggleFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((fid) => fid !== id)
        : [...state.favorites, id],
    })),
  removePokemon: (id) =>
    set((state) => ({
      team: state.team.filter((p) => p.id !== id),
      box: state.box.filter((p) => p.id !== id),
    })),
  saveTeamPreset: (category, pokemonIds) =>
    set((state) => {
      const ownedById = new Map([...state.team, ...state.box].map((p) => [p.id, p]));
      const isValidForCategory = (pokemon: (typeof state.team)[number]) => {
        if (category === 'favorite') return true;
        if (category === 'legendary') return LEGENDARY_IDS.has(pokemon.pokemonId);
        if (category === 'regional') return pokemon.pokemonId > 10000;
        const range = GEN_RANGES[category];
        if (!range) return true;
        return pokemon.pokemonId >= range[0] && pokemon.pokemonId <= range[1] && !LEGENDARY_IDS.has(pokemon.pokemonId);
      };
      const uniqueIds = [...new Set(pokemonIds)];
      const validatedIds = uniqueIds
        .map((id) => ownedById.get(id))
        .filter((p): p is (typeof state.team)[number] => Boolean(p))
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
          },
        },
      };
    }),
  loadTeamPreset: (category) =>
    set((state) => {
      const preset = state.teamPresets[category];
      if (!preset) return {};
      const allPokemon = [...state.team, ...state.box];
      const byId = new Map(allPokemon.map((p) => [p.id, p]));
      const validPokemon = [...new Set(preset.pokemonIds)]
        .map((id) => byId.get(id))
        .filter((p): p is (typeof state.team)[number] => Boolean(p))
        .slice(0, 4);
      if (validPokemon.length === 0) return {};
      const teamIds = new Set(validPokemon.map((p) => p.id));
      const newBox = allPokemon.filter((p) => !teamIds.has(p.id));
      return {
        team: validPokemon,
        box: newBox,
        activePresetCategory: category,
        genChallenges:
          state.genChallenges?.date === new Date().toISOString().split('T')[0] && state.genChallenges?.category === category
            ? state.genChallenges
            : generateGenChallenges(category),
      };
    }),
  deleteTeamPreset: (category) =>
    set((state) => {
      const next = { ...state.teamPresets };
      delete next[category];
      return { teamPresets: next };
    }),
});
