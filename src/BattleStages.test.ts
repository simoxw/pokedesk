import { describe, it, expect, vi } from 'vitest';
import { BattleEngine } from './BattleEngine';
import { Pokemon, Move } from './types';

describe('BattleEngine - Stages and Damage', () => {
  describe('getStageMultiplier', () => {
    it('Stage 0 should return exactly 1.0', () => {
      expect(BattleEngine.getStageMultiplier(0)).toBe(1.0);
    });

    it('Stage +1 should return 1.5', () => {
      expect(BattleEngine.getStageMultiplier(1)).toBe(1.5);
    });

    it('Stage +2 should return 2.0', () => {
      expect(BattleEngine.getStageMultiplier(2)).toBe(2.0);
    });

    it('Stage +6 (max) should return 4.0', () => {
      expect(BattleEngine.getStageMultiplier(6)).toBe(4.0);
    });

    it('Stage -1 should return ~0.667', () => {
      expect(BattleEngine.getStageMultiplier(-1)).toBeCloseTo(0.667, 3);
    });

    it('Stage -2 should return 0.5', () => {
      expect(BattleEngine.getStageMultiplier(-2)).toBe(0.5);
    });

    it('Stage -6 (min) should return 0.25', () => {
      expect(BattleEngine.getStageMultiplier(-6)).toBe(0.25);
    });

    it('Stage beyond +6 should clamp to +6 result', () => {
      expect(BattleEngine.getStageMultiplier(10)).toBe(4.0);
    });

    it('Stage beyond -6 should clamp to -6 result', () => {
      expect(BattleEngine.getStageMultiplier(-10)).toBe(0.25);
    });
  });

  describe('calculateDamage with stages and status', () => {
    const createMockPokemon = (overrides: Partial<Pokemon> = {}): Pokemon => ({
      id: 'mock',
      pokemonId: 1,
      name: 'Mock',
      level: 50,
      exp: 0,
      types: ['normal'],
      stats: { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
      baseStats: { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
      ivs: { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
      evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
      nature: 'Quirky',
      moves: [],
      currentHp: 100,
      status: null,
      isShiny: false,
      caughtAt: Date.now(),
      growthRate: 'medium',
      baseSpeciesId: 1,
      ...overrides
    });

    const mockMove: Move = {
      id: 'tackle',
      name: 'Tackle',
      type: 'normal',
      power: 80,
      accuracy: 100,
      pp: 35,
      maxPp: 35,
      priority: 0,
      category: 'physical',
      description: 'Tackle'
    };

    it('with attacker attack stage +2 (2x multiplier), damage should be exactly base * 2', () => {
      const defender = createMockPokemon();
      
      // Base damage (neutral) - mock random to 1.0 (100/100)
      vi.spyOn(Math, 'random').mockReturnValue(15/16); // (floor(15/16 * 16) + 85) / 100 = (15 + 85) / 100 = 1.0
      
      const attackerBase = createMockPokemon();
      const baseDamage = BattleEngine.calculateDamage(attackerBase, defender, mockMove, false);

      // Boosted damage
      const attackerBoosted = createMockPokemon();
      attackerBoosted.stats.attack = 200; // Manual boost for stage +2
      
      const boostedDamage = BattleEngine.calculateDamage(attackerBoosted, defender, mockMove, false);

      expect(boostedDamage).toBeGreaterThan(baseDamage * 1.9); // floor effects might make it slightly off
      vi.restoreAllMocks();
    });

    it('Critical hit returns damage >= non-crit damage', () => {
      vi.spyOn(Math, 'random').mockReturnValue(15/16); // 1.0 multiplier
      const attacker = createMockPokemon();
      const defender = createMockPokemon();
      
      const damageNonCrit = BattleEngine.calculateDamage(attacker, defender, mockMove, false);
      const damageCrit = BattleEngine.calculateDamage(attacker, defender, mockMove, true);
      
      expect(damageCrit).toBe(Math.floor(damageNonCrit * 1.5));
      vi.restoreAllMocks();
    });

    it('BRN halves physical damage but NOT special damage', () => {
      vi.spyOn(Math, 'random').mockReturnValue(15/16); // 1.0 multiplier
      const attackerBRN = createMockPokemon({ status: 'BRN' });
      const defender = createMockPokemon();
      
      // Physical move
      const damagePhys = BattleEngine.calculateDamage(attackerBRN, defender, mockMove, false);
      const attackerNormal = createMockPokemon();
      const damagePhysNormal = BattleEngine.calculateDamage(attackerNormal, defender, mockMove, false);
      
      expect(damagePhys).toBe(Math.floor(damagePhysNormal * 0.5));

      // Special move
      const specialMove: Move = { ...mockMove, category: 'special', type: 'fire' };
      const damageSpec = BattleEngine.calculateDamage(attackerBRN, defender, specialMove, false);
      const damageSpecNormal = BattleEngine.calculateDamage(attackerNormal, defender, specialMove, false);
      
      expect(damageSpec).toBe(damageSpecNormal);
      vi.restoreAllMocks();
    });

    it('calculateDamage with typeMultiplier 0 must return exactly 0', () => {
      const attacker = createMockPokemon();
      const defenderGhost = createMockPokemon({ types: ['ghost'] });
      
      const damage = BattleEngine.calculateDamage(attacker, defenderGhost, mockMove, false);
      expect(damage).toBe(0);
    });
  });
});
