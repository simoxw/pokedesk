import React from 'react';
import { Pokemon } from '../../types';
import { motion } from 'motion/react';
import TypeBadge from './TypeBadge';
import { Sparkles } from 'lucide-react';

export default function PokemonCard({ pokemon, onClick, onLongPress }: { pokemon: Pokemon, onClick?: () => void, onLongPress?: () => void, key?: any }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.();
      }}
      className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-3 flex flex-col items-center relative overflow-hidden group"
    >
      <div className="absolute top-2 right-2 text-[10px] font-bold opacity-30">Lv.{pokemon.level}</div>
      
      <div className="relative mb-2">
        <img 
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.isShiny ? 'shiny/' : ''}${pokemon.pokemonId}.png`}
          alt={pokemon.name}
          className="w-20 h-20 object-contain drop-shadow-lg group-hover:scale-110 transition-transform"
        />
        {pokemon.isShiny && (
          <div className="absolute -top-1 -right-1 text-yellow-400">
            <Sparkles size={14} />
          </div>
        )}
      </div>

      <h3 className="text-xs font-black truncate w-full text-center uppercase mb-2">{pokemon.name}</h3>
      
      <div className="flex gap-1">
        {pokemon.types.map(t => <TypeBadge key={t} type={t} small />)}
      </div>
    </motion.div>
  );
}
