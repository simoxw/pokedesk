import React, { useState } from 'react';
import { ArrowLeft, Trash2, Info, ArrowUpDown } from 'lucide-react';
import { useStore } from '../../store';
import PokemonDetailsModal from '../ui/PokemonDetailsModal';

function getExpForLevel(growthRate: string, level: number): number { 
  if (level >= 100) return 0; 
  switch (growthRate) { 
    case 'slow': return Math.floor(5 * level ** 3 / 4); 
    case 'medium-slow': return Math.max(0, Math.floor(6/5 * level**3 - 15*level**2 + 100*level - 140)); 
    case 'fast': return Math.floor(4 * level ** 3 / 5); 
    default: return Math.floor(level ** 3); 
  } 
} 
function getExpProgress(pokemon: any) { 
  if (pokemon.level >= 100) return { current: 0, needed: 0, percent: 100 }; 
  const expThisLevel = getExpForLevel(pokemon.growthRate ?? 'medium', pokemon.level); 
  const expNextLevel = getExpForLevel(pokemon.growthRate ?? 'medium', pokemon.level + 1); 
  const needed = expNextLevel - expThisLevel; 
  const totalExp = pokemon.exp || 0; 
  // Se exp < soglia del livello attuale, lo trattiamo come 0 progresso (Pokémon vecchi) 
  const current = totalExp < expThisLevel ? 0 : totalExp - expThisLevel; 
  const percent = needed > 0 ? Math.min(100, Math.floor((current / needed) * 100)) : 100; 
  return { current, needed, percent }; 
} 

function PokemonSlot({ pokemon, index, onRemove, onSelect, onUseCandy, onCandyCount, isSelected, onTap }: any) { 
  return ( 
    <div 
      className={`bg-[#1a1a2e] rounded-2xl p-4 border-2 flex gap-4 items-center transition-all cursor-pointer ${ 
        isSelected ? 'border-[#e63946] bg-[#e63946]/10' : 'border-white/5' 
      }`} 
      onClick={() => onTap(index)} 
    > 
      {/* Indicatore posizione */} 
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${ 
        isSelected ? 'bg-[#e63946] text-white' : 'bg-white/10 text-white/40' 
      }`}> 
        {index + 1} 
      </div> 
      <img
        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`}
        alt={pokemon.name}
        className="w-16 h-16 object-contain"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm uppercase truncate">{pokemon.name}</span>
          <span className="text-[10px] bg-[#e63946] px-2 py-0.5 rounded-full font-bold">Lv.{pokemon.level}</span>
        </div>
        <div className="text-xs text-white/40 mt-1">HP {pokemon.currentHp}/{pokemon.stats.hp}</div>
        <div className="w-full bg-white/10 rounded-full h-1.5 mt-1"> 
          <div 
            className="h-1.5 rounded-full bg-green-400" 
            style={{ width: `${(pokemon.currentHp / pokemon.stats.hp) * 100}%` }} 
          /> 
        </div> 
        {pokemon.level < 100 && ( 
          <div className="w-full bg-white/10 rounded-full h-1 mt-1"> 
            <div 
              className="bg-blue-400 h-1 rounded-full" 
              style={{ width: `${getExpProgress(pokemon).percent}%` }} 
            /> 
          </div> 
        )} 
      </div>
      <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}> 
        <button onClick={() => onSelect(pokemon)} className="p-2 bg-white/5 rounded-xl"> 
          <Info size={16} /> 
        </button> 
        <button 
          onClick={() => onUseCandy(pokemon)} 
          className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400" 
          title={`Caramelle: ${onCandyCount(pokemon.pokemonId)}`} 
        > 
          🍭 
        </button> 
        <button onClick={() => onRemove(index)} className="p-2 bg-red-500/10 rounded-xl text-red-400"> 
          <Trash2 size={16} /> 
        </button> 
      </div> 
    </div> 
  ); 
} 

export default function TeamScreen() { 
  const { team, setScreen, removeFromTeam, reorderTeam, inventory, useSpeciesCandy, useRareCandy } = useStore(); 
  const [selectedPkmn, setSelectedPkmn] = useState<any>(null); 
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null); 
 
  const handleSlotTap = (index: number) => { 
    // Se non c'è pokemon in questo slot, ignora 
    if (!team[index]) { 
      setSelectedSlot(null); 
      return; 
    } 
    // Nessuno selezionato: seleziona questo 
    if (selectedSlot === null) { 
      setSelectedSlot(index); 
      return; 
    } 
    // Stesso slot: deseleziona 
    if (selectedSlot === index) { 
      setSelectedSlot(null); 
      return; 
    } 
    // Slot diverso: scambia posizione 
    reorderTeam(selectedSlot, index); 
    setSelectedSlot(null); 
  }; 

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a]">
      <div className="p-6 flex items-center gap-4 border-b border-white/5">
        <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black">LA TUA SQUADRA</h2>
        <span className="ml-auto text-white/50">{team.length}/4</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Hint riordino */} 
            {selectedSlot === null && team.length > 1 && ( 
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2 mb-2"> 
                <ArrowUpDown size={14} className="text-white/30" /> 
                <span className="text-[11px] text-white/30">Tocca un Pokémon per selezionarlo, poi tocca un altro per scambiare</span> 
              </div> 
            )} 
            {selectedSlot !== null && ( 
              <div className="flex items-center gap-2 bg-[#e63946]/20 border border-[#e63946]/30 rounded-xl px-4 py-2 mb-2"> 
                <ArrowUpDown size={14} className="text-[#e63946]" /> 
                <span className="text-[11px] text-[#e63946] font-bold"> 
                  {team[selectedSlot]?.name} selezionato — tocca un altro slot per scambiare 
                </span> 
                <button onClick={() => setSelectedSlot(null)} className="ml-auto text-white/40 text-xs">✕</button> 
              </div> 
            )} 
 
            {team.map((pokemon, i) => ( 
              <PokemonSlot 
                key={pokemon.id} 
                pokemon={pokemon} 
                index={i} 
                isSelected={selectedSlot === i} 
                onTap={handleSlotTap} 
                onRemove={(idx: number) => { removeFromTeam(idx); setSelectedSlot(null); }} 
                onSelect={setSelectedPkmn} 
                onUseCandy={(p: any) => { 
                  const candyKey = `candy_${p.baseSpeciesId ?? p.pokemonId}`; 
                  const owned = inventory[candyKey] || 0; 
                  if (p.level >= 99) { alert('Livello massimo!'); return; } 
                  if (owned >= 3) { 
                    useSpeciesCandy(p.id, p.baseSpeciesId ?? p.pokemonId); 
                    alert(`+1 livello con Caramella ${p.name}! (${owned - 3} rimaste)`); 
                  } else if ((inventory['rare_candy'] || 0) > 0) { 
                    if (confirm(`Poche caramelle (${owned}/3). Usare una Caramella Rara?`)) { 
                      useRareCandy(p.id); 
                    } 
                  } else { 
                    alert(`Caramelle ${p.name}: ${owned}/3 — cattura più ${p.name} per ottenerle!`); 
                  } 
                }} 
                onCandyCount={(speciesId: number) => inventory[`candy_${speciesId}`] || 0} 
              /> 
            ))} 
        {Array.from({ length: 4 - team.length }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 font-bold text-sm">
            SLOT VUOTO
          </div>
        ))}
      </div>

      <PokemonDetailsModal 
        pokemon={selectedPkmn} 
        onClose={() => setSelectedPkmn(null)} 
      />

      <div className="p-6 bg-[#1a1a2e]/50 border-t border-white/5">
        <p className="text-xs text-white/30 italic text-center">
          Tocca un Pokémon per riordinare la squadra o usa le icone per dettagli e caramelle.
        </p>
      </div>
    </div>
  );
}
