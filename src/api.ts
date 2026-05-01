import { Pokemon, Move, Item, Medal, GameState, ScreenName, PokemonSpecies, EvolutionChain } from './types';
import { apiCache } from './lib/apiCache';

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

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 500;

async function fetchWithCache(url: string): Promise<any> {
  if (cache.has(url)) return cache.get(url);

  const cached = await apiCache.get<any>(url);
  if (cached !== undefined) {
    cacheSet(url, cached);
    return cached;
  }

  if (!navigator.onLine) {
    throw new Error('OFFLINE');
  }

  await delay(100);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (import.meta.env.DEV) console.debug(`[API] Fetching: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        // 404 non serve ritentare
        if (response.status === 404) throw new Error(`NOT_FOUND:${url}`);
        throw new Error(`API_ERROR:${response.status}`);
      }
      const data = await response.json();
      if (data) {
        cacheSet(url, data);
        apiCache.set(url, data).catch(() => undefined);
        if (import.meta.env.DEV) console.debug(`[API] Success: ${url}`);
      }
      return data;
    } catch (err: any) {
      lastError = err;
      // Non ritentare se 404 o offline
      if (err.message?.startsWith('NOT_FOUND') || err.message === 'OFFLINE') throw err;
      // Backoff esponenziale: 500ms, 1000ms, 2000ms
      if (attempt < MAX_RETRIES - 1) await delay(RETRY_BASE_DELAY * Math.pow(2, attempt));
    }
  }
  throw lastError ?? new Error('UNKNOWN_API_ERROR');
}

export const api = {
  async getPokemon(id: number | string): Promise<any> {
    return fetchWithCache(`${BASE_URL}/pokemon/${id}`);
  },

  async getSpecies(id: number | string): Promise<any> {
    // Forme regionali (id > 10000) condividono la species con la forma base.
    // Non esiste /pokemon-species/10091, serve usare l'URL dalla risposta pokemon.
    if (typeof id === 'number' && id > 10000) {
      const pokemonData = await this.getPokemon(id);
      return fetchWithCache(pokemonData.species.url);
    }
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
      'autotomize','charge','recycle','belch','false-swipe','wish','struggle', 'teleport',
      'self-destruct', 'explosion', 'wide-guard', 'quick-guard',
    ]);

    const SELF_DROP_MOVE_IDS = new Set(['276', '315', '354', '370', '434', '437', '557', '620', '705']);

    const cacheKey = `pokemon-moves:${pokemonData.id ?? pokemonData.name}:${level}`;
    const cachedMoves = await apiCache.get<Move[]>(cacheKey);
    if (cachedMoves !== undefined) {
      return cachedMoves;
    }

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
        
        if (SELF_DROP_MOVE_IDS.has(moveData.id.toString())) {
          moveData.meta = { ...moveData.meta, stat_chance: 0 };
        }
        
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
          target: moveData.target?.name,
          stat_changes: moveData.stat_changes ?? [],
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

    await apiCache.set(cacheKey, moves);
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
          // Amicizia e altri trigger level-up senza min_level → livello 30
          if (details.min_level === null && currentLevel >= 30) return true;
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

  async getEvolutionByItem(speciesData: any, itemName: string, pokemonFormId?: number): Promise<{ 
    newId: number; 
    newName: string;
    newBaseStats?: any;
    newTypes?: string[];
  } | null> {
    try {
      // Override per forme regionali con evoluzioni via pietra
      if (pokemonFormId && pokemonFormId > 10000) {
        const { REGIONAL_STONE_EVOLUTIONS } = await import('./data/regionalForms');
        const currentPkm = await this.getPokemon(pokemonFormId);
        const regionalEvo = REGIONAL_STONE_EVOLUTIONS[currentPkm.name];
        if (regionalEvo && regionalEvo.item === itemName) {
          const nextPokemon = await this.getPokemon(regionalEvo.targetSlug);
          const nextSpecies = await this.getSpecies(nextPokemon.id);
          const getStat = (name: string) =>
            nextPokemon.stats.find((s: any) => s.stat.name === name)?.base_stat || 0;
          return {
            newId: nextPokemon.id,
            newName: this.getItalianName(nextSpecies.names),
            newBaseStats: {
              hp: getStat('hp'), attack: getStat('attack'), defense: getStat('defense'),
              spAtk: getStat('special-attack'), spDef: getStat('special-defense'),
              speed: getStat('speed'),
            },
            newTypes: nextPokemon.types.map((t: any) => t.type.name),
          };
        }
        // Forma regionale senza evoluzione via questa pietra → null
        return null;
      }

      // Override manuale per Eevee
      if (speciesData.id === 133 || speciesData.name === 'eevee') {
        let manualEvolution = null;
        if (itemName === 'dark-stone') manualEvolution = 'umbreon';
        if (itemName === 'sun-stone') manualEvolution = 'espeon';
        if (itemName === 'prism-scale') manualEvolution = 'sylveon';
        if (itemName === 'ice-stone') manualEvolution = 'glaceon';

        if (manualEvolution) {
          const nextPokemon = await this.getPokemon(manualEvolution);
          const nextSpecies = await this.getSpecies(manualEvolution);
          
          const getStat = (name: string) => nextPokemon.stats.find((s: any) => s.stat.name === name)?.base_stat || 0;
          
          return {
            newId: nextPokemon.id,
            newName: this.getItalianName(nextSpecies.names),
            newBaseStats: {
              hp: getStat('hp'),
              attack: getStat('attack'),
              defense: getStat('defense'),
              spAtk: getStat('special-attack'),
              spDef: getStat('special-defense'),
              speed: getStat('speed'),
            },
            newTypes: nextPokemon.types.map((t: any) => t.type.name)
          };
        }
      }

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
          
          const getStat = (name: string) => nextPokemon.stats.find((s: any) => s.stat.name === name)?.base_stat || 0;
          
          const newBaseStats = {
            hp: getStat('hp'),
            attack: getStat('attack'),
            defense: getStat('defense'),
            spAtk: getStat('special-attack'),
            spDef: getStat('special-defense'),
            speed: getStat('speed'),
          };

          return {
            newId: nextPokemon.id,
            newName: this.getItalianName(nextSpecies.names),
            newBaseStats,
            newTypes: nextPokemon.types.map((t: any) => t.type.name)
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
    const BANNED_MOVES_LEVELUP = new Set([ 
      'protect','detect','endure','substitute','splash','celebrate','hold-hands', 
      'confuse-ray','swagger','flatter','supersonic','teeter-dance','attract','captivate', 
      'sunny-day','rain-dance','sandstorm','hail','snow', 
      'grassy-terrain','misty-terrain','electric-terrain','psychic-terrain','gravity', 
      'magic-room','wonder-room','mud-sport','water-sport','trick-room', 
      'spikes','stealth-rock','toxic-spikes','sticky-web', 
      'whirlwind','roar','mean-look','block','spider-web', 
      'baton-pass','u-turn','volt-switch','parting-shot', 
      'reflect','light-screen','aurora-veil','safeguard','mist','tailwind','lucky-chant', 
      'healing-wish','lunar-dance','helping-hand','follow-me','rage-powder','spotlight', 
      'transform','mirror-move','mimic','sketch','copycat','me-first','assist','metronome', 
      'sleep-talk','snore','nature-power','instruct','conversion','conversion2','camouflage', 
      'sonic-boom','dragon-rage','night-shade','seismic-toss','super-fang','psywave', 
      'fissure','guillotine','horn-drill','sheer-cold', 
      'self-destruct','explosion','memento','final-gambit','destiny-bond','counter', 
      'mirror-coat','metal-burst','bide','focus-punch','shell-trap','endeavor','pain-split', 
      'stockpile','swallow','spit-up','future-sight','doom-desire', 
      'haze','topsy-turvy','trick','switcheroo','fling','bestow','embargo','heal-block', 
      'perish-song','yawn','imprison','frustration','return','beat-up', 
      'leech-seed','ingrain','aqua-ring','curse','nightmare','telekinesis','magnet-rise', 
      'autotomize','charge','recycle','belch','false-swipe','wish','struggle','teleport', 
    ]); 
    const candidateMoves = pokemonData.moves.filter((m: any) => 
      !BANNED_MOVES_LEVELUP.has(m.move.name) && 
      m.version_group_details.some((v: any) => v.move_learn_method.name === 'level-up' && v.level_learned_at === level) 
    ); 

    if (candidateMoves.length === 0) return [];

    const results: Move[] = [];
    for (const candidateMove of candidateMoves) {
      try {
        const moveData = await this.getMove(candidateMove.move.name);
        if (!moveData) continue;

        results.push({
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
          stat_changes: moveData.stat_changes ?? [],
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
        });
      } catch (e) {
        console.error(`Error fetching move ${candidateMove.move.name}:`, e);
      }
    }
    return results;
  },

  getPokemonCry(pokemonId: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`;
  },

  getItalianDescription(entries: any[]): string {
    const itEntry = entries.find((e: any) => e.language.name === 'it');
    return itEntry ? (itEntry.flavor_text || itEntry.description || itEntry.text) : entries.find((e: any) => e.language.name === 'en')?.flavor_text || 'Nessuna descrizione disponibile.';
  },

  getSpriteUrl(data: any, isShiny: boolean = false): string {
    if (isShiny) {
      return data.sprites.other?.['official-artwork']?.front_shiny
        || data.sprites.front_shiny
        || data.sprites.other?.['official-artwork']?.front_default
        || data.sprites.front_default
        || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`;
    }
    return data.sprites.other?.['official-artwork']?.front_default
      || data.sprites.front_default
      || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`;
  }
};
