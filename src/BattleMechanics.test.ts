import { describe, expect, it } from 'vitest';
import { BattleEngine, FALSE_SWIPE_MOVE_ID, STRUGGLE_MOVE } from './BattleEngine';
import { Move, Pokemon } from './types';

const mockPokemon = (currentHp: number): Pokemon => ({
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
  currentHp,
  status: null,
  isShiny: false,
  caughtAt: 0,
  growthRate: 'medium',
  baseSpeciesId: 1,
});

const multiHitMove: Move = {
  id: 'multi-hit',
  name: 'Multi-hit',
  type: 'normal',
  power: 40,
  accuracy: 100,
  pp: 10,
  maxPp: 10,
  priority: 0,
  category: 'physical',
  description: '',
  meta: { min_hits: 2, max_hits: 5 },
};

describe('BattleEngine - turn resolution', () => {
  it('applies speed stages and paralysis to effective speed', () => {
    expect(BattleEngine.getEffectiveSpeed(100, 2)).toBe(200);
    expect(BattleEngine.getEffectiveSpeed(100, 0, 'PAR')).toBe(50);
    expect(BattleEngine.getEffectiveSpeed(100, 2, 'PAR')).toBe(100);
    expect(BattleEngine.getEffectiveSpeed(1, -6, 'PAR')).toBe(1);
  });

  it('compares both move priorities before speed', () => {
    expect(BattleEngine.determineTurnOrder(1, 0, 50, 200)).toBe('player');
    expect(BattleEngine.determineTurnOrder(0, 1, 200, 50)).toBe('enemy');
  });

  it('uses effective speed when priorities are equal', () => {
    expect(BattleEngine.determineTurnOrder(0, 0, 120, 80)).toBe('player');
    expect(BattleEngine.determineTurnOrder(1, 1, 80, 120)).toBe('enemy');
  });

  it('resolves equal priority and speed with a random tie-break', () => {
    expect(BattleEngine.determineTurnOrder(0, 0, 100, 100, () => 0.2)).toBe('player');
    expect(BattleEngine.determineTurnOrder(0, 0, 100, 100, () => 0.8)).toBe('enemy');
  });

  it('applies accuracy and evasion stages and clamps accuracy', () => {
    expect(BattleEngine.calculateAccuracy(70, 0, 0)).toBe(70);
    expect(BattleEngine.calculateAccuracy(70, 1, 2)).toBe(52);
    expect(BattleEngine.calculateAccuracy(90, 6, -6)).toBe(100);
    expect(BattleEngine.calculateAccuracy(50, -6, 6)).toBe(10);
  });

  it('uses the modern 2-to-5 hit distribution and respects fixed hit counts', () => {
    expect(BattleEngine.getMultiHitCount(2, 5, () => 0.34)).toBe(2);
    expect(BattleEngine.getMultiHitCount(2, 5, () => 0.35)).toBe(3);
    expect(BattleEngine.getMultiHitCount(2, 5, () => 0.7)).toBe(4);
    expect(BattleEngine.getMultiHitCount(2, 5, () => 0.85)).toBe(5);
    expect(BattleEngine.getMultiHitCount(3, 3, () => 0.9)).toBe(3);
  });

  it('stops multi-hit damage when the target faints', () => {
    const result = BattleEngine.calculateMoveDamage(
      mockPokemon(100),
      mockPokemon(1),
      multiHitMove,
      () => 0.5
    );

    expect(result.hits).toBe(1);
    expect(result.damage).toBeGreaterThanOrEqual(1);
  });

  it('does not roll damage or criticals for status moves', () => {
    const statusMove = { ...multiHitMove, category: 'status' as const, power: 0 };
    const result = BattleEngine.calculateMoveDamage(mockPokemon(100), mockPokemon(100), statusMove, () => {
      throw new Error('Status moves must not consume damage RNG');
    });

    expect(result).toEqual({ damage: 0, isCritical: false, hits: 0 });
  });

  it('uses Struggle only when every move has run out of PP', () => {
    expect(BattleEngine.getAvailableMoves([{ ...multiHitMove, pp: 1 }])).toEqual([{ ...multiHitMove, pp: 1 }]);
    expect(BattleEngine.getAvailableMoves([{ ...multiHitMove, pp: 0 }])).toEqual([STRUGGLE_MOVE]);
  });

  it('identifies self-targeted moves so their effects are not applied to the opponent', () => {
    expect(BattleEngine.isUserTargetedMove('user')).toBe(true);
    expect(BattleEngine.isUserTargetedMove('selected-pokemon')).toBe(false);
    expect(BattleEngine.isUserTargetedMove(undefined)).toBe(false);
    expect(BattleEngine.canApplyStatusToOpponent('user', 'status', 'normal', ['ghost'], 'PAR')).toBe(false);
    expect(BattleEngine.canApplyStatusToOpponent('selected-pokemon', 'status', 'normal', ['ghost'], 'PAR')).toBe(true);
    expect(BattleEngine.canApplyStatusToOpponent('selected-pokemon', 'status', 'electric', ['ground'], 'PAR')).toBe(false);
    expect(BattleEngine.canApplyStatusToOpponent('selected-pokemon', 'status', 'normal', ['ground'], 'PAR')).toBe(true);
    expect(BattleEngine.canApplyStatusToOpponent('selected-pokemon', 'status', 'poison', ['steel'], 'PSN')).toBe(false);
    expect(BattleEngine.canApplyStatusToOpponent('selected-pokemon', 'physical', 'normal', ['ghost'])).toBe(false);
  });

  it('keeps False Swipe targets at 1 HP instead of fainting them', () => {
    expect(BattleEngine.applyMoveDamage(100, 150, FALSE_SWIPE_MOVE_ID)).toBe(1);
    expect(BattleEngine.applyMoveDamage(100, 40, FALSE_SWIPE_MOVE_ID)).toBe(60);
    expect(BattleEngine.applyMoveDamage(1, 20, FALSE_SWIPE_MOVE_ID)).toBe(1);
    expect(BattleEngine.applyMoveDamage(100, 150, 'other-move')).toBe(0);
    expect(BattleEngine.applyMoveDamage(0, 150, FALSE_SWIPE_MOVE_ID)).toBe(0);
  });

  it('resolves stat-change recipients from move target and move behavior', () => {
    expect(BattleEngine.getStatChangeRecipient('user', 'status', -1)).toBe('user');
    expect(BattleEngine.getStatChangeRecipient('selected-pokemon', 'status', -1)).toBe('opponent');
    expect(BattleEngine.getStatChangeRecipient('selected-pokemon', 'physical', -1)).toBe('opponent');
    expect(BattleEngine.getStatChangeRecipient('selected-pokemon', 'physical', 1)).toBe('user');
    expect(BattleEngine.getStatChangeRecipient('selected-pokemon', 'physical', -1, true)).toBe('user');
  });

  it('lets Struggle damage Ghost types without STAB', () => {
    const attacker = { ...mockPokemon(100), types: ['normal'] as Pokemon['types'] };
    const nonStabAttacker = { ...mockPokemon(100), types: ['fire'] as Pokemon['types'] };
    const ghost = { ...mockPokemon(100), types: ['ghost'] as Pokemon['types'] };

    const damage = BattleEngine.calculateDamage(attacker, ghost, STRUGGLE_MOVE, false, () => 0.99);
    const nonStabDamage = BattleEngine.calculateDamage(nonStabAttacker, ghost, STRUGGLE_MOVE, false, () => 0.99);

    expect(damage).toBeGreaterThan(0);
    expect(damage).toBe(nonStabDamage);
  });

  it('calculates percentage and max-HP recoil without recoil on a miss', () => {
    expect(BattleEngine.calculateRecoilDamage(100, 200, 25)).toBe(25);
    expect(BattleEngine.calculateRecoilDamage(100, 200, 0, 0.25)).toBe(50);
    expect(BattleEngine.calculateRecoilDamage(0, 200, 25)).toBe(0);
  });

  it('allows flinch only when the hit connects without knocking out the target', () => {
    expect(BattleEngine.shouldFlinch(30, 20, 100, () => 0.2)).toBe(true);
    expect(BattleEngine.shouldFlinch(30, 20, 100, () => 0.4)).toBe(false);
    expect(BattleEngine.shouldFlinch(30, 0, 100, () => 0)).toBe(false);
    expect(BattleEngine.shouldFlinch(30, 100, 100, () => 0)).toBe(false);
  });
});