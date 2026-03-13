import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Zap, Sword, Heart, Activity, Target } from 'lucide-react';
import { Pokemon } from '../../types';
import TypeBadge from './TypeBadge';

interface PokemonDetailsModalProps {
  pokemon: Pokemon | null;
  onClose: () => void;
}

export default function PokemonDetailsModal({ pokemon, onClose }: PokemonDetailsModalProps) {
  if (!pokemon) return null;

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
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
            <X size={24} />
          </button>
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
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-white/30">Esperienza</p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '40%' }} />
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
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(pokemon.stats[stat] / 255) * 100}%` }}
                      className="h-full bg-white/40"
                    />
                  </div>
                  <div className="w-12 text-right font-black text-sm">{pokemon.stats[stat]}</div>
                  <div className="w-16 text-right text-[10px] font-bold text-[#e63946]">
                    IV: {pokemon.ivs[stat]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Moves */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#e63946]">Parco Mosse</h3>
            <div className="grid grid-cols-1 gap-3">
              {pokemon.moves.map(move => (
                <div key={move.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
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
                    <p className="text-xs font-black">{move.power || '--'}</p>
                    <p className="text-[8px] uppercase opacity-30 font-bold">Potenza</p>
                  </div>
                </div>
              ))}
              {Array.from({ length: 4 - pokemon.moves.length }).map((_, i) => (
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
