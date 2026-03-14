import { Pokemon, Item } from './types';

export const CatchEngine = {
  calculateCatchRate(
    pokemon: any, 
    ballType: string, 
    circleSizeBonus: number, 
    isShiny: boolean
  ): boolean {
    const baseRate = pokemon.capture_rate || 45;
    
    let ballMultiplier = 1.0; 
    if (ballType === 'megaball') ballMultiplier = 1.8; 
    if (ballType === 'ultraball') ballMultiplier = 3.0; 
    if (ballType === 'masterball') return true; 
 
    const rawProb = (baseRate * ballMultiplier * circleSizeBonus) / 255; 
    const catchProb = Math.min(0.95, rawProb + 0.10); 

    
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
  }
};
