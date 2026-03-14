import React from 'react';
import { PokemonType } from '../../types';

const TYPE_COLORS: Record<PokemonType, string> = {
  normal: 'bg-[#A8A77A]',
  fire: 'bg-[#EE8130]',
  water: 'bg-[#6390F0]',
  electric: 'bg-[#F7D02C]',
  grass: 'bg-[#7AC74C]',
  ice: 'bg-[#96D9D6]',
  fighting: 'bg-[#C22E28]',
  poison: 'bg-[#A33EA1]',
  ground: 'bg-[#E2BF65]',
  flying: 'bg-[#A98FF3]',
  psychic: 'bg-[#F95587]',
  bug: 'bg-[#A6B91A]',
  rock: 'bg-[#B6A136]',
  ghost: 'bg-[#735797]',
  dragon: 'bg-[#6F35FC]',
  steel: 'bg-[#B7B7CE]',
  fairy: 'bg-[#D685AD]',
  dark: 'bg-[#705746]',
};

export default function TypeBadge({ type, small = false }: { type: PokemonType, small?: boolean, key?: any }) {
  return (
    <span className={`${TYPE_COLORS[type] || 'bg-gray-500'} text-white font-bold uppercase rounded px-2 py-0.5 ${small ? 'text-[8px]' : 'text-[10px]'}`}>
      {type}
    </span>
  );
}
