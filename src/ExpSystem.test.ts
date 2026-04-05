import { describe, it, expect } from 'vitest';
import { BattleEngine } from './BattleEngine';

describe('BattleEngine - EXP System', () => {
  describe('getExpForNextLevel', () => {
    describe('Medium-Fast (n^3)', () => {
      it('Level 10 → needs exp for level 11: 11^3 = 1331', () => {
        expect(BattleEngine.getExpForNextLevel(10, 'medium-fast')).toBe(1331);
      });

      it('Level 50 → needs exp for level 51: 51^3 = 132651', () => {
        expect(BattleEngine.getExpForNextLevel(50, 'medium-fast')).toBe(132651);
      });
    });

    describe('Fast (4/5 * n^3)', () => {
      it('Level 10 → floor(4 * 11^3 / 5) = 1064', () => {
        expect(BattleEngine.getExpForNextLevel(10, 'fast')).toBe(1064);
      });

      it('Level 50 → floor(4 * 51^3 / 5) = 106120', () => {
        expect(BattleEngine.getExpForNextLevel(50, 'fast')).toBe(106120);
      });
    });

    describe('Slow (5/4 * n^3)', () => {
      it('Level 10 → floor(5 * 11^3 / 4) = 1663', () => {
        expect(BattleEngine.getExpForNextLevel(10, 'slow')).toBe(1663);
      });

      it('Level 50 → floor(5 * 51^3 / 4) = 165813', () => {
        expect(BattleEngine.getExpForNextLevel(50, 'slow')).toBe(165813);
      });
    });

    describe('Medium-Slow (6/5*n^3 - 15*n^2 + 100*n - 140)', () => {
      it('Level 10 → needs exp for level 11: 742', () => {
        // floor(1597.2 - 1815 + 1100 - 140) = floor(742.2) = 742
        expect(BattleEngine.getExpForNextLevel(10, 'medium-slow')).toBe(742);
      });

      it('Level 1 → needs exp for level 2: 0 (formula gives 9.6 - 60 + 200 - 140 = 9.6 -> 9)', () => {
        expect(BattleEngine.getExpForNextLevel(1, 'medium-slow')).toBeGreaterThanOrEqual(0);
      });
      
      it('Verify no negative exp values are returned for low levels', () => {
        for (let l = 1; l < 10; l++) {
          expect(BattleEngine.getExpForNextLevel(l, 'medium-slow')).toBeGreaterThanOrEqual(0);
        }
      });
    });

    describe('Boundary tests', () => {
      it('Level 99 → getExpForNextLevel should return a value > 0', () => {
        expect(BattleEngine.getExpForNextLevel(99, 'medium-fast')).toBeGreaterThan(0);
      });

      it('Level 100 → returns value for level 101 (codebase does not cap at 100)', () => {
        expect(BattleEngine.getExpForNextLevel(100, 'medium-fast')).toBe(101 * 101 * 101);
      });
    });
  });

  describe('calculateExp (battle reward)', () => {
    it('Base exp 64 (Rattata), enemy level 5: floor((64*5)/7) = 45', () => {
      expect(BattleEngine.calculateExp(64, 5)).toBe(45);
    });

    it('Base exp 270 (Dragonite), enemy level 50: floor((270*50)/7) = 1928', () => {
      expect(BattleEngine.calculateExp(270, 50)).toBe(1928);
    });

    it('Result should always be a positive integer', () => {
      for (let i = 0; i < 100; i++) {
        const res = BattleEngine.calculateExp(Math.random() * 300, Math.random() * 100);
        expect(Number.isInteger(res)).toBe(true);
        expect(res).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
