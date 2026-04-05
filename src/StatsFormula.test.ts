import { describe, it, expect } from 'vitest';
import { BattleEngine } from './BattleEngine';

describe('BattleEngine - Stats Formula', () => {
  describe('HP Formula', () => {
    it('Chansey base HP=250, Lv100, IV=31, EV=252 should return 704', () => {
      const stats = BattleEngine.calculateStats(
        100,
        { hp: 250, attack: 5, defense: 5, spAtk: 105, spDef: 105, speed: 50 },
        { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
        { hp: 252, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        'Quirky'
      );
      expect(stats.hp).toBe(704);
    });

    it('Shedinja base HP=1, Lv50, IV=0, EV=0 should return 61 (no game override)', () => {
      const stats = BattleEngine.calculateStats(
        50,
        { hp: 1, attack: 90, defense: 45, spAtk: 30, spDef: 30, speed: 40 },
        { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        'Quirky'
      );
      expect(stats.hp).toBe(61);
    });

    it('Magikarp base HP=20, Lv5, IV=31, EV=0 should return 18', () => {
      const stats = BattleEngine.calculateStats(
        5,
        { hp: 20, attack: 10, defense: 55, spAtk: 15, spDef: 20, speed: 80 },
        { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
        { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        'Quirky'
      );
      expect(stats.hp).toBe(18);
    });
  });

  describe('Other Stats Formula with Nature', () => {
    it('Gengar base SpAtk=130, Lv50, IV=31, EV=0, nature Modest (+spAtk) should return 165', () => {
      const stats = BattleEngine.calculateStats(
        50,
        { hp: 60, attack: 65, defense: 60, spAtk: 130, spDef: 75, speed: 110 },
        { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
        { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        'Modest'
      );
      expect(stats.spAtk).toBe(165);
    });

    it('Gengar base SpAtk=130, Lv50, IV=31, EV=0, nature Jolly (-spAtk) should return 135', () => {
      const stats = BattleEngine.calculateStats(
        50,
        { hp: 60, attack: 65, defense: 60, spAtk: 130, spDef: 75, speed: 110 },
        { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
        { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        'Jolly'
      );
      expect(stats.spAtk).toBe(135);
    });

    it('Neutral nature (Quirky) should return exactly base+5 result', () => {
      const stats = BattleEngine.calculateStats(
        50,
        { hp: 60, attack: 65, defense: 60, spAtk: 130, spDef: 75, speed: 110 },
        { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
        { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        'Quirky'
      );
      expect(stats.spAtk).toBe(150);
    });

    it('Jolteon base speed=130, Lv50, IV=31, EV=252, Timid (+speed) should return 200', () => {
      const stats = BattleEngine.calculateStats(
        50,
        { hp: 65, attack: 65, defense: 60, spAtk: 110, spDef: 95, speed: 130 },
        { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
        { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 252 },
        'Timid'
      );
      expect(stats.speed).toBe(200);
    });
  });

  describe('calculateStats return object', () => {
    it('returns an object with all 6 keys and positive integers', () => {
      const stats = BattleEngine.calculateStats(
        50,
        { hp: 45, attack: 49, defense: 49, spAtk: 65, spDef: 65, speed: 45 },
        { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
        { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        'Quirky'
      );
      
      const keys = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'];
      keys.forEach(key => {
        expect(stats).toHaveProperty(key);
        expect(Number.isInteger(stats[key])).toBe(true);
        expect(stats[key]).toBeGreaterThan(0);
      });
    });
  });
});
