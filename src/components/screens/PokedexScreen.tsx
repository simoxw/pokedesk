import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Info } from 'lucide-react';
import TypeBadge from '../ui/TypeBadge';

export default function PokedexScreen() {
  const { pokedex, setScreen } = useStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const entries = Array.from({ length: 721 }, (_, i) => i + 1);

  const handleSelect = async (id: number) => {
    if (!pokedex[id]) return;
    setLoading(true);
    try {
      const data = await api.getPokemon(id);
      const species = await api.getSpecies(id);
      setSelected({ ...data, species });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0f0f1a]">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Pokédex</h2>
      </header>

      <div className="grid grid-cols-4 gap-2 overflow-y-auto flex-1 pb-24 no-scrollbar">
        {entries.map(id => {
          const status = pokedex[id];
          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className={`aspect-square rounded-xl flex items-center justify-center relative overflow-hidden transition-all ${
                status === 'caught' ? 'bg-[#1a1a2e] border border-white/10' : 
                status === 'seen' ? 'bg-[#1a1a2e]/50 border border-white/5 grayscale' : 
                'bg-black/20 opacity-20'
              }`}
            >
              <span className="absolute top-1 left-1 text-[8px] font-mono opacity-30">#{id.toString().padStart(3, '0')}</span>
              {status && (
                <img 
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
                  className="w-full h-full object-contain p-1"
                />
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1a1a2e] w-full max-w-sm rounded-[32px] p-8 border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <img 
                src={selected.sprites.other['official-artwork'].front_default}
                className="w-48 h-48 object-contain mb-4"
              />
              <h3 className="text-3xl font-black uppercase mb-1">{api.getItalianName(selected.species.names)}</h3>
              <div className="flex gap-2 mb-6">
                {selected.types.map((t: any) => <TypeBadge key={t.type.name} type={t.type.name} />)}
              </div>
              <p className="text-center text-sm text-white/60 italic leading-relaxed">
                {api.getItalianDescription(selected.species.flavor_text_entries)}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
