import React from 'react';
import { Pokemon, Move } from '../../types';
import { CheckSquare, Square, Sparkles } from 'lucide-react';
import PokemonSprite from './PokemonSprite';

interface PokemonCardProps {
  pokemon: Pokemon;
  viewMode: 'grid' | 'list';
  multiSelectMode: boolean;
  isSelected: boolean;
  isFavorite: boolean;
  onClick: (pokemon: Pokemon) => void;
  onToggleSelect: (id: string) => void;
}

const TYPE_COLORS: Record<string, { bg: string; border: string }> = {
  fire:     { bg: 'rgba(238,129,48,0.28)',  border: '#EE8130' },
  water:    { bg: 'rgba(99,144,240,0.28)',  border: '#6390F0' },
  grass:    { bg: 'rgba(122,199,76,0.28)',  border: '#7AC74C' },
  electric: { bg: 'rgba(247,208,44,0.28)',  border: '#F7D02C' },
  psychic:  { bg: 'rgba(249,85,135,0.28)', border: '#F95587' },
  ice:      { bg: 'rgba(150,217,214,0.28)', border: '#96D9D6' },
  dragon:   { bg: 'rgba(111,53,252,0.28)', border: '#6F35FC' },
  dark:     { bg: 'rgba(112,87,70,0.28)',  border: '#705746' },
  fairy:    { bg: 'rgba(214,133,173,0.28)', border: '#D685AD' },
  fighting: { bg: 'rgba(194,46,40,0.28)',  border: '#C22E28' },
  poison:   { bg: 'rgba(163,62,161,0.28)', border: '#A33EA1' },
  ground:   { bg: 'rgba(226,191,101,0.28)', border: '#E2BF65' },
  rock:     { bg: 'rgba(182,161,54,0.28)', border: '#B6A136' },
  ghost:    { bg: 'rgba(115,87,151,0.28)', border: '#735797' },
  steel:    { bg: 'rgba(183,183,206,0.28)', border: '#B7B7CE' },
  bug:      { bg: 'rgba(166,185,26,0.28)', border: '#A6B91A' },
  flying:   { bg: 'rgba(169,143,243,0.28)', border: '#A98FF3' },
  normal:   { bg: 'rgba(168,167,122,0.28)', border: '#A8A77A' },
};

const PokemonCard = React.memo(({
  pokemon,
  viewMode,
  multiSelectMode,
  isSelected,
  isFavorite,
  onClick,
  onToggleSelect
}: PokemonCardProps) => {
  const handleClick = () => {
    if (multiSelectMode) {
      onToggleSelect(pokemon.id);
    } else {
      onClick(pokemon);
    }
  };

  if (viewMode === 'grid') {
    return (
      <button
        onClick={handleClick}
        style={!multiSelectMode || !isSelected ? {
          background: `linear-gradient(135deg, ${TYPE_COLORS[pokemon.types[0]]?.bg ?? 'rgba(255,255,255,0.05)'} 0%, #13132a 70%)`,
          borderColor: TYPE_COLORS[pokemon.types[0]]?.border ?? '#ffffff15',
          borderWidth: 2,
        } : undefined}
        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all overflow-hidden ${
          multiSelectMode && isSelected
            ? 'border-2 border-[#e63946] bg-[#e63946]/20'
            : ''
        }`}
      >
        {multiSelectMode && (
          <div className="absolute top-0.5 left-0.5 z-10">
            {isSelected
              ? <CheckSquare size={10} className="text-[#e63946]" />
              : <Square size={10} className="text-white/20" />}
          </div>
        )}
        {pokemon.isShiny && (
          <span className="absolute top-0.5 right-0.5 text-yellow-400">
            <Sparkles size={8} />
          </span>
        )}
        {isFavorite && (
          <span className="absolute top-0.5 left-0.5 text-yellow-400 text-[9px] leading-none">★</span>
        )}
        <span className="absolute top-0.5 left-1 text-[7px] font-mono text-white/20">
          {String(pokemon.pokemonId).padStart(3, '0')}
        </span>
        <PokemonSprite
          pokemonId={pokemon.pokemonId}
          isShiny={pokemon.isShiny}
          className="w-full h-full object-contain scale-110"
          alt={pokemon.name}
        />
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 bg-black/40 pb-0.5">
          <span className="text-[8px] font-bold text-white/50">
            Lv.{pokemon.level}
          </span>
          {Object.values(pokemon.ivs).some((v: any) => v === 31) && (
            <div className="w-1 h-1 rounded-full bg-green-400 shadow-[0_0_4px_#4ade80]" />
          )}
        </div>
      </button>
    );
  }

  const ivTotal = pokemon.ivs.hp + pokemon.ivs.attack + pokemon.ivs.defense + pokemon.ivs.spAtk + pokemon.ivs.spDef + pokemon.ivs.speed;

  return (
    <button
      onClick={handleClick}
      className={`w-full bg-[#1a1a2e] rounded-xl border flex items-center gap-3 px-3 py-2 transition-all ${
        multiSelectMode && isSelected
          ? 'border-[#e63946] bg-[#e63946]/10'
          : 'border-white/5 active:border-[#e63946]'
      }`}
    >
      {multiSelectMode && (
        <div className="shrink-0">
          {isSelected
            ? <CheckSquare size={14} className="text-[#e63946]" />
            : <Square size={14} className="text-white/20" />}
        </div>
      )}
      <div className="relative shrink-0">
        <PokemonSprite
          pokemonId={pokemon.pokemonId}
          isShiny={pokemon.isShiny}
          className="w-12 h-12 object-contain"
          alt={pokemon.name}
        />
        {pokemon.isShiny && (
          <span className="absolute -top-1 -right-1 text-yellow-400">
            <Sparkles size={10} />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="font-black text-sm uppercase truncate">{pokemon.name}</span>
          {isFavorite && <span className="text-yellow-400 text-xs shrink-0">★</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-white/40">#{String(pokemon.pokemonId).padStart(3, '0')}</span>
          <span className="text-[10px] text-[#e63946] font-bold">Lv.{pokemon.level}</span>
          <span className="text-[10px] text-white/30">{pokemon.nature}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="flex gap-0.5 justify-end">
          {Object.entries(pokemon.ivs).map(([stat, val]) => (
            <span key={stat} className={`text-[7px] font-bold ${(val as number) === 31 ? 'text-green-400' : 'text-white/20'}`}>
              {val as number}
            </span>
          ))}
        </div>
        <div className="text-[10px] font-black text-white/40">IV {ivTotal}</div>
        <div className="flex gap-1 mt-1 justify-end">
          {pokemon.types.map(t => (
            <span key={t} className="text-[8px] font-bold uppercase bg-white/10 px-1.5 py-0.5 rounded text-white/50">{t}</span>
          ))}
        </div>
      </div>
    </button>
  );
});

export default PokemonCard;
