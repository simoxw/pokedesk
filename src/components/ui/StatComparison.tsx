import React from 'react';
import { BattleEngine } from '../../BattleEngine';
import { Pokemon } from '../../store/types';

interface StatComparisonProps {
  pokemon: Pokemon;
  oldNature: string;
  newNature: string;
}

const STAT_LABELS: Record<string, string> = {
  hp: 'PS',
  attack: 'Attacco',
  defense: 'Difesa',
  spAtk: 'Att. Sp.',
  spDef: 'Dif. Sp.',
  speed: 'Velocità',
};

export default function StatComparison({ pokemon, oldNature, newNature }: StatComparisonProps) {
  const oldStats = BattleEngine.calculateStats(
    pokemon.level,
    pokemon.baseStats,
    pokemon.ivs,
    pokemon.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
    oldNature
  );

  const newStats = BattleEngine.calculateStats(
    pokemon.level,
    pokemon.baseStats,
    pokemon.ivs,
    pokemon.evs ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
    newNature
  );

  const statKeys: Array<keyof typeof STAT_LABELS> = [
    'hp',
    'attack',
    'defense',
    'spAtk',
    'spDef',
    'speed',
  ];

  return (
    <div className="w-full space-y-2">
      {statKeys.map((stat) => {
        const oldValue = oldStats[stat];
        const newValue = newStats[stat];
        const diff = newValue - oldValue;
        const isImproved = diff > 0;
        const isReduced = diff < 0;

        return (
          <div key={stat} className="flex items-center gap-2 bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="w-16 text-xs font-bold text-white/70 uppercase">
              {STAT_LABELS[stat]}
            </div>
            <div className="flex-1 flex items-center gap-3">
              {/* Old value */}
              <div className="flex-1 text-center">
                <div className="text-xs text-white/50">Attuale</div>
                <div className="text-sm font-bold text-white">{oldValue}</div>
              </div>

              {/* Arrow */}
              <div
                className={`text-lg font-black ${ 
                  isImproved ? 'text-green-400' : isReduced ? 'text-red-400' : 'text-white/30'
                }`}
              >
                {isImproved ? '↑' : isReduced ? '↓' : '→'}
              </div>

              {/* New value */}
              <div className="flex-1 text-center">
                <div className="text-xs text-white/50">Nuovo</div>
                <div
                  className={`text-sm font-bold ${ 
                    isImproved ? 'text-green-400' : isReduced ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {newValue}
                </div>
              </div>

              {/* Diff */}
              {diff !== 0 && (
                <div
                  className={`w-12 text-center text-xs font-black ${ 
                    isImproved ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {isImproved ? '+' : ''}{diff}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
