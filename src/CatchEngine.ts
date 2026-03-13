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
    if (ballType === 'megaball') ballMultiplier = 1.5;
    if (ballType === 'ultraball') ballMultiplier = 2.0;
    if (ballType === 'masterball') return true;

    // Simplified GO-style catch formula
    // Probability = 1 - (1 - CatchRate / (2 * MaxHP))^Multiplier
    // Since HP is always 100% in catch screen:
    const catchProb = (baseRate * ballMultiplier * circleSizeBonus) / 255;
    
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
