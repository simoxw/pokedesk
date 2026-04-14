import React, { useState, useMemo, useEffect, useCallback } from 'react'; 
import { useStore } from '../../store'; 
import { motion, AnimatePresence } from 'motion/react'; 
import PokemonDetailsModal from '../ui/PokemonDetailsModal'; 
import TypeBadge from '../ui/TypeBadge'; 
import PokemonCard from '../ui/PokemonCard';
import PokemonSprite from '../ui/PokemonSprite';
import { VirtuosoGrid } from 'react-virtuoso';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Sparkles, Users, Trash2, Info, SlidersHorizontal, X, CheckSquare, Square, BookmarkPlus, BookmarkCheck } from 'lucide-react'; 
import { LEGENDARY_IDS, GEN_RANGES } from '../../data/legendaryIds';
import { TeamPreset } from '../../types';

const BOX_SIZE = 30; 
const TYPE_LIST = ['fire','water','grass','electric','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','steel','dark','fairy','normal']; 

type SortKey = 'name' | 'level' | 'number' | 'type' | 'iv' | 'date'; 

export default function BoxScreen() { 
  const { box, setScreen, addToTeam, releasePokemon, team, inventory, useSpeciesCandy, favorites, teamPresets, saveTeamPreset, loadTeamPreset, deleteTeamPreset } = useStore(); 
  const [currentBox, setCurrentBox] = useState(0); 
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false); 
  const [showShinyOnly, setShowShinyOnly] = useState(false);
  const [search, setSearch] = useState(''); 
  const [filterType, setFilterType] = useState<string | null>(null); 
  const [sortBy, setSortBy] = useState<SortKey>('number'); 
  const [showFilters, setShowFilters] = useState(false); 
  const [selectedPkmn, setSelectedPkmn] = useState<any>(null); 
  const [showDetails, setShowDetails] = useState(false); 
  const [multiSelectMode, setMultiSelectMode] = useState(false); 
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activePreset, setActivePreset] = useState<TeamPreset['category'] | null>(null);
  const [presetSelecting, setPresetSelecting] = useState(false);
  const [presetSelected, setPresetSelected] = useState<string[]>([]);
  const [presetSortBy, setPresetSortBy] = useState<'iv' | 'level' | 'number'>('iv');
  const [presetFavoritesOnly, setPresetFavoritesOnly] = useState(false);

  const selectedForCompare = useMemo(() => box.filter(p => selectedIds.has(p.id)), [box, selectedIds]); 
  const allOwnedPokemon = useMemo(() => [...team, ...box], [team, box]);

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
    setShowCompareModal(false);
  }; 

  // Filtra e ordina 
  const filtered = useMemo(() => { 
    let result = [...box]; 
    if (showFavoritesOnly) result = result.filter(p => favorites.includes(p.id)); 
    if (showShinyOnly) result = result.filter(p => p.isShiny);
    if (search) {
      const query = search.toLowerCase().trim();
      if (query === 'iv:31' || query === '31') {
        result = result.filter(p => Object.values(p.ivs).some(v => v === 31));
      } else if (query.startsWith('iv:')) {
        const val = parseInt(query.replace('iv:', '')) || 0;
        result = result.filter(p => {
          const total = (Object.values(p.ivs) as number[]).reduce((a, b) => a + b, 0);
          return total >= val;
        });
      } else {
        result = result.filter(p => p.name.toLowerCase().includes(query));
      }
    }
    if (filterType) result = result.filter(p => p.types.includes(filterType as any)); 
    result.sort((a, b) => { 
      if (sortBy === 'name') return a.name.localeCompare(b.name); 
      if (sortBy === 'level') return b.level - a.level; 
      if (sortBy === 'type') return a.types[0].localeCompare(b.types[0]); 
      if (sortBy === 'iv') { 
        const ivA = a.ivs.hp + a.ivs.attack + a.ivs.defense + a.ivs.spAtk + a.ivs.spDef + a.ivs.speed; 
        const ivB = b.ivs.hp + b.ivs.attack + b.ivs.defense + b.ivs.spAtk + b.ivs.spDef + b.ivs.speed; 
        return ivB - ivA; 
      } 
      if (sortBy === 'date') return (b.caughtAt ?? 0) - (a.caughtAt ?? 0); 
      return a.pokemonId - b.pokemonId; // number 
    }); 
    return result; 
  }, [box, search, filterType, sortBy, showFavoritesOnly, showShinyOnly, favorites]); 

  const totalBoxes = Math.max(1, Math.ceil(filtered.length / BOX_SIZE)); 
  const currentBoxPkmn = filtered.slice(currentBox * BOX_SIZE, (currentBox + 1) * BOX_SIZE); 
  // Slots vuoti per riempire la griglia 5x6=30 
  const emptySlots = BOX_SIZE - currentBoxPkmn.length;

  useEffect(() => {
    if (selectedForCompare.length !== 2) setShowCompareModal(false);
  }, [selectedForCompare]);

  const statsToShow = [
    { label: 'IV HP', key: 'ivs.hp', isIv: true },
    { label: 'IV ATT', key: 'ivs.attack', isIv: true },
    { label: 'IV DIF', key: 'ivs.defense', isIv: true },
    { label: 'IV ATT.SP', key: 'ivs.spAtk', isIv: true },
    { label: 'IV DIF.SP', key: 'ivs.spDef', isIv: true },
    { label: 'IV VEL', key: 'ivs.speed', isIv: true },
    { label: 'IV Tot', key: 'ivTotal', isIv: true },
    { label: '', key: '', separator: true },
    { label: 'HP', key: 'stats.hp' },
    { label: 'ATT', key: 'stats.attack' },
    { label: 'DIF', key: 'stats.defense' },
    { label: 'ATT.SP', key: 'stats.spAtk' },
    { label: 'DIF.SP', key: 'stats.spDef' },
    { label: 'VEL', key: 'stats.speed' },
  ];

  const getStatValue = (pkmn: any, statKey: string) => {
    if (statKey === 'ivTotal') {
      return Object.values(pkmn.ivs).reduce((a: number, b: number) => a + b, 0);
    }
    if (statKey.startsWith('ivs.')) {
      const prop = statKey.split('.')[1] as keyof typeof pkmn.ivs;
      return pkmn.ivs[prop] ?? 0;
    }
    if (statKey.startsWith('stats.')) {
      const prop = statKey.split('.')[1] as keyof typeof pkmn.stats;
      return pkmn.stats[prop] ?? 0;
    }
    return 0;
  };

  const getColor = (a: number, b: number) => {
    if (a > b) return 'text-emerald-400';
    if (a < b) return 'text-rose-400';
    return 'text-white/70';
  }; 

  const getIvTotal = (pkmn: any) => {
    return pkmn.ivs.hp + pkmn.ivs.attack + pkmn.ivs.defense + pkmn.ivs.spAtk + pkmn.ivs.spDef + pkmn.ivs.speed;
  };

  const handleAddToTeam = useCallback((pkmn: any) => { 
    if (team.length < 4) { addToTeam(pkmn, team.length); setSelectedPkmn(null); } 
    else alert('Squadra piena!'); 
  }, [team.length, addToTeam]); 

  const handleToggleSelect = useCallback((id: string) => {
    toggleSelect(id);
  }, [toggleSelect]);

  const handleOpenDetails = useCallback((pkmn: any) => {
    setSelectedPkmn(pkmn);
  }, []);

  return ( 
    <div className="h-full flex flex-col bg-[#0f0f1a]"> 

      {/* Header */} 
      <div className="px-4 pt-5 pb-3"> 
        <div className="flex items-center gap-3 mb-3"> 
          <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl"> 
            <ArrowLeft size={20} /> 
          </button> 
          <h2 className="text-xl font-black uppercase flex-1">PC</h2> 
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
          onClick={() => setShowFavoritesOnly(f => !f)}
          className={`p-2 rounded-xl border transition-all text-lg ${showFavoritesOnly ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-[#1a1a2e] border-white/10 text-white/40'}`}
        >
          ★
        </button>
        <button 
          onClick={() => setShowShinyOnly(f => !f)} 
          className={`p-2 rounded-xl border transition-all text-sm font-black ${showShinyOnly ? 'bg-yellow-300/20 border-yellow-300/50 text-yellow-200' : 'bg-[#1a1a2e] border-white/10 text-white/40'}`} 
        > 
          ✨ 
        </button>
        <button
          onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
          className={`p-2 rounded-xl border transition-all ${viewMode === 'list' ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10'}`}
        >
          {viewMode === 'grid' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          )}
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
              <div className="flex gap-2 mb-2 pt-1 overflow-x-auto no-scrollbar"> 
                {(['number','name','level','type','iv','date'] as SortKey[]).map(s => ( 
                  <button 
                    key={s} 
                    onClick={() => setSortBy(s)} 
                    className={`flex-shrink-0 min-w-[52px] py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${ 
                      sortBy === s ? 'bg-[#e63946]' : 'bg-[#1a1a2e] text-white/40' 
                    }`} 
                  > 
                    {s === 'number' ? '#' : s === 'name' ? 'Nome' : s === 'level' ? 'Lv.' : s === 'iv' ? 'IV' : s === 'date' ? '📅' : 'Tipo'} 
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-5 gap-3">
            {currentBoxPkmn.map(pkmn => (
              <PokemonCard
                key={pkmn.id}
                pokemon={pkmn}
                viewMode={viewMode}
                multiSelectMode={multiSelectMode}
                isSelected={selectedIds.has(pkmn.id)}
                isFavorite={favorites.includes(pkmn.id)}
                onClick={handleOpenDetails}
                onToggleSelect={handleToggleSelect}
              />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square bg-[#111122] rounded-xl border border-white/5 border-dashed opacity-30"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {currentBoxPkmn.map(pkmn => (
              <PokemonCard
                key={pkmn.id}
                pokemon={pkmn}
                viewMode={viewMode}
                multiSelectMode={multiSelectMode}
                isSelected={selectedIds.has(pkmn.id)}
                isFavorite={favorites.includes(pkmn.id)}
                onClick={handleOpenDetails}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        )} 
      </div> 

      {/* Strip preset */}
      <div className="px-3 py-2 border-t border-white/5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {([
            { key: 'gen1', label: 'Gen 1', icon: '🗾' },
            { key: 'gen2', label: 'Gen 2', icon: '🌸' },
            { key: 'gen3', label: 'Gen 3', icon: '🌊' },
            { key: 'gen4', label: 'Gen 4', icon: '❄️' },
            { key: 'gen5', label: 'Gen 5', icon: '🗽' },
            { key: 'gen6', label: 'Gen 6', icon: '🗼' },
            { key: 'gen7', label: 'Gen 7', icon: '🌺' },
            { key: 'gen8', label: 'Gen 8', icon: '⚔️' },
            { key: 'legendary', label: 'Leggendari', icon: '⭐' },
            { key: 'favorite', label: 'Preferita', icon: '❤️' },
          ] as { key: TeamPreset['category']; label: string; icon: string }[]).map(({ key, label, icon }) => {
            const preset = teamPresets[key];
            const validCount = preset
              ? preset.pokemonIds.filter(id => allOwnedPokemon.some(p => p.id === id)).length
              : 0;
            return (
              <button
                key={key}
                onClick={() => setActivePreset(key)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
                  preset && validCount > 0
                    ? 'bg-[#e63946]/10 border-[#e63946]/40 text-white'
                    : 'bg-[#1a1a2e] border-white/10 text-white/50'
                }`}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-[9px] font-black uppercase">{label}</span>
                {preset && validCount > 0 && (
                  <span className="text-[8px] text-[#e63946] font-bold">{validCount}/4</span>
                )}
              </button>
            );
          })}
        </div>
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
                <PokemonSprite
                  pokemonId={selectedPkmn.pokemonId}
                  isShiny={selectedPkmn.isShiny}
                  className="w-32 h-32 object-contain"
                />
                <div>
                  <h3 className="text-3xl font-black uppercase">{selectedPkmn.name}</h3>
                  <p className="text-[#e63946] font-bold">Livello {selectedPkmn.level}</p>
                  <div className="mt-2 text-[10px] flex flex-wrap gap-x-2 gap-y-1">
                    {Object.entries(selectedPkmn.ivs).map(([stat, val]) => (
                      <span key={stat} className="uppercase font-bold">
                        <span className="text-white/30">{stat}:</span>
                        <span className={(val as number) === 31 ? 'text-green-400' : 'text-white/60'}> {val as number}</span>
                      </span>
                    ))}
                    <div className="w-full text-white/20 font-black mt-1">TOTALE: {(Object.values(selectedPkmn.ivs) as number[]).reduce((a, b) => a + b, 0)}/186</div>
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
            onClick={() => setShowCompareModal(true)} 
            disabled={selectedIds.size !== 2} 
            className="px-4 py-2 rounded-xl bg-[#3b82f6] text-sm font-black disabled:opacity-30" 
          > 
            Confronta 
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

      {/* Modal Preset */}
      <AnimatePresence>
        {activePreset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end"
            onClick={() => { setActivePreset(null); setPresetSelecting(false); setPresetSelected([]); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#1a1a2e] rounded-t-[32px] p-6 flex flex-col gap-4 max-h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const preset = teamPresets[activePreset];
                const allOwnedById = new Map(allOwnedPokemon.map((p) => [p.id, p]));
                const validPokemon = preset
                  ? preset.pokemonIds.map(id => allOwnedById.get(id)).filter(Boolean)
                  : [];
                const inTeamCount = preset
                  ? preset.pokemonIds.filter((id) => team.some((p) => p.id === id)).length
                  : 0;

                // Filtro Pokémon disponibili per questa categoria
                const range = GEN_RANGES[activePreset];
                const availableInBox = box.filter(p => {
                  if (activePreset === 'legendary') return LEGENDARY_IDS.has(p.pokemonId);
                  if (activePreset === 'favorite') return true;
                  if (range) return p.pokemonId >= range[0] && p.pokemonId <= range[1] && !LEGENDARY_IDS.has(p.pokemonId);
                  return true;
                });

                const LABELS: Record<string, string> = {
                  gen1:'Gen 1',gen2:'Gen 2',gen3:'Gen 3',gen4:'Gen 4',
                  gen5:'Gen 5',gen6:'Gen 6',gen7:'Gen 7',gen8:'Gen 8',
                  legendary:'Leggendari',favorite:'Preferita'
                };

                if (!presetSelecting) {
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-lg">Preset {LABELS[activePreset]}</h3>
                        <button onClick={() => { setActivePreset(null); }} className="p-2 bg-white/10 rounded-xl">
                          <X size={18} />
                        </button>
                      </div>

                      {validPokemon.length > 0 ? (
                        <>
                          <div className="flex gap-3">
                            {validPokemon.map((p: any) => (
                              <div key={p.id} className="flex flex-col items-center gap-1">
                                <PokemonSprite pokemonId={p.pokemonId} isShiny={p.isShiny} className="w-16 h-16 object-contain" />
                                <span className="text-[9px] font-bold uppercase text-white/70">{p.name}</span>
                                <span className="text-[8px] text-[#e63946]">Lv.{p.level}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              const validIds = validPokemon.map((p: any) => p.id);
                              const msg = `Caricare il preset ${LABELS[activePreset]}? Il tuo team attuale andrà nel box.`;
                              if (confirm(msg)) {
                                loadTeamPreset(activePreset);
                                setActivePreset(null);
                              }
                            }}
                            className="w-full bg-[#e63946] py-3 rounded-2xl font-black"
                          >
                            CARICA IN SQUADRA
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setPresetSelecting(true); setPresetSelected(preset?.pokemonIds ?? []); }}
                              className="flex-1 bg-white/5 border border-white/10 py-2 rounded-xl font-bold text-sm"
                            >
                              MODIFICA
                            </button>
                            <button
                              onClick={() => { if (confirm('Eliminare questo preset?')) { deleteTeamPreset(activePreset); setActivePreset(null); } }}
                              className="px-4 bg-red-500/10 border border-red-500/20 text-red-400 py-2 rounded-xl font-bold text-sm"
                            >
                              ELIMINA
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-white/40 text-sm text-center py-4">
                            {availableInBox.length === 0
                              ? 'Non hai Pokémon di questa categoria nel box.'
                              : 'Nessun preset salvato. Creane uno!'}
                          </p>
                          {availableInBox.length > 0 && (
                            <button
                              onClick={() => { setPresetSelecting(true); setPresetSelected([]); }}
                              className="w-full bg-[#e63946] py-3 rounded-2xl font-black"
                            >
                              CREA PRESET
                            </button>
                          )}
                        </>
                      )}
                    </>
                  );
                }

                const filteredAndSortedAvailable = [...availableInBox]
                  .filter((p) => !presetFavoritesOnly || favorites.includes(p.id))
                  .sort((a, b) => {
                    if (presetSortBy === 'iv') return getIvTotal(b) - getIvTotal(a);
                    if (presetSortBy === 'level') return b.level - a.level;
                    return a.pokemonId - b.pokemonId;
                  });

                // Modalità selezione
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-lg">Seleziona fino a 4</h3>
                      <button onClick={() => { setPresetSelecting(false); setPresetSelected([]); }} className="p-2 bg-white/10 rounded-xl">
                        <X size={18} />
                      </button>
                    </div>
                    <p className="text-[10px] text-white/40">{presetSelected.length}/4 selezionati</p>
                    {inTeamCount > 0 && (
                      <p className="text-[10px] text-white/40">
                        {inTeamCount} Pokémon del preset sono già in squadra.
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {([
                        { key: 'iv', label: 'IV' },
                        { key: 'level', label: 'Lv' },
                        { key: 'number', label: '#' },
                      ] as { key: 'iv' | 'level' | 'number'; label: string }[]).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setPresetSortBy(key)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                            presetSortBy === key ? 'bg-[#e63946] border-[#e63946]' : 'bg-white/5 border-white/10 text-white/70'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      <button
                        onClick={() => setPresetFavoritesOnly(v => !v)}
                        className={`ml-auto p-2 rounded-lg border transition-all ${
                          presetFavoritesOnly ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : 'bg-white/5 border-white/10 text-white/50'
                        }`}
                        title="Solo preferiti"
                      >
                        {presetFavoritesOnly ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 no-scrollbar">
                      {filteredAndSortedAvailable.map(p => {
                        const sel = presetSelected.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (sel) setPresetSelected(prev => prev.filter(id => id !== p.id));
                              else if (presetSelected.length < 4) setPresetSelected(prev => [...prev, p.id]);
                            }}
                            className={`relative aspect-square bg-[#111122] rounded-xl border flex flex-col items-center justify-center p-1 transition-all ${
                              sel ? 'border-[#e63946] bg-[#e63946]/20' : 'border-white/5'
                            }`}
                          >
                            <PokemonSprite pokemonId={p.pokemonId} isShiny={p.isShiny} className="w-full h-full object-contain" alt={p.name} />
                            <span className="absolute bottom-0.5 left-0.5 text-[8px] font-black bg-black/60 px-1 rounded">
                              Lv.{p.level}
                            </span>
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black bg-black/60 px-1 rounded text-[#e63946]">
                              IV {getIvTotal(p)}
                            </span>
                            {sel && <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-[#e63946] rounded-full" />}
                          </button>
                        );
                      })}
                    </div>
                    {filteredAndSortedAvailable.length === 0 && (
                      <p className="text-center text-xs text-white/40 py-2">
                        Nessun Pokémon corrisponde ai filtri selezionati.
                      </p>
                    )}
                    <button
                      disabled={presetSelected.length === 0}
                      onClick={() => {
                        saveTeamPreset(activePreset, presetSelected);
                        setPresetSelecting(false);
                        setPresetSelected([]);
                      }}
                      className="w-full bg-[#e63946] disabled:opacity-30 py-3 rounded-2xl font-black"
                    >
                      SALVA PRESET ({presetSelected.length}/4)
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompareModal && selectedForCompare.length === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCompareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl bg-[#0f172a] border border-white/10 rounded-2xl p-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black">Confronta Pokémon</h3>
                <button onClick={() => setShowCompareModal(false)} className="text-white/50 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {selectedForCompare.map(p => (
                  <div key={p.id} className="bg-[#1a1a2e] rounded-xl p-3">
                    <PokemonSprite
                      pokemonId={p.pokemonId}
                      isShiny={p.isShiny}
                      alt={p.name}
                      className="w-24 h-24 mx-auto"
                    />
                    <p className="text-center font-black text-white uppercase mt-2">{p.name}</p>
                    <p className="text-center text-xs text-white/40">Lv. {p.level}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                {statsToShow.map((stat) => {
                  if (stat.separator) {
                    return <div key="separator" className="h-2" />;
                  }
                  const a = getStatValue(selectedForCompare[0], stat.key);
                  const b = getStatValue(selectedForCompare[1], stat.key);
                  return (
                    <div key={stat.key} className="grid grid-cols-3 items-center gap-2 px-2 py-1 text-xs">
                      <span className="text-white/60">{stat.label}</span>
                      <span className={`text-right font-bold ${getColor(a, b)}`}>{a}</span>
                      <span className={`text-left font-bold ${getColor(b, a)}`}>{b}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence> 
    </div> 
  ); 
} 
