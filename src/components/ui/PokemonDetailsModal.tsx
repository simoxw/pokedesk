import React from 'react';
import { useStore } from '../../store';

const NATURE_MODS: Record<string, { up: string; down: string }> = {
  Lonely: { up: 'attack', down: 'defense' }, Brave: { up: 'attack', down: 'speed' },
  Adamant: { up: 'attack', down: 'spAtk' }, Naughty: { up: 'attack', down: 'spDef' },
  Bold: { up: 'defense', down: 'attack' }, Relaxed: { up: 'defense', down: 'speed' },
  Impish: { up: 'defense', down: 'spAtk' }, Lax: { up: 'defense', down: 'spDef' },
  Timid: { up: 'speed', down: 'attack' }, Hasty: { up: 'speed', down: 'defense' },
  Jolly: { up: 'speed', down: 'spAtk' }, Naive: { up: 'speed', down: 'spDef' },
  Modest: { up: 'spAtk', down: 'attack' }, Mild: { up: 'spAtk', down: 'defense' },
  Quiet: { up: 'spAtk', down: 'speed' }, Rash: { up: 'spAtk', down: 'spDef' },
  Calm: { up: 'spDef', down: 'attack' }, Gentle: { up: 'spDef', down: 'defense' },
  Sassy: { up: 'spDef', down: 'speed' }, Careful: { up: 'spDef', down: 'spAtk' },
};

const STAT_LABELS_NATURE: Record<string, string> = {
  attack: 'Attacco', defense: 'Difesa', spAtk: 'Att.Sp.', spDef: 'Dif.Sp.', speed: 'Velocità',
};

import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Zap, Sword, Heart, Activity, Target } from 'lucide-react';
import { Pokemon } from '../../types';
import TypeBadge from './TypeBadge';
import { getExpForLevel, getExpProgress } from '../../utils/expUtils';

interface PokemonDetailsModalProps {
  pokemon: Pokemon | null;
  onClose: () => void;
}

