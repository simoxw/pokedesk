import { Pokemon, Move, StatusEffect, PokemonType } from './types';

const TYPE_CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export const BattleEngine = {
  calculateDamage(attacker: Pokemon, defender: Pokemon, move: Move, isCritical: boolean): number {
    if (move.category === 'status') return 0;

    const level = attacker.level;
    const attack = move.category === 'physical' ? attacker.stats.attack : attacker.stats.spAtk;
    const defense = move.category === 'physical' ? defender.stats.defense : defender.stats.spDef;
    const power = move.power || 40;

    // Gen 5 Formula
    let damage = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * attack * power / defense) / 50 + 2);

    // STAB
    if (attacker.types.includes(move.type)) {
      damage = Math.floor(damage * 1.5);
    }

    // Type Effectiveness
    const typeMultiplier = this.getTypeEffectiveness(move.type, defender.types);
    damage = Math.floor(damage * typeMultiplier);

    // Critical
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }

    // Random (0.85 - 1.0)
    const random = 0.85 + Math.random() * 0.15;
    damage = Math.floor(damage * random);

    // BRN: -50% attacco fisico 
    if (attacker.status === 'BRN' && move.category === 'physical') {
      damage = Math.floor(damage * 0.5);
    }

    return Math.max(1, damage);
  },

  getTypeEffectivenessLabel(multiplier: number): string | null {
    if (multiplier === 0) return 'Non ha effetto!';
    if (multiplier < 1) return 'Non molto efficace...';
    if (multiplier >= 2) return 'È superefficace!';
    return null;
  },

  getTypeEffectiveness(moveType: PokemonType, defenderTypes: PokemonType[]): number {
    let multiplier = 1.0;
    for (const defType of defenderTypes) {
      const chart = TYPE_CHART[moveType];
      if (chart && chart[defType] !== undefined) {
        multiplier *= chart[defType]!;
      }
    }
    return multiplier;
  },

  calculateExp(baseExp: number, enemyLevel: number): number {
    return Math.floor((baseExp * enemyLevel) / 7);
  },

  checkStatusEffect(move: Move): StatusEffect {
    if (!move.statusEffect || !move.effectChance) return null;
    return Math.random() * 100 < move.effectChance ? move.statusEffect : null;
  },

  calculateStats(level: number, baseStats: any, ivs: any, evs: any, nature: string): any {
    const stats: any = {};
    
    // HP Formula
    stats.hp = Math.floor(((2 * baseStats.hp + ivs.hp + Math.floor(evs.hp / 4)) * level) / 100) + level + 10;
    
    // Nature Modifiers Table
    const NATURE_MODS: Record<string, { up: string; down: string }> = {
      Lonely:   { up: 'attack',  down: 'defense' },
      Brave:    { up: 'attack',  down: 'speed'   },
      Adamant:  { up: 'attack',  down: 'spAtk'   },
      Naughty:  { up: 'attack',  down: 'spDef'   },
      Bold:     { up: 'defense', down: 'attack'  },
      Relaxed:  { up: 'defense', down: 'speed'   },
      Impish:   { up: 'defense', down: 'spAtk'   },
      Lax:      { up: 'defense', down: 'spDef'   },
      Timid:    { up: 'speed',   down: 'attack'  },
      Hasty:    { up: 'speed',   down: 'defense' },
      Jolly:    { up: 'speed',   down: 'spAtk'   },
      Naive:    { up: 'speed',   down: 'spDef'   },
      Modest:   { up: 'spAtk',   down: 'attack'  },
      Mild:     { up: 'spAtk',   down: 'defense' },
      Quiet:    { up: 'spAtk',   down: 'speed'   },
      Rash:     { up: 'spAtk',   down: 'spDef'   },
      Calm:     { up: 'spDef',   down: 'attack'  },
      Gentle:   { up: 'spDef',   down: 'defense' },
      Sassy:    { up: 'spDef',   down: 'speed'   },
      Careful:  { up: 'spDef',   down: 'spAtk'   },
    };

    // Other Stats Formula
    const otherStats = ['attack', 'defense', 'spAtk', 'spDef', 'speed'];
    otherStats.forEach(stat => {
      let val = Math.floor(((2 * baseStats[stat] + ivs[stat] + Math.floor(evs[stat] / 4)) * level) / 100) + 5;
      
      // Nature modifier
      const mod = NATURE_MODS[nature];
      if (mod) {
        if (mod.up === stat) val = Math.floor(val * 1.1);
        if (mod.down === stat) val = Math.floor(val * 0.9);
      }
      
      stats[stat] = val;
    });

    return stats;
  }
};
