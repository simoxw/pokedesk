export function getExpForLevel(growthRate: string, level: number): number {
  switch (growthRate) {
    case 'slow': return Math.floor(5 * level ** 3 / 4);
    case 'medium-slow': return Math.max(0, Math.floor(6/5 * level**3 - 15*level**2 + 100*level - 140));
    case 'fast': return Math.floor(4 * level ** 3 / 5);
    default: return Math.floor(level ** 3); // medium
  }
}

export function getExpProgress(pokemon: any) {
  if (pokemon.level >= 100) return { current: 0, needed: 0, percent: 100 };
  const expThisLevel = getExpForLevel(pokemon.growthRate ?? 'medium', pokemon.level);
  const expNextLevel = getExpForLevel(pokemon.growthRate ?? 'medium', pokemon.level + 1);
  const needed = Math.max(0, expNextLevel - expThisLevel); // Protezione da negativo
  const totalExp = pokemon.exp || 0;
  // Se exp < soglia del livello attuale, lo trattiamo come 0 progresso (Pokémon vecchi)
  const current = totalExp < expThisLevel ? 0 : totalExp - expThisLevel;
  const percent = needed > 0 ? Math.min(100, Math.floor((current / needed) * 100)) : 100;
  return { current, needed, percent };
}