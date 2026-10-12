import { describe, expect, it } from 'vitest';
import { MASTER_TRAINERS } from './leagueData';

describe('Master trainer teams', () => {
  it.each([
    ['kukui', 'kukui'],
    ['wallace', 'wallace'],
    ['iris', 'iris'],
    ['mustard', 'mustard'],
  ])('defines %s with a complete optimized level-100 team', (trainerId, spriteFile) => {
    const trainer = MASTER_TRAINERS.find((entry) => entry.id === trainerId);

    expect(trainer).toBeDefined();
    expect(trainer?.spriteFile).toBe(spriteFile);
    expect(trainer?.pokemon).toHaveLength(4);

    for (const pokemon of trainer!.pokemon) {
      expect(pokemon.level).toBe(100);
      expect(pokemon.nature).toBeTruthy();
      expect(pokemon.moves).toHaveLength(4);
      expect(Object.values(pokemon.ivs ?? {}).every((iv) => iv === 0 || iv === 31)).toBe(true);
      expect(Object.values(pokemon.evs ?? {}).reduce((total, ev) => total + ev, 0)).toBeLessThanOrEqual(510);
      expect(Object.values(pokemon.evs ?? {}).every((ev) => ev >= 0 && ev <= 252)).toBe(true);
    }
  });
});