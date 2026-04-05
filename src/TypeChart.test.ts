import { describe, it, expect } from 'vitest';
import { TYPE_CHART, BattleEngine } from './BattleEngine';
import { PokemonType } from './types';

describe('TYPE_CHART', () => {
  const allTypes: PokemonType[] = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
    'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy'
  ];

  it('all 18 types exist as keys in TYPE_CHART', () => {
    const keys = Object.keys(TYPE_CHART) as PokemonType[];
    expect(keys.length).toBe(18);
    allTypes.forEach(type => {
      expect(keys).toContain(type);
    });
  });

  it('no multiplier value other than 0, 0.5, or 2 exists in the chart', () => {
    Object.values(TYPE_CHART).forEach(modifiers => {
      Object.values(modifiers).forEach(multiplier => {
        expect([0, 0.5, 2]).toContain(multiplier);
      });
    });
  });

  describe('specific canonical matchups', () => {
    const testEffectiveness = (attacker: PokemonType, defender: PokemonType, expected: number) => {
      it(`${attacker} → ${defender} should be ${expected}`, () => {
        const effectiveness = BattleEngine.getTypeEffectiveness(attacker, [defender]);
        expect(effectiveness).toBe(expected);
      });
    };

    testEffectiveness('electric', 'flying', 2);
    testEffectiveness('electric', 'ground', 0);
    testEffectiveness('electric', 'dragon', 0.5);
    testEffectiveness('poison', 'steel', 0);
    testEffectiveness('ground', 'flying', 0);
    testEffectiveness('ghost', 'normal', 0);
    testEffectiveness('normal', 'ghost', 0);
    testEffectiveness('dragon', 'fairy', 0);
    testEffectiveness('dark', 'psychic', 2);
    testEffectiveness('fighting', 'dark', 2);
    testEffectiveness('fairy', 'dragon', 2);
    
    // Steel resistance tests
    testEffectiveness('steel', 'fairy', 2); // Steel move vs Fairy (Superefficace)
    testEffectiveness('fairy', 'steel', 0.5); // Fairy move vs Steel (Resistito)
  });

  describe('Dual-type effectiveness multiplication', () => {
    it('Water move vs Fire/Rock type: should be 4x', () => {
      expect(BattleEngine.getTypeEffectiveness('water', ['fire', 'rock'])).toBe(4);
    });

    it('Electric move vs Ground/Flying type: should be 0x (ground immunity wins)', () => {
      expect(BattleEngine.getTypeEffectiveness('electric', ['ground', 'flying'])).toBe(0);
    });
    
    it('Ice move vs Grass/Flying type: should be 4x', () => {
      expect(BattleEngine.getTypeEffectiveness('ice', ['grass', 'flying'])).toBe(4);
    });
    
    it('Fighting move vs Normal/Steel type: should be 4x', () => {
      expect(BattleEngine.getTypeEffectiveness('fighting', ['normal', 'steel'])).toBe(4);
    });
  });
});
