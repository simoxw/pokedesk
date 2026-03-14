import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowLeft, Trash2, Shield, Box, Info } from 'lucide-react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import HPBar from '../ui/HPBar';
import TypeBadge from '../ui/TypeBadge';
import PokemonDetailsModal from '../ui/PokemonDetailsModal';

function SortableItem({ pokemon, index, onRemove, onSelect, onUseCandy, onCandyCount }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pokemon.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/5 flex gap-4 items-center">
      <button {...attributes} {...listeners} className="text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing p-1">
        <GripVertical size={20} />
      </button>
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
            className="bg-green-400 h-1.5 rounded-full"
            style={{ width: `${(pokemon.currentHp / pokemon.stats.hp) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button onClick={() => onSelect(pokemon)} className="p-2 bg-white/5 rounded-xl">
          <Info size={16} />
        </button>
        <button 
          onClick={() => onUseCandy(pokemon)} 
          className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400" 
          title={`Caramelle: ${onCandyCount(pokemon.baseSpeciesId ?? pokemon.pokemonId)}`} 
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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = team.findIndex(p => p.id === active.id);
    const newIndex = team.findIndex(p => p.id === over.id);
    reorderTeam(oldIndex, newIndex);
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={team.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {team.map((pokemon, i) => (
              <SortableItem
                key={pokemon.id}
                pokemon={pokemon}
                index={i}
                onRemove={removeFromTeam}
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
          </SortableContext>
        </DndContext>
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
          Tocca l'icona del Box per spostare un Pokémon nella memoria.
        </p>
      </div>
    </div>
  );
}
