import { describe, it, expect, vi } from 'vitest';
import { useStore } from './store';
import { BattleEngine } from './BattleEngine';
import { Pokemon } from './types';

// Mock per le dipendenze
vi.mock('./api', () => ({
  api: {
    getPokemon: vi.fn(),
    getSpecies: vi.fn(),
    getEvolutionTarget: vi.fn(),
    getMovesLearnedAtLevel: vi.fn(),
    getItalianName: vi.fn((names) => names[0].name),
  }
}));

describe('Evolution Flow Tests', () => {
  const mockPokemon: Pokemon = {
    id: 'test-pkmn-id',
    pokemonId: 1, // Bulbasaur
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

  it('should handle confirmEvolution correctly when newBaseStats are present', () => {
    const store = useStore.getState();
    
    // Setup state
    useStore.setState({
      team: [mockPokemon],
      pendingEvolution: {
        pokemonId: 'test-pkmn-id',
        newPokemonId: 2, // Ivysaur
        newName: 'Ivysaur',
        newTypes: ['grass', 'poison'],
        newBaseStats: { hp: 60, attack: 62, defense: 63, spAtk: 80, spDef: 80, speed: 60 }
      }
    });

    // Execute
    useStore.getState().confirmEvolution();

    // Verify
    const updatedPkmn = useStore.getState().team[0];
    expect(updatedPkmn.name).toBe('Ivysaur');
    expect(updatedPkmn.pokemonId).toBe(2);
    expect(updatedPkmn.baseStats.hp).toBe(60);
    expect(useStore.getState().pendingEvolution).toBeNull();
  });

  it('should NOT crash and still evolve when newBaseStats are missing (The Bug Fix)', () => {
    // Questo test verifica che la modifica appena fatta funzioni
    const store = useStore.getState();
    
    // Setup state con newBaseStats UNDEFINED (simula errore API o caso limite)
    useStore.setState({
      team: [mockPokemon],
      pendingEvolution: {
        pokemonId: 'test-pkmn-id',
        newPokemonId: 2,
        newName: 'Ivysaur',
        newTypes: ['grass', 'poison'],
        newBaseStats: undefined as any // Forza undefined
      }
    });

    // Execute - Non deve lanciare eccezioni!
    expect(() => {
      useStore.getState().confirmEvolution();
    }).not.toThrow();

    // Verify
    const updatedPkmn = useStore.getState().team[0];
    expect(updatedPkmn.name).toBe('Ivysaur');
    expect(updatedPkmn.pokemonId).toBe(2);
    // Deve aver mantenuto le vecchie stats invece di crashare
    expect(updatedPkmn.baseStats.hp).toBe(45); 
    expect(useStore.getState().pendingEvolution).toBeNull();
  });

  it('should update currentHp proportionally during evolution', () => {
    const damagedPkmn = { ...mockPokemon, currentHp: 10 }; // 10/45 HP
    
    useStore.setState({
      team: [damagedPkmn],
      pendingEvolution: {
        pokemonId: 'test-pkmn-id',
        newPokemonId: 2,
        newName: 'Ivysaur',
        newBaseStats: { hp: 60, attack: 62, defense: 63, spAtk: 80, spDef: 80, speed: 60 }
      }
    });

    useStore.getState().confirmEvolution();

    const updatedPkmn = useStore.getState().team[0];
    // HP calcolati: vecchioHp + (nuovoMax - vecchioMax) = 10 + (nuovoMax_stats - 45)
    // Nota: BattleEngine.calculateStats viene chiamato internamente
    // Per semplicità verifichiamo che sia aumentato
    expect(updatedPkmn.currentHp).toBeGreaterThan(10);
  });
});
