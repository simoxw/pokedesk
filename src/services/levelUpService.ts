import { api } from '../api';
import { GameState, Move, Pokemon, PokemonType, Stats } from '../types';

export interface GameStoreRef {
  updatePokemon: (id: string, updates: Partial<Pokemon>) => void;
  pendingEvolution: GameState['pendingEvolution'];
  pendingNewMoveQueue: GameState['pendingNewMoveQueue'];
}

export async function checkLevelUp(
  pokemon: Pokemon,
  newLevel: number,
  currentMoves: Move[],
  getStore: () => Pick<GameStoreRef, 'updatePokemon' | 'pendingEvolution' | 'pendingNewMoveQueue'>,
  setStore: (partial: Partial<GameState>) => void
): Promise<void> {
  try {
    // Mega e forme speciali (pokemonId > 10000 con ID nella lista mega) non evolvono mai
    const { MEGA_IDS } = await import('../data/legendaryIds');
    if (MEGA_IDS.has(pokemon.pokemonId)) return;

    const pokemonData = await api.getPokemon(pokemon.pokemonId);
    const speciesData = await api.getSpecies(pokemon.pokemonId);

    // Moves check - loop through each level gained
    let updatedMoves = [...currentMoves];
    for (let lvl = pokemon.level + 1; lvl <= newLevel; lvl++) {
      const learnedMoves = await api.getMovesLearnedAtLevel(pokemonData, lvl);
      
      for (const newMove of learnedMoves) {
        const alreadyHas = updatedMoves.some((m) => m.id === newMove.id);
        if (!alreadyHas) {
          if (updatedMoves.length < 4) {
            updatedMoves.push(newMove);
            getStore().updatePokemon(pokemon.id, { moves: [...updatedMoves] });
          } else {
            // If we have 4 moves, add to pending queue
            setStore({ 
              pendingNewMoveQueue: [
                ...(getStore().pendingNewMoveQueue || []), 
                { pokemonId: pokemon.id, move: newMove }
              ] 
            });
          }
        }
      }
    }

    // Forme regionali (pokemonId > 10000): usa tabella dedicata invece della chain API
    // La chain API restituirebbe la forma base (es. Raticate normale invece di Raticate-Alola)
    let evolution = null;
    if (pokemon.pokemonId > 10000) {
      try {
        const { REGIONAL_LEVEL_EVOLUTIONS } = await import('../data/regionalForms');
        const rawData = await api.getPokemon(pokemon.pokemonId);
        const regionalEvo = REGIONAL_LEVEL_EVOLUTIONS[rawData.name];
        if (regionalEvo && newLevel >= regionalEvo.minLevel) {
          const evoData = await api.getPokemon(regionalEvo.targetSlug);
          const evoSpecies = await api.getSpecies(evoData.id);
          evolution = {
            newId: evoData.id,
            newName: api.getItalianName(evoSpecies.names),
          };
        }
      } catch {
        // Fail silenzioso: nessuna evoluzione se l'API fallisce
      }
    } else {
      evolution = await api.getEvolutionTarget(speciesData, newLevel);
    }
    if (evolution && !getStore().pendingEvolution) {
      try {
        const newPokemonData = await api.getPokemon(evolution.newId);
        const newTypes = newPokemonData.types.map((t: any) => t.type.name) as PokemonType[];
        const newBaseStats: Stats = {
          hp: newPokemonData.stats[0].base_stat,
          attack: newPokemonData.stats[1].base_stat,
          defense: newPokemonData.stats[2].base_stat,
          spAtk: newPokemonData.stats[3].base_stat,
          spDef: newPokemonData.stats[4].base_stat,
          speed: newPokemonData.stats[5].base_stat,
        };
        setStore({ 
          pendingEvolution: { 
            pokemonId: pokemon.id, 
            newPokemonId: evolution.newId, 
            newName: evolution.newName, 
            newTypes, 
            newBaseStats 
          } 
        });
      } catch {
        setStore({ 
          pendingEvolution: { 
            pokemonId: pokemon.id, 
            newPokemonId: evolution.newId, 
            newName: evolution.newName 
          } 
        });
      }
    }
  } catch (e) {
    console.error("Error checking for evolution/moves:", e);
  }
}
