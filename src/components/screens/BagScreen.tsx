import React, { useState } from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Package, Heart, Zap, Star } from 'lucide-react';

export default function BagScreen() {
  const { inventory, setScreen, useItem, team, box } = useStore();
  const [tab, setTab] = useState<'balls' | 'heal' | 'candy'>('balls');

  const items = {
    balls: [
      { id: 'pokeball', name: 'Pokéball', icon: '🔴' },
      { id: 'megaball', name: 'Megaball', icon: '🔵' },
      { id: 'ultraball', name: 'Ultraball', icon: '🟡' },
      { id: 'masterball', name: 'Masterball', icon: '🟣' },
    ],
    heal: [
      { id: 'potion', name: 'Pozione', icon: '🧪' },
      { id: 'superpotion', name: 'Superpozione', icon: '🧪' },
      { id: 'hyperpotion', name: 'Iperpozione', icon: '🧪' },
      { id: 'antidote', name: 'Antidoto', icon: '💊' },
    ],
    candy: [
        { id: 'rare_candy', name: 'Caramella Rara', icon: '🍬' },
        // Caramelle specie dinamiche dai pokemon in squadra/box 
        ...[...team, ...box].reduce((acc: any[], p) => { 
          const key = `candy_${p.baseSpeciesId ?? p.pokemonId}`; 
          if (!acc.find(i => i.id === key) && (inventory[key] || 0) > 0) { 
            acc.push({ id: key, name: `Caramella ${p.name}`, icon: '🍭' }); 
          } 
          return acc; 
        }, []), 
      ]
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0f0f1a]">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black">ZAINO</h2>
      </header>

      <div className="flex gap-2 mb-8 bg-[#1a1a2e] p-1 rounded-2xl">
        <TabButton active={tab === 'balls'} onClick={() => setTab('balls')} label="BALL" />
        <TabButton active={tab === 'heal'} onClick={() => setTab('heal')} label="CURE" />
        <TabButton active={tab === 'candy'} onClick={() => setTab('candy')} label="VARIE" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
        {items[tab].map(item => (
          <div 
            key={item.id}
            className={`flex items-center justify-between p-4 rounded-2xl border border-white/5 transition-all ${
              (inventory[item.id] || 0) > 0 ? 'bg-[#1a1a2e]' : 'bg-black/20 opacity-40'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h4 className="font-bold uppercase text-sm">{item.name}</h4>
                <p className="text-xs text-white/30">Posseduti: {inventory[item.id] || 0}</p>
              </div>
            </div>
            {(inventory[item.id] || 0) > 0 && tab !== 'balls' && (
              <button 
                className="bg-[#e63946] px-4 py-2 rounded-xl text-xs font-bold"
                onClick={() => alert("Seleziona un Pokémon per usare l'oggetto")}
              >
                USA
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${
        active ? 'bg-[#e63946] text-white shadow-lg' : 'text-white/40 hover:text-white/60'
      }`}
    >
      {label}
    </button>
  );
}
