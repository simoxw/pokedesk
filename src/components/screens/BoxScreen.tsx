import React, { useState, useMemo } from 'react'; 
import { useStore } from '../../store'; 
import { motion, AnimatePresence } from 'motion/react'; 
import PokemonDetailsModal from '../ui/PokemonDetailsModal'; 
import TypeBadge from '../ui/TypeBadge'; 
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Sparkles, Users, Trash2, Info, SlidersHorizontal, X, CheckSquare, Square } from 'lucide-react'; 

const BOX_SIZE = 30; 
const TYPE_LIST = ['fire','water','grass','electric','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','steel','dark','fairy','normal']; 

type SortKey = 'name' | 'level' | 'number' | 'type'; 

export default function BoxScreen() { 
  const { box, setScreen, addToTeam, releasePokemon, team, inventory, useSpeciesCandy } = useStore(); 
  const [currentBox, setCurrentBox] = useState(0); 
  const [search, setSearch] = useState(''); 
  const [filterType, setFilterType] = useState<string | null>(null); 
  const [sortBy, setSortBy] = useState<SortKey>('number'); 
  const [showFilters, setShowFilters] = useState(false); 
  const [selectedPkmn, setSelectedPkmn] = useState<any>(null); 
  const [showDetails, setShowDetails] = useState(false); 
  const [multiSelectMode, setMultiSelectMode] = useState(false); 
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()); 

  const toggleSelect = (id: string) => { 
    setSelectedIds(prev => { 
      const next = new Set(prev); 
      next.has(id) ? next.delete(id) : next.add(id); 
      return next; 
    }); 
  }; 

  const handleMultiRelease = () => { 
    if (selectedIds.size === 0) return; 
    const names = [...selectedIds].map(id => box.find(p => p.id === id)?.name).filter(Boolean).join(', '); 
    if (!confirm(`Liberare ${selectedIds.size} Pokémon? (${names})\nRiceverai 1 Caramella per ognuno.`)) return; 
    selectedIds.forEach(id => releasePokemon(id)); 
    setSelectedIds(new Set()); 
    setMultiSelectMode(false); 
  }; 

  // Filtra e ordina 
  const filtered = useMemo(() => { 
    let result = [...box]; 
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase())); 
    if (filterType) result = result.filter(p => p.types.includes(filterType as any)); 
    result.sort((a, b) => { 
      if (sortBy === 'name') return a.name.localeCompare(b.name); 
      if (sortBy === 'level') return b.level - a.level; 
      if (sortBy === 'type') return a.types[0].localeCompare(b.types[0]); 
      return a.pokemonId - b.pokemonId; // number 
    }); 
    return result; 
  }, [box, search, filterType, sortBy]); 

  const totalBoxes = Math.max(1, Math.ceil(filtered.length / BOX_SIZE)); 
  const currentBoxPkmn = filtered.slice(currentBox * BOX_SIZE, (currentBox + 1) * BOX_SIZE); 
  // Slots vuoti per riempire la griglia 5x6=30 
  const emptySlots = BOX_SIZE - currentBoxPkmn.length; 

  const handleAddToTeam = (pkmn: any) => { 
    if (team.length < 4) { addToTeam(pkmn, team.length); setSelectedPkmn(null); } 
    else alert('Squadra piena!'); 
  }; 

  return ( 
    <div className="h-full flex flex-col bg-[#0f0f1a]"> 

      {/* Header */} 
      <div className="px-4 pt-5 pb-3"> 
        <div className="flex items-center gap-3 mb-3"> 
          <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl"> 
            <ArrowLeft size={20} /> 
          </button> 
          <h2 className="text-xl font-black uppercase flex-1">PC di Bill</h2> 
          <span className="text-xs text-white/30 font-bold">{box.length} PKM</span> 
          <button 
            onClick={() => { 
              setMultiSelectMode(m => !m); 
              setSelectedIds(new Set()); 
            }} 
            className={`p-2 rounded-xl border transition-all ${multiSelectMode ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10'}`} 
          > 
            <CheckSquare size={18} /> 
          </button> 
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10'}`} 
          > 
            <SlidersHorizontal size={18} /> 
          </button> 
        </div> 

        {/* Search */} 
        <div className="relative mb-2"> 
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} /> 
          <input 
            type="text" 
            placeholder="Cerca per nome..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setCurrentBox(0); }} 
            className="w-full bg-[#1a1a2e] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#e63946]/50" 
          /> 
          {search && ( 
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"> 
              <X size={14} /> 
            </button> 
          )} 
        </div> 

        {/* Filtri espandibili */} 
        <AnimatePresence> 
          {showFilters && ( 
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              className="overflow-hidden" 
            > 
              {/* Ordina per */} 
              <div className="flex gap-2 mb-2 pt-1"> 
                {(['number','name','level','type'] as SortKey[]).map(s => ( 
                  <button 
                    key={s} 
                    onClick={() => setSortBy(s)} 
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${ 
                      sortBy === s ? 'bg-[#e63946]' : 'bg-[#1a1a2e] text-white/40' 
                    }`} 
                  > 
                    {s === 'number' ? '#' : s === 'name' ? 'Nome' : s === 'level' ? 'Lv.' : 'Tipo'} 
                  </button> 
                ))} 
              </div> 

              {/* Filtro tipo */} 
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar"> 
                <button 
                  onClick={() => { setFilterType(null); setCurrentBox(0); }} 
                  className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-black transition-all ${ 
                    !filterType ? 'bg-[#e63946]' : 'bg-[#1a1a2e] text-white/40' 
                  }`} 
                > 
                  TUTTI 
                </button> 
                {TYPE_LIST.map(t => ( 
                  <button 
                    key={t} 
                    onClick={() => { setFilterType(filterType === t ? null : t); setCurrentBox(0); }} 
                    className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all border ${ 
                      filterType === t ? 'border-white/40 bg-white/10' : 'border-white/5 bg-[#1a1a2e] text-white/40' 
                    }`} 
                  > 
                    <TypeBadge type={t as any} small /> 
                  </button> 
                ))} 
              </div> 
            </motion.div> 
          )} 
        </AnimatePresence> 
      </div> 

      {/* Navigatore box */} 
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-y border-white/5"> 
        <button 
          onClick={() => setCurrentBox(b => Math.max(0, b - 1))} 
          disabled={currentBox === 0} 
          className="p-1.5 rounded-lg disabled:opacity-20 active:bg-white/10" 
        > 
          <ChevronLeft size={18} /> 
        </button> 
        <div className="text-center"> 
          <span className="font-black text-sm"> 
            {search || filterType ? 'RISULTATI' : `BOX ${currentBox + 1}`} 
          </span> 
          <span className="text-[10px] text-white/30 ml-2"> 
            {currentBoxPkmn.length}/{BOX_SIZE} 
          </span> 
        </div> 
        <button 
          onClick={() => setCurrentBox(b => Math.min(totalBoxes - 1, b + 1))} 
          disabled={currentBox >= totalBoxes - 1} 
          className="p-1.5 rounded-lg disabled:opacity-20 active:bg-white/10" 
        > 
          <ChevronRight size={18} /> 
        </button> 
      </div> 

      {/* Griglia 5x6 */} 
      <div className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar"> 
        {box.length === 0 ? ( 
          <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3"> 
            <span className="text-5xl">📦</span> 
            <p className="font-bold text-sm">Il box è vuoto</p> 
          </div> 
        ) : ( 
          <div className="grid grid-cols-5 gap-2"> 
            {currentBoxPkmn.map(pkmn => ( 
               <button 
                 key={pkmn.id} 
                 onClick={() => multiSelectMode ? toggleSelect(pkmn.id) : setSelectedPkmn(pkmn)} 
                 className={`aspect-square bg-[#1a1a2e] rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-all p-1 ${ 
                   multiSelectMode && selectedIds.has(pkmn.id) 
                     ? 'border-[#e63946] bg-[#e63946]/20' 
                     : 'border-white/5 active:border-[#e63946]' 
                 }`} 
               > 
                 {multiSelectMode && ( 
                   <div className="absolute top-0.5 left-0.5 z-10"> 
                     {selectedIds.has(pkmn.id) 
                       ? <CheckSquare size={10} className="text-[#e63946]" /> 
                       : <Square size={10} className="text-white/20" />} 
                   </div> 
                 )} 
                 {pkmn.isShiny && ( 
                   <span className="absolute top-0.5 right-0.5 text-yellow-400"> 
                     <Sparkles size={8} /> 
                   </span> 
                 )} 
                 <span className="absolute top-0.5 left-1 text-[7px] font-mono text-white/20"> 
                   {String(pkmn.pokemonId).padStart(3,'0')} 
                 </span> 
                 <img 
                   src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkmn.isShiny ? 'shiny/' : ''}${pkmn.pokemonId}.png`} 
                   className="w-full h-full object-contain" 
                 /> 
                 <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold text-white/50 bg-black/30 pb-0.5"> 
                   Lv.{pkmn.level} 
                 </span> 
               </button> 
            ))} 
            {/* Slot vuoti */} 
            {Array.from({ length: emptySlots }).map((_, i) => ( 
              <div 
                key={`empty-${i}`} 
                className="aspect-square bg-[#111122] rounded-xl border border-white/5 border-dashed opacity-30" 
              /> 
            ))} 
          </div> 
        )} 

        {/* Paginazione box multipli */} 
        {totalBoxes > 1 && ( 
          <div className="flex justify-center gap-1.5 mt-3"> 
            {Array.from({ length: totalBoxes }).map((_, i) => ( 
              <button 
                key={i} 
                onClick={() => setCurrentBox(i)} 
                className={`w-2 h-2 rounded-full transition-all ${ 
                  i === currentBox ? 'bg-[#e63946] w-4' : 'bg-white/20' 
                }`} 
              /> 
            ))} 
          </div> 
        )} 
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

      {/* Barra multi-release */} 
      {multiSelectMode && ( 
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1a1a2e] border-t border-white/10 px-4 py-3 flex items-center gap-3"> 
          <span className="flex-1 text-sm font-bold text-white/60"> 
            {selectedIds.size > 0 ? `${selectedIds.size} selezionati` : 'Tocca i Pokémon per selezionarli'} 
          </span> 
          <button 
            onClick={() => { setMultiSelectMode(false); setSelectedIds(new Set()); }} 
            className="px-4 py-2 rounded-xl bg-white/10 text-sm font-bold" 
          > 
            Annulla 
          </button> 
          <button 
            onClick={handleMultiRelease} 
            disabled={selectedIds.size === 0} 
            className="px-4 py-2 rounded-xl bg-[#e63946] text-sm font-black disabled:opacity-30" 
          > 
            Libera ({selectedIds.size}) 
          </button> 
        </div> 
      )} 
    </div> 
  ); 
} 