export default function PokemonDetailsModal({ pokemon: initialPokemon, onClose }: PokemonDetailsModalProps) {
  const { favorites, toggleFavorite, updatePokemon, team, box } = useStore();
  
  // Sincronizza lo stato locale con lo store per aggiornamenti in tempo reale
  const pokemon = React.useMemo(() => {
    if (!initialPokemon) return null;
    return team.find(p => p.id === initialPokemon.id) || 
           box.find(p => p.id === initialPokemon.id) || 
           initialPokemon;
  }, [initialPokemon, team, box]);

  const [movesDraft, setMovesDraft] = React.useState<Pokemon['moves']>([]);

  React.useEffect(() => {
    if (!pokemon) {
      setMovesDraft([]);
      return;
    }

    setMovesDraft(pokemon.moves);
  }, [pokemon?.id, pokemon?.moves]);

  const reorderMoves = React.useCallback((fromIndex: number, toIndex: number) => {
    if (!pokemon) return;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= movesDraft.length || toIndex >= movesDraft.length) return;

    const reorderedMoves = [...movesDraft];
    [reorderedMoves[fromIndex], reorderedMoves[toIndex]] = [reorderedMoves[toIndex], reorderedMoves[fromIndex]];
    setMovesDraft(reorderedMoves);
    updatePokemon(pokemon.id, { moves: reorderedMoves });
  }, [movesDraft, pokemon, updatePokemon]);

  if (!pokemon) return null;

  const isFavorite = favorites.includes(pokemon.id);
  const natureMod = NATURE_MODS[pokemon.nature] ?? null;

  const statIcons = {
    hp: <Heart size={16} className="text-red-400" />,
    attack: <Sword size={16} className="text-orange-400" />,
    defense: <Shield size={16} className="text-blue-400" />,
    spAtk: <Zap size={16} className="text-purple-400" />,
    spDef: <Shield size={16} className="text-green-400" />,
    speed: <Activity size={16} className="text-yellow-400" />,
  };

  const statLabels = {
    hp: 'HP',
    attack: 'Attacco',
    defense: 'Difesa',
    spAtk: 'Att. Sp.',
    spDef: 'Dif. Sp.',
    speed: 'Velocità',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col p-6 overflow-y-auto"
      >
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#e63946] text-white text-xs font-black px-2 py-1 rounded-lg">
              Lv. {pokemon.level}
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">{pokemon.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(pokemon.id)}
              className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400'}`}
            >
              ★
            </button>
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
              <X size={24} />
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-8 pb-12">
          {/* Main Info */}
          <div className="flex gap-6 items-center bg-white/5 rounded-3xl p-6 border border-white/5">
            <div className="relative">
              <img 
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokemonId}.png`}
                alt={pokemon.name}
                className="w-40 h-40 object-contain drop-shadow-2xl"
              />
              {pokemon.isShiny && (
                <div className="absolute top-0 right-0 text-yellow-400">
                  <Zap size={24} fill="currentColor" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex gap-2">
                {pokemon.types.map(t => <TypeBadge key={t} type={t} />)}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-white/30">Natura</p>
                <p className="font-bold text-lg">{pokemon.nature}</p>
                {natureMod ? (
                  <p className="text-[11px] font-bold">
                    <span className="text-green-400">+{STAT_LABELS_NATURE[natureMod.up]}</span>
                    <span className="text-white/30"> / </span>
                    <span className="text-red-400">-{STAT_LABELS_NATURE[natureMod.down]}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-white/30">Neutrale</p>
                )}
              </div>
              <div className="mb-4"> 
                <div className="flex justify-between items-center mb-1"> 
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Esperienza</span> 
                  {pokemon.level < 100 && ( 
                    <span className="text-[10px] text-white/40"> 
                      {getExpProgress(pokemon).current} / {getExpProgress(pokemon).needed} al prossimo lv. 
                    </span> 
                  )} 
                </div> 
                <div className="w-full bg-white/10 rounded-full h-2"> 
                  <div 
                    className="h-2 rounded-full bg-blue-400 transition-all" 
                    style={{ width: `${getExpProgress(pokemon).percent}%` }} 
                  /> 
                </div> 
              </div>
            </div>
          </div>

          {/* Stats & IVs */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#e63946]">Statistiche & Potenziali (IV)</h3>
            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
              {(Object.keys(pokemon.stats) as Array<keyof typeof pokemon.stats>).map(stat => (
                <div key={stat} className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">{statIcons[stat]}</div>
                  <div className="w-20 text-xs font-bold uppercase opacity-50">{statLabels[stat]}</div>
                  <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden relative"> 
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(pokemon.stats[stat] / 255) * 100}%` }}
                      className="h-full bg-white/40"
                    />
                  </div>
                  <div className="w-8 text-right font-black text-sm">{pokemon.stats[stat]}</div>
                  <div className="flex gap-2 text-[10px] font-bold whitespace-nowrap"> 
                    <span className={pokemon.ivs[stat] === 31 ? 'text-green-400' : 'text-[#e63946]'}>IV:{pokemon.ivs[stat]}</span> 
                    <span className="text-emerald-400">EV:{pokemon.evs[stat]}</span> 
                  </div> 
                </div>
              ))}
            </div>
          </div>

          {/* Moves */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#e63946]">Parco Mosse</h3>
            <div className="grid grid-cols-1 gap-3">
              {movesDraft.map((move, idx) => ( 
                 <div key={`${move.id}-${idx}`} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4"> 
                   <div className="flex flex-col gap-1 shrink-0"> 
                     <button 
                       onClick={() => { 
                         if (idx === 0) return; 
                         reorderMoves(idx, idx - 1);
                       }} 
                       disabled={idx === 0} 
                       className="w-5 h-5 rounded bg-white/10 flex items-center justify-center disabled:opacity-20 text-[10px] leading-none" 
                     >▲</button> 
                     <button 
                       onClick={() => { 
                         if (idx === movesDraft.length - 1) return; 
                         reorderMoves(idx, idx + 1);
                       }} 
                       disabled={idx === movesDraft.length - 1} 
                       className="w-5 h-5 rounded bg-white/10 flex items-center justify-center disabled:opacity-20 text-[10px] leading-none" 
                     >▼</button> 
                   </div> 
                   <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0"> 
                     <TypeBadge type={move.type} small /> 
                   </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-black uppercase text-sm">{move.name}</h4>
                      <span className="text-[10px] font-bold opacity-50">PP {move.pp}/{move.maxPp}</span>
                    </div>
                    <p className="text-[10px] text-white/50 leading-tight line-clamp-2">{move.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs font-black">POT. {move.power || '--'}</div>
                      <div className={`text-[8px] uppercase font-bold ${
                        move.category === 'physical' ? 'text-orange-400' :
                        move.category === 'special' ? 'text-purple-400' :
                        'text-gray-400'
                      }`}>
                        {move.category === 'physical' ? 'FIS.' :
                         move.category === 'special' ? 'SP.' :
                         'STATO'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({ length: 4 - movesDraft.length }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 border border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-xs opacity-20 italic">Slot Vuoto</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
