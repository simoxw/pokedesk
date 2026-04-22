import React from 'react';
import { NATURE_MODS } from '../../BattleEngine';

interface NatureSelectorProps {
  currentNature: string;
  onSelect: (nature: string) => void;
}

const NATURE_ORDER = Object.keys(NATURE_MODS).sort();

const STAT_NAMES: Record<string, string> = {
  attack: 'Attacco',
  defense: 'Difesa',
  spAtk: 'Att. Sp.',
  spDef: 'Dif. Sp.',
  speed: 'Velocità',
  hp: 'PS',
};

export default function NatureSelector({ currentNature, onSelect }: NatureSelectorProps) {
  // Ordina nature: prima quella corrente, poi le altre alfabeticamente
  const sortedNatures = NATURE_ORDER.sort((a, b) => {
    if (a === currentNature) return -1;
    if (b === currentNature) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="w-full">
      <div className="grid grid-cols-5 gap-2">
        {sortedNatures.map((nature) => {
          const mod = NATURE_MODS[nature];
          const isSelected = nature === currentNature;
          
          return (
            <button
              key={nature}
              onClick={() => onSelect(nature)}
              className={`rounded-lg p-2 text-[10px] font-bold transition-all border-2 flex flex-col gap-1 ${ 
                isSelected
                  ? 'bg-[#e63946] border-[#e63946] text-white shadow-lg scale-105'
                  : 'bg-[#1a1a2e] border-white/10 text-white hover:border-white/20'
              }`}
              title={`${nature}: +10% ${STAT_NAMES[mod.up]}, -10% ${STAT_NAMES[mod.down]}`}
            >
              <span className="font-black">{nature}</span>
              <span className="text-green-400">+{STAT_NAMES[mod.up]}</span>
              <span className="text-red-400">-{STAT_NAMES[mod.down]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
