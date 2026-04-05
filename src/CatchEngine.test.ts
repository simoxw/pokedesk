import { describe, it, expect, vi } from 'vitest';
import { CatchEngine } from './CatchEngine';

describe('CatchEngine', () => {
  describe('calculateCatchRate', () => {
    it('masterball should always return true regardless of capture_rate', () => {
      const pokemon = { capture_rate: 3 }; // Leggendario
      expect(CatchEngine.calculateCatchRate(pokemon, 'masterball', 1.0, false)).toBe(true);
    });

    it('ultraball (3x) with capture_rate 255 should have very high catch probability', () => {
      const pokemon = { capture_rate: 255 };
      // (255 * 3.0 * 1.0) / 255 = 3.0. Clamped to 0.95.
      // With Math.random() = 0.94, it should succeed
      vi.spyOn(Math, 'random').mockReturnValue(0.94);
      expect(CatchEngine.calculateCatchRate(pokemon, 'ultraball', 1.0, false)).toBe(true);
      vi.restoreAllMocks();
    });

    it('pokeball with capture_rate 3 should have low probability', () => {
      const pokemon = { capture_rate: 3 };
      // (3 * 1.0 * 1.0) / 255 = 0.0117. Plus flatBonus 0.05 = 0.0617.
      // With Math.random() = 0.06, it should succeed
      vi.spyOn(Math, 'random').mockReturnValue(0.06);
      expect(CatchEngine.calculateCatchRate(pokemon, 'pokeball', 1.0, false)).toBe(true);
      
      // With Math.random() = 0.07, it should fail
      vi.spyOn(Math, 'random').mockReturnValue(0.07);
      expect(CatchEngine.calculateCatchRate(pokemon, 'pokeball', 1.0, false)).toBe(false);
      vi.restoreAllMocks();
    });

    it('isSafari flag: flatBonus should be 0.05 when isSafari=true and 0.07 when false', () => {
      const pokemon = { capture_rate: 100 };
      // rawProb = 100/255 = 0.3921
      // safari catchProb = 0.3921 + 0.05 = 0.4421
      // normal catchProb = 0.3921 + 0.07 = 0.4621
      
      // With Math.random() = 0.45, safari should fail, normal should succeed
      vi.spyOn(Math, 'random').mockReturnValue(0.45);
      expect(CatchEngine.calculateCatchRate(pokemon, 'pokeball', 1.0, false, true)).toBe(false);
      expect(CatchEngine.calculateCatchRate(pokemon, 'pokeball', 1.0, false, false)).toBe(true);
      vi.restoreAllMocks();
    });

    it('circleSizeBonus: bonus 2.0 should give higher catch rate than bonus 1.0', () => {
      const pokemon = { capture_rate: 50 };
      // rawProb1 = 50/255 = 0.196
      // rawProb2 = 100/255 = 0.392
      // flatBonus = 0.07
      // catchProb1 = 0.266
      // catchProb2 = 0.462
      
      // With Math.random() = 0.3, bonus 1.0 should fail, bonus 2.0 should succeed
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      expect(CatchEngine.calculateCatchRate(pokemon, 'pokeball', 1.0, false)).toBe(false);
      expect(CatchEngine.calculateCatchRate(pokemon, 'pokeball', 2.0, false)).toBe(true);
      vi.restoreAllMocks();
    });

    it('result should be clamped to max 0.95', () => {
      const pokemon = { capture_rate: 255 };
      // catchProb would be > 1.0, but clamped to 0.95
      // With Math.random() = 0.96, it should fail
      vi.spyOn(Math, 'random').mockReturnValue(0.96);
      expect(CatchEngine.calculateCatchRate(pokemon, 'ultraball', 2.0, false)).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe('generateIVs', () => {
    it('all 6 stats should be integers between 0 and 31 inclusive', () => {
      for (let i = 0; i < 100; i++) {
        const ivs = CatchEngine.generateIVs();
        const stats = Object.values(ivs);
        expect(stats).toHaveLength(6);
        stats.forEach(val => {
          expect(Number.isInteger(val)).toBe(true);
          expect(val).toBeGreaterThanOrEqual(0);
          expect(val).toBeLessThanOrEqual(31);
        });
      }
    });
  });

  describe('checkShiny', () => {
    it('rate should be approximately 1/512', () => {
      const iterations = 100000;
      let shinyCount = 0;
      for (let i = 0; i < iterations; i++) {
        if (CatchEngine.checkShiny()) shinyCount++;
      }
      
      const rate = shinyCount / iterations;
      const expectedRate = 1 / 512;
      // 0.5% tolerance of the total iterations might be too tight for 100k, 
      // let's use a relative tolerance or a reasonable absolute one.
      // expected count is ~195. 
      expect(rate).toBeCloseTo(expectedRate, 3);
    });
  });

  describe('getNature', () => {
    it('should return one of the 25 valid nature strings', () => {
      const validNatures = [
        'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
        'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
        'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
        'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
        'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
      ];
      
      for (let i = 0; i < 200; i++) {
        const nature = CatchEngine.getNature();
        expect(validNatures).toContain(nature);
      }
    });
  });
});
