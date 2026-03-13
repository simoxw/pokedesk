import React, { useState } from 'react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'motion/react';
import PokemonCard from '../ui/PokemonCard';
import PokemonDetailsModal from '../ui/PokemonDetailsModal';
import { ArrowLeft, Search, Filter, Trash2, Users, Info } from 'lucide-react';

export default function BoxScreen() {
  const { box, setScreen, addToTeam, releasePokemon, team } = useStore();
  const [search, setSearch] = useState('');
  const [selectedPkmn, setSelectedPkmn] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const filteredBox = box.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToTeam = (pkmn: any) => {
    if (team.length < 4) {
      addToTeam(pkmn, team.length);
      setSelectedPkmn(null);
    } else {
      alert("Squadra piena! Rimuovi un Pokémon prima.");
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0f0f1a]">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black uppercase">PC DI BILL</h2>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input 
          type="text"
          placeholder="Cerca Pokémon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1a1a2e] border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#e63946]/50"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 overflow-y-auto flex-1 pb-24 no-scrollbar">
        {filteredBox.map(pkmn => (
          <PokemonCard 
            key={pkmn.id} 
            pokemon={pkmn} 
            onClick={() => setSelectedPkmn(pkmn)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedPkmn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setSelectedPkmn(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-[#1a1a2e] rounded-t-[32px] p-8 flex flex-col gap-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-6">
                <img 
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selectedPkmn.isShiny ? 'shiny/' : ''}${selectedPkmn.pokemonId}.png`}
                  className="w-32 h-32 object-contain"
                />
                <div>
                  <h3 className="text-3xl font-black uppercase">{selectedPkmn.name}</h3>
                  <p className="text-[#e63946] font-bold">Livello {selectedPkmn.level}</p>
                  <div className="mt-2 text-xs text-white/50">
                    IV: {selectedPkmn.ivs.hp}/{selectedPkmn.ivs.attack}/{selectedPkmn.ivs.defense}...
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => handleAddToTeam(selectedPkmn)}
                  className="flex flex-col items-center justify-center gap-2 bg-[#e63946] py-4 rounded-2xl font-bold text-xs"
                >
                  <Users size={20} /> SQUADRA
                </button>
                <button 
                  onClick={() => setShowDetails(true)}
                  className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 py-4 rounded-2xl font-bold text-xs"
                >
                  <Info size={20} /> INFO
                </button>
                <button 
                  onClick={() => {
                    if(confirm(`Sei sicuro di voler liberare ${selectedPkmn.name}? Riceverai 3 Caramelle.`)) {
                      releasePokemon(selectedPkmn.id);
                      setSelectedPkmn(null);
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 py-4 rounded-2xl font-bold text-xs text-red-400"
                >
                  <Trash2 size={20} /> LIBERA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PokemonDetailsModal 
        pokemon={showDetails ? selectedPkmn : null} 
        onClose={() => setShowDetails(false)} 
      />
    </div>
  );
}
