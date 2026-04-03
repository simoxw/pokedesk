import { Pokemon, Item, Stats } from './types';

export const CatchEngine = {
  calculateCatchRate(
    pokemon: any, 
    ballType: string, 
    circleSizeBonus: number, 
    isShiny: boolean,
    isSafari: boolean = false
  ): boolean {
    const baseRate = pokemon.capture_rate || 45;
    
    let ballMultiplier = 1.0; 
    if (ballType === 'megaball') ballMultiplier = 1.8; 
    if (ballType === 'ultraball') ballMultiplier = 3.0; 
    if (ballType === 'masterball') return true; 
 
    const rawProb = (baseRate * ballMultiplier * circleSizeBonus) / 255; 
    const flatBonus = baseRate <= 3 ? 0.05 : (isSafari ? 0.05 : 0.07); 
    const catchProb = Math.min(0.95, rawProb + flatBonus); 

    
    return Math.random() < catchProb;
  },

  checkShiny(): boolean {
    return Math.random() < 1 / 512;
  },

  generateIVs() {
    return {
      hp: Math.floor(Math.random() * 32),
      attack: Math.floor(Math.random() * 32),
      defense: Math.floor(Math.random() * 32),
      spAtk: Math.floor(Math.random() * 32),
      spDef: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32),
    };
  },

  getNature() {
    const natures = [
      'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
      'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
      'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
      'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
      'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
    ];
    return natures[Math.floor(Math.random() * natures.length)];
  },

  getBaseStats(pokemonData: any): Stats {
    return {
      hp: pokemonData.stats[0].base_stat,
      attack: pokemonData.stats[1].base_stat,
      defense: pokemonData.stats[2].base_stat,
      spAtk: pokemonData.stats[3].base_stat,
      spDef: pokemonData.stats[4].base_stat,
      speed: pokemonData.stats[5].base_stat,
    };
  },

  createPokemon(
    pokemonId: number,
    level: number,
    isShiny: boolean,
    ivs: Stats,
    evs: Stats = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
    nature: string = 'Quirky'
  ) {
    // This method needs to fetch data from API, so we return a partial object
    // The actual implementation should be async and use api.getPokemon
    // For now, we'll return a structure that can be filled in by the caller
    return {
      pokemonId,
      level,
      isShiny,
      ivs,
      evs,
      nature,
    };
  }
};
