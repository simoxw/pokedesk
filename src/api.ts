import { Pokemon, Move, Item, Medal, GameState, ScreenName, PokemonSpecies, EvolutionChain } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2';
const cache = new Map<string, any>();

// Helper for rate limiting and delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithCache(url: string) {
  if (cache.has(url)) return cache.get(url);
  
  await delay(100); // Simple rate limiting
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  
  const data = await response.ok ? await response.json() : null;
  if (data) cache.set(url, data);
  return data;
}

export const api = {
  async getPokemon(id: number | string): Promise<any> {
    return fetchWithCache(`${BASE_URL}/pokemon/${id}`);
  },

  async getSpecies(id: number | string): Promise<any> {
    return fetchWithCache(`${BASE_URL}/pokemon-species/${id}`);
  },

  async getMove(id: number | string): Promise<any> {
    return fetchWithCache(`${BASE_URL}/move/${id}`);
  },

  async getEvolutionChain(url: string): Promise<any> {
    return fetchWithCache(url);
  },

  async getType(id: number | string): Promise<any> {
    return fetchWithCache(`${BASE_URL}/type/${id}`);
  },

  async getPokemonMoves(pokemonData: any, level: number): Promise<Move[]> {
    // Filter moves by level-up and current level
    // We try to get moves from the most recent version group if possible, or just any level-up move
    const levelUpMoves = pokemonData.moves
      .filter((m: any) => m.version_group_details.some((v: any) => v.move_learn_method.name === 'level-up' && v.level_learned_at <= level))
      .map((m: any) => {
        const detail = m.version_group_details.find((v: any) => v.move_learn_method.name === 'level-up' && v.level_learned_at <= level);
        return {
          name: m.move.name,
          level: detail ? detail.level_learned_at : 0
        };
      })
      .sort((a: any, b: any) => b.level - a.level) // Get highest level moves first
      .slice(0, 4);

    const moves: Move[] = [];
    for (const m of levelUpMoves) {
      try {
        const moveData = await this.getMove(m.name);
        if (!moveData) continue;
        
        moves.push({
          id: moveData.id.toString(),
          name: this.getItalianName(moveData.names),
          type: moveData.type.name,
          power: moveData.power || 0,
          accuracy: moveData.accuracy || 100,
          pp: moveData.pp,
          maxPp: moveData.pp,
          priority: moveData.priority || 0,
          category: moveData.damage_class.name as any,
          description: this.getItalianDescription(moveData.flavor_text_entries),
        });
      } catch (e) {
        console.error(`Error fetching move ${m.name}:`, e);
      }
    }

    // Fallback if no moves found (shouldn't happen for most pokemon, but just in case)
    if (moves.length === 0) {
      moves.push({
        id: '1',
        name: 'Scontro',
        type: 'normal',
        power: 50,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
        priority: 0,
        category: 'physical',
        description: 'Un attacco fisico standard.',
      });
    }

    return moves;
  },

  // Localized name helper
  getItalianName(names: any[]): string {
    const itName = names.find((n: any) => n.language.name === 'it');
    return itName ? itName.name : names.find((n: any) => n.language.name === 'en')?.name || '???';
  },

  // Localized description helper
  getItalianDescription(entries: any[]): string {
    const itEntry = entries.find((e: any) => e.language.name === 'it');
    return itEntry ? (itEntry.flavor_text || itEntry.description || itEntry.text) : entries.find((e: any) => e.language.name === 'en')?.flavor_text || 'Nessuna descrizione disponibile.';
  }
};
