import { Pokemon, Move, Item, Medal, GameState, ScreenName, PokemonSpecies, EvolutionChain } from './types';

const BASE_URL = 'https://pokeapi.co/api/v2';
const MAX_CACHE = 200;
const cache = new Map<string, any>();

function cacheSet(key: string, value: any) {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }
  cache.set(key, value);
}

// Helper for rate limiting and delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithCache(url: string) {
  if (cache.has(url)) return cache.get(url);
  
  await delay(100); // Simple rate limiting
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  
  const data = await response.ok ? await response.json() : null;
  if (data) cacheSet(url, data);
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
    const BANNED_MOVES = new Set([
      'protect','detect','endure','quick-guard','wide-guard','substitute','splash','celebrate',
      'hold-hands','kings-shield','spiky-shield','baneful-bunker','mat-block','crafty-shield',
      'confuse-ray','swagger','flatter','supersonic','teeter-dance','attract','captivate',
      'sunny-day','rain-dance','sandstorm','hail','snow',
      'grassy-terrain','misty-terrain','electric-terrain','psychic-terrain','gravity',
      'magic-room','wonder-room','mud-sport','water-sport','trick-room',
      'spikes','stealth-rock','toxic-spikes','sticky-web',
      'whirlwind','roar','circle-throw','dragon-tail','mean-look','block','spider-web',
      'baton-pass','u-turn','volt-switch','parting-shot',
      'reflect','light-screen','aurora-veil','safeguard','mist','tailwind','lucky-chant',
      'healing-wish','lunar-dance','helping-hand','follow-me','rage-powder','spotlight',
      'ally-switch','after-you','quash','aromatherapy',
      'transform','mirror-move','mimic','sketch','copycat','me-first','assist','metronome',
      'sleep-talk','snore','nature-power','instruct','conversion','conversion2','camouflage',
      'magnitude','present','natural-gift','hidden-power','weather-ball','judgment',
      'techno-blast','revelation-dance','wring-out','crush-grip','trump-card','flail',
      'reversal','fury-cutter','rollout','ice-ball','echoed-voice','triple-kick','punishment',
      'stored-power','acrobatics','facade','electrify',
      'grass-knot','low-kick','heavy-slam','heat-crash',
      'sonic-boom','dragon-rage','night-shade','seismic-toss','super-fang','psywave',
      'fissure','guillotine','horn-drill','sheer-cold',
      'self-destruct','explosion','memento','final-gambit','destiny-bond','counter',
      'mirror-coat','metal-burst','bide','focus-punch','shell-trap','endeavor','pain-split',
      'stockpile','swallow','spit-up','future-sight','doom-desire',
      'haze','topsy-turvy','power-trick','power-split','guard-split','power-swap',
      'guard-swap','heart-swap','speed-swap','skill-swap','role-play','entrainment',
      'simple-beam','worry-seed','lock-on','mind-reader','focus-energy','psych-up',
      'taunt','encore','torment','disable','spite','grudge','trick','switcheroo','fling',
      'bestow','embargo','heal-block','perish-song','yawn','imprison',
      'frustration','return','beat-up',
      'leech-seed','ingrain','aqua-ring','curse','nightmare','telekinesis','magnet-rise',
      'autotomize','charge','recycle','belch','false-swipe','wish','struggle',
    ]);

    const levelUpMoves = pokemonData.moves
      .filter((m: any) =>
        !BANNED_MOVES.has(m.move.name) &&
        m.version_group_details.some((v: any) => v.move_learn_method.name === 'level-up' && v.level_learned_at <= level))
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
          meta: moveData.meta,
          statusEffect: (() => { 
            const a = moveData.meta?.ailment?.name; 
            if (!a || a === 'none' || a === 'unknown') return undefined; 
            if (a === 'sleep') return 'SLP' as const; 
            if (a === 'poison' || a === 'bad-poison') return 'PSN' as const; 
            if (a === 'burn') return 'BRN' as const; 
            if (a === 'paralysis') return 'PAR' as const; 
            if (a === 'freeze') return 'FRZ' as const; 
            return undefined; 
          })(), 
          effectChance: (() => { 
            const ac = moveData.meta?.ailment_chance; 
            if (ac && ac > 0) return ac; 
            return moveData.effect_chance ?? undefined; 
          })(), 
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
  async getBaseSpeciesId(speciesData: any): Promise<number> {
    try {
      const chain = await this.getEvolutionChain(speciesData.evolution_chain.url);
      // La forma base è sempre il primo nodo della catena 
      const baseName = chain.chain.species.name;
      const basePokemon = await this.getPokemon(baseName);
      return basePokemon.id;
    } catch {
      return speciesData.id; // fallback: usa l'id corrente 
    }
  },

  async getEvolutionTarget(speciesData: any, currentLevel: number): Promise<{ newId: number; newName: string } | null> {
    try {
      const chain = await this.getEvolutionChain(speciesData.evolution_chain.url);
      
      // Percorri la catena cercando il nodo con species.name === speciesData.name
      let currentNode = chain.chain;
      const findNode = (node: any, targetName: string): any => {
        if (node.species.name === targetName) return node;
        for (const nextNode of node.evolves_to) {
          const found = findNode(nextNode, targetName);
          if (found) return found;
        }
        return null;
      };

      const node = findNode(currentNode, speciesData.name);
      if (!node || !node.evolves_to || node.evolves_to.length === 0) return null;

      // Se quel nodo ha evolves_to con almeno un elemento, prendi il primo
      const evolution = node.evolves_to[0];
      const details = evolution.evolution_details[0];

      // Requisiti per l'evoluzione
      const meetsRequirements = () => {
        if (!details) return false;
        
        // Evoluzione per Livello
        if (details.trigger.name === 'level-up') {
          if (details.min_level !== null && currentLevel >= details.min_level) return true;
        }
        
        // Evoluzione per Scambio (la trasformiamo in evoluzione per livello alto, es. 36)
        if (details.trigger.name === 'trade') {
          if (currentLevel >= 36) return true;
        }

        return false;
      };

      if (meetsRequirements()) {
        const nextPokemon = await this.getPokemon(evolution.species.name);
        const nextSpecies = await this.getSpecies(evolution.species.name);
        return {
          newId: nextPokemon.id,
          newName: this.getItalianName(nextSpecies.names)
        };
      }

      return null;
    } catch (e) {
      console.error("Error in getEvolutionTarget:", e);
      return null;
    }
  },

  async getEvolutionByItem(speciesData: any, itemName: string): Promise<{ newId: number; newName: string } | null> {
    try {
      const chain = await this.getEvolutionChain(speciesData.evolution_chain.url);
      
      let currentNode = chain.chain;
      const findNode = (node: any, targetName: string): any => {
        if (node.species.name === targetName) return node;
        for (const nextNode of node.evolves_to) {
          const found = findNode(nextNode, targetName);
          if (found) return found;
        }
        return null;
      };

      const node = findNode(currentNode, speciesData.name);
      if (!node || !node.evolves_to || node.evolves_to.length === 0) return null;

      // Cerca tra le evoluzioni possibili quella che richiede l'item
      for (const evolution of node.evolves_to) {
        const details = evolution.evolution_details.find((d: any) => 
          d.trigger.name === 'use-item' && d.item?.name === itemName
        );

        if (details) {
          const nextPokemon = await this.getPokemon(evolution.species.name);
          const nextSpecies = await this.getSpecies(evolution.species.name);
          return {
            newId: nextPokemon.id,
            newName: this.getItalianName(nextSpecies.names)
          };
        }
      }

      return null;
    } catch (e) {
      console.error("Error in getEvolutionByItem:", e);
      return null;
    }
  },

  async getMovesLearnedAtLevel(pokemonData: any, level: number): Promise<Move[]> {
    const candidateMove = pokemonData.moves.find((m: any) =>
      m.version_group_details.some((v: any) => v.move_learn_method.name === 'level-up' && v.level_learned_at === level)
    );

    if (!candidateMove) return [];

    try {
      const moveData = await this.getMove(candidateMove.move.name);
      if (!moveData) return [];

      return [{
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
        meta: moveData.meta,
        statusEffect: (() => { 
          const ailment = moveData.meta?.ailment?.name; 
          if (!ailment || ailment === 'none' || ailment === 'unknown') return undefined; 
          if (ailment === 'sleep') return 'SLP'; 
          if (ailment === 'poison' || ailment === 'bad-poison') return 'PSN'; 
          if (ailment === 'burn') return 'BRN'; 
          if (ailment === 'paralysis') return 'PAR'; 
          if (ailment === 'freeze') return 'FRZ'; 
          return undefined; 
        })(), 
        effectChance: moveData.meta?.ailment_chance > 0 
          ? moveData.meta.ailment_chance 
          : (moveData.effect_chance ?? undefined),
      }];
    } catch (e) {
      console.error(`Error fetching move ${candidateMove.move.name}:`, e);
      return [];
    }
  },

  getItalianDescription(entries: any[]): string {
    const itEntry = entries.find((e: any) => e.language.name === 'it');
    return itEntry ? (itEntry.flavor_text || itEntry.description || itEntry.text) : entries.find((e: any) => e.language.name === 'en')?.flavor_text || 'Nessuna descrizione disponibile.';
  }
};
