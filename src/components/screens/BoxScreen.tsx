import React, { useState } from 'react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'motion/react';
import PokemonCard from '../ui/PokemonCard';
import PokemonDetailsModal from '../ui/PokemonDetailsModal';
import { ArrowLeft, Search, Filter, Trash2, Users, Info } from 'lucide-react';

export default function BoxScreen() {
  const { box, setScreen, addToTeam, releasePokemon, team, inventory, useSpeciesCandy } = useStore();
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

              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => handleAddToTeam(selectedPkmn)}
                  className="flex flex-col items-center justify-center gap-2 bg-[#e63946] py-4 rounded-2xl font-bold text-[10px]"
                >
                  <Users size={18} /> SQUADRA
                </button>
                <button 
                  onClick={() => { 
                    const candyKey = `candy_${selectedPkmn.baseSpeciesId ?? selectedPkmn.pokemonId}`; 
                    const owned = inventory[candyKey] || 0; 
                    if (owned < 3) { 
                      alert(`Caramelle ${selectedPkmn.name}: ${owned}/3 — ne servono 3 per salire di livello!`); 
                    } else if (selectedPkmn.level >= 99) { 
                      alert('Livello massimo raggiunto!'); 
                    } else { 
                      useSpeciesCandy(selectedPkmn.id, selectedPkmn.baseSpeciesId ?? selectedPkmn.pokemonId); 
                      alert(`${selectedPkmn.name} è salito al livello ${selectedPkmn.level + 1}! (3 caramelle usate)`); 
                    } 
                  }} 
                  className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 py-4 rounded-2xl font-bold text-[10px] text-yellow-400" 
                > 
                  <span className="text-xl">🍭</span> 
                  CARAMELLA 
                  <span className="text-[8px] text-white/40"> 
                    {inventory[`candy_${selectedPkmn.baseSpeciesId ?? selectedPkmn.pokemonId}`] || 0} poss. 
                  </span> 
                </button> 
                <button 
                  onClick={() => setShowDetails(true)}
                  className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 py-4 rounded-2xl font-bold text-[10px]"
                >
                  <Info size={18} /> INFO
                </button>
                <button 
                  onClick={() => {
                    if(confirm(`Sei sicuro di voler liberare ${selectedPkmn.name}? Riceverai 1 Caramella ${selectedPkmn.name}.`)) {
                      releasePokemon(selectedPkmn.id);
                      setSelectedPkmn(null);
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 bg-white/5 border border-white/10 py-4 rounded-2xl font-bold text-[10px] text-red-400"
                >
                  <Trash2 size={18} /> LIBERA
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
