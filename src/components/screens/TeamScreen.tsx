import React, { useState } from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Trash2, Shield, Box, Info } from 'lucide-react';
import HPBar from '../ui/HPBar';
import TypeBadge from '../ui/TypeBadge';
import PokemonDetailsModal from '../ui/PokemonDetailsModal';

export default function TeamScreen() {
  const { team, setScreen, removeFromTeam } = useStore();
  const [selectedPkmn, setSelectedPkmn] = useState<any>(null);

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
        {Array.from({ length: 4 }).map((_, i) => {
          const pokemon = team[i];
          if (!pokemon) {
            return (
              <div key={i} className="h-32 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 font-bold">
                SLOT VUOTO
              </div>
            );
          }

          return (
            <motion.div
              key={pokemon.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/5"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-white/5 rounded-xl p-2 relative flex items-center justify-center">
                  <img 
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`}
                    alt={pokemon.name}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute -top-2 -left-2 bg-[#e63946] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Lv. {pokemon.level}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg uppercase">{pokemon.name}</h3>
                      <div className="flex gap-1 mt-1">
                        {pokemon.types.map(t => <TypeBadge key={t} type={t} />)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => setSelectedPkmn(pokemon)}
                        className="p-2 text-white/30 hover:text-blue-400 transition-colors"
                      >
                        <Info size={18} />
                      </button>
                      <button 
                        onClick={() => removeFromTeam(i)}
                        className="p-2 text-white/30 hover:text-red-500 transition-colors"
                      >
                        <Box size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-white/50 mb-1">
                      <span>HP</span>
                      <span>{pokemon.currentHp} / {pokemon.stats.hp}</span>
                    </div>
                    <HPBar current={pokemon.currentHp} max={pokemon.stats.hp} />
                  </div>
                </div>
              </div>

              {/* Moves List */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {pokemon.moves.map(move => (
                  <div key={move.id} className="bg-white/5 rounded-lg p-2 flex flex-col border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase opacity-70 truncate">{move.name}</span>
                      <span className="text-[10px] opacity-50">{move.pp}/{move.maxPp}</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400" 
                        style={{ width: `${(move.pp / move.maxPp) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {Array.from({ length: 4 - pokemon.moves.length }).map((_, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-2 border border-dashed border-white/10 flex items-center justify-center">
                    <span className="text-[10px] opacity-20 italic">Slot Vuoto</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <PokemonDetailsModal 
        pokemon={selectedPkmn} 
        onClose={() => setSelectedPkmn(null)} 
      />

      <div className="p-6 bg-[#1a1a2e]/50 border-t border-white/5">
        <p className="text-xs text-white/30 italic text-center">
          Tocca l'icona del Box per spostare un Pokémon nella memoria.
        </p>
      </div>
    </div>
  );
}
