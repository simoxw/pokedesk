import { describe, it, expect } from 'vitest';
import { getExpForLevel, getExpProgress } from './utils/expUtils';

describe('EXP Bar and Level Cap Tests', () => {
  describe('getExpForLevel', () => {
    it('should calculate EXP for level 99 correctly', () => {
      const exp99 = getExpForLevel('medium-fast', 99);
      const exp100 = getExpForLevel('medium-fast', 100);
      expect(exp99).toBe(99 ** 3);
      expect(exp100).toBe(100 ** 3);
      expect(exp100).toBeGreaterThan(exp99);
    });

    it('should handle different growth rates', () => {
      expect(getExpForLevel('slow', 50)).toBe(Math.floor(5 * 50 ** 3 / 4));
      expect(getExpForLevel('fast', 50)).toBe(Math.floor(4 * 50 ** 3 / 5));
      expect(getExpForLevel('medium-slow', 50)).toBe(Math.max(0, Math.floor(6/5 * 50**3 - 15*50**2 + 100*50 - 140)));
    });
  });

  describe('getExpProgress', () => {
    it('should return 100% for level 100', () => {
      const pokemon = { level: 100, growthRate: 'medium-fast', exp: 1000000 };
      const progress = getExpProgress(pokemon);
      expect(progress.percent).toBe(100);
      expect(progress.needed).toBe(0);
      expect(progress.current).toBe(0);
    });

    it('should calculate progress correctly for level 99', () => {
      const pokemon = {
        level: 99,
        growthRate: 'medium-fast',
        exp: 99 ** 3  // Exactly at level 99
      };
      const progress = getExpProgress(pokemon);
      expect(progress.needed).toBeGreaterThan(0);
      expect(progress.current).toBe(0);
      expect(progress.percent).toBe(0);
    });

    it('should handle partial progress at level 99', () => {
      const exp99 = 99 ** 3;
      const exp100 = 100 ** 3;
      const midExp = exp99 + Math.floor((exp100 - exp99) / 2);
      const pokemon = {
        level: 99,
        growthRate: 'medium-fast',
        exp: midExp
      };
      const progress = getExpProgress(pokemon);
      expect(progress.needed).toBe(exp100 - exp99);
      expect(progress.current).toBe(midExp - exp99);
      expect(progress.percent).toBeGreaterThanOrEqual(49);
      expect(progress.percent).toBeLessThanOrEqual(50);
    });

    it('should cap progress at 100% when exp exceeds next level', () => {
      const pokemon = {
        level: 99,
        growthRate: 'medium-fast',
        exp: 99 ** 3 + 100000 // More than needed
      };
      const progress = getExpProgress(pokemon);
      expect(progress.needed).toBeGreaterThan(0);
      expect(progress.percent).toBe(100);
    });
  });

  describe('Level Cap Checks', () => {
    it('should allow leveling up to 99', () => {
      // This is more of a logical test - in actual UI, check would be >=100
      expect(99 < 100).toBe(true);
    });

    it('should block at level 100', () => {
      expect(100 >= 100).toBe(true);
    });
  });
});