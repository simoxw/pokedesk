import React, { useState } from 'react';

interface Props {
  pokemonId: number;
  isShiny?: boolean;
  back?: boolean;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

function buildUrl(pokemonId: number, isShiny: boolean, back: boolean, attempt: number): string {
  const shinyPath = isShiny ? 'shiny/' : '';
  const backPath = back ? 'back/' : '';
  switch (attempt) {
    case 0:
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${backPath}${shinyPath}${pokemonId}.png`;
    case 1:
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
    case 2:
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
    default:
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
  }
}

export default function PokemonSprite({ pokemonId, isShiny = false, back = false, className, alt, style }: Props) {
  const [attempt, setAttempt] = useState(0);

  const handleError = () => {
    setAttempt(prev => Math.min(prev + 1, 2));
  };

  return (
    <img
      src={buildUrl(pokemonId, isShiny, back, attempt)}
      alt={alt ?? `Pokemon ${pokemonId}`}
      className={className}
      style={style}
      loading="lazy"
      onError={handleError}
    />
  );
}