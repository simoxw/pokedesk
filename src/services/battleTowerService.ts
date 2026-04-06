import { Stats } from '../types';

export function generateRandomEVs(): Stats {
  const stats = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'];
  const evs: Stats = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
  let remaining = 510;
  
  // Shuffle stats
  const shuffled = [...stats].sort(() => Math.random() - 0.5);
  
  for (const stat of shuffled) {
    if (remaining <= 0) break;
    const max = Math.min(252, remaining);
    const value = Math.floor(Math.random() * (max + 1));
    evs[stat as keyof Stats] = value;
    remaining -= value;
  }
  
  return evs;
}

export function getTowerFloorConfig(floor: number, teamAvgLevel: number): { 
  enemyCount: number; 
  enemyLevel: number; 
  isBossFloor: boolean; 
  isEliteMode: boolean; 
  useRandomEVs: boolean; 
} { 
  const isEliteMode = floor >= 25; 

  if (isEliteMode) { 
    return { 
      enemyCount: 4, 
      enemyLevel: 100, 
      isBossFloor: false, 
      isEliteMode: true, 
      useRandomEVs: true, 
    }; 
  } 

  // Scaling nemici per fascia di piani (1-24) 
  let enemyCount: number; 
  if (floor <= 5) enemyCount = 1; 
  else if (floor <= 10) enemyCount = 2; 
  else if (floor <= 15) enemyCount = 3; 
  else enemyCount = 4; // piani 16-24 

  // Livello scalato: +1 ogni 3 piani, clamped a 99 
  const levelBonus = Math.floor(floor / 3) * 2; 
  const enemyLevel = Math.min(99, teamAvgLevel + levelBonus); 

  return { 
    enemyCount, 
    enemyLevel, 
    isBossFloor: false,  // boss floor rimosso 
    isEliteMode: false, 
    useRandomEVs: false, 
  }; 
} 

export const TOWER_MILESTONES: Record<number, {
  coins: number;
  items: Record<string, number>;
  label: string;
}> = {
  7:  { coins: 500,   items: { ultraball: 2 },                    label: '🥉 Piano 7'  },
  14: { coins: 1000,  items: { rare_candy: 1 },                   label: '🥈 Piano 14' },
  21: { coins: 2000,  items: { rare_candy: 2 },                   label: '🥇 Piano 21' },
  25: { coins: 3000,  items: { rare_candy: 2, ultraball: 3 },     label: '⚡ Piano 25 — Modalità Elite!' },
  35: { coins: 3000,  items: { masterball: 1 },                   label: '💎 Piano 35' },
  49: { coins: 5000,  items: { masterball: 1, rare_candy: 3 },    label: '🏆 Piano 49' },
  77: { coins: 10000, items: { masterball: 3, rare_candy: 5 },    label: '👑 Piano 77' },
};
