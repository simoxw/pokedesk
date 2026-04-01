import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { BattleEngine } from '../../BattleEngine';
import { CatchEngine } from '../../CatchEngine';
import { motion, AnimatePresence } from 'motion/react';
import TypeBadge from '../ui/TypeBadge';
import PokemonSprite from '../ui/PokemonSprite';
import {
  ArrowLeft, Search, X, Copy, ArrowLeftRight,
  SlidersHorizontal, Sparkles, Check, Users, Shuffle
} from 'lucide-react';

const TYPE_LIST = [
  'fire','water','grass','electric','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon',
  'steel','dark','fairy','normal'
];
type SortKey = 'name' | 'level' | 'number' | 'type' | 'iv' | 'date';

export default function TradeScreen() {
  const { box, team, setScreen, addPokemon, updatePokedex, addItem, favorites, removePokemon } = useStore();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // --- Tab ---
  const [mode, setMode] = useState<'export' | 'import' | 'wonder'>('export');

  // --- Export state ---
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('number');
  const [showFilters, setShowFilters] = useState(false);
  const [source, setSource] = useState<'box' | 'team'>('box');

  // Selected pokemon + generated code
  const [selectedPkmn, setSelectedPkmn] = useState<any>(null);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  // --- Import state ---
  const [importCode, setImportCode] = useState('');

  // --- Wonder Trade state ---
  const [wonderPkmn, setWonderPkmn] = useState<any>(null);
  const [wonderSource, setWonderSource] = useState<'box' | 'team'>('box');
  const [wonderLoading, setWonderLoading] = useState(false);
  const [wonderResult, setWonderResult] = useState<any>(null);
  const [wonderStep, setWonderStep] = useState<'select' | 'trading' | 'result'>('select');

  // --- Filtered list ---
  const activeSource = mode === 'wonder' ? wonderSource : source;
  const allPkmn = activeSource === 'box' ? box : team;
  const filtered = useMemo(() => {
    let result = [...allPkmn];
    if (showFavoritesOnly) result = result.filter(p => favorites.includes(p.id));
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
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
      return a.pokemonId - b.pokemonId;
    });
    return result;
  }, [allPkmn, search, filterType, sortBy, showFavoritesOnly, favorites]);

  const handleSelect = (pkmn: any) => {
    try {
      const json = JSON.stringify(pkmn);
      const b64 = btoa(unescape(encodeURIComponent(json)));
      setSelectedPkmn(pkmn);
      setCode(b64);
      setCopied(false);
    } catch (e) {
      console.error('Encode error', e);
      alert('Errore nella generazione del codice.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  const handleImport = () => {
    try {
      const json = decodeURIComponent(escape(atob(importCode.trim())));
      const pkmn = JSON.parse(json);
      const isValid =
        pkmn.name && typeof pkmn.name === 'string' &&
        pkmn.level && typeof pkmn.level === 'number' && pkmn.level >= 1 && pkmn.level <= 100 &&
        pkmn.pokemonId && typeof pkmn.pokemonId === 'number' && pkmn.pokemonId >= 1 && pkmn.pokemonId <= 1025 &&
        Array.isArray(pkmn.moves) && pkmn.moves.length >= 1 &&
        pkmn.stats && typeof pkmn.stats === 'object' &&
        ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'].every(s => typeof pkmn.stats[s] === 'number' && pkmn.stats[s] > 0) &&
        pkmn.ivs && typeof pkmn.ivs === 'object' &&
        ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'].every(s => typeof pkmn.ivs[s] === 'number') &&
        Array.isArray(pkmn.types) && pkmn.types.length > 0 &&
        typeof pkmn.isShiny === 'boolean' &&
        pkmn.nature && typeof pkmn.nature === 'string' &&
        pkmn.growthRate && typeof pkmn.growthRate === 'string';

      if (!isValid) { alert('Pokémon non valido o corrotto!'); return; }

      const newPkmn = {
        ...pkmn,
        id: Math.random().toString(36).substr(2, 9),
        currentHp: pkmn.stats.hp,
      };
      addPokemon(newPkmn);
      useStore.getState().updatePokedex(pkmn.pokemonId, 'caught'); 
      useStore.getState().addItem(`candy_${pkmn.baseSpeciesId ?? pkmn.pokemonId}`, 3); 
      alert(`${pkmn.name} importato con successo!`);
      setImportCode('');
    } catch {
      alert('Pokémon non valido o corrotto!');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a] overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setScreen('START_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black uppercase flex-1">SCAMBIA</h2>
        </div>

        {/* ── Tab Esporta / Importa ── */}
        <div className="flex gap-2 bg-[#1a1a2e] p-1 rounded-2xl mb-4">
          <button
            onClick={() => setMode('export')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${mode === 'export' ? 'bg-[#e63946] text-white' : 'text-white/40'}`}
          >
            ESPORTA
          </button>
          <button
            onClick={() => setMode('import')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${mode === 'import' ? 'bg-[#e63946] text-white' : 'text-white/40'}`}
          >
            IMPORTA
          </button>
          <button
            onClick={() => {
              setMode('wonder');
              setWonderStep('select');
              setWonderResult(null);
              setWonderPkmn(null);
              setWonderSource('box');
              setShowFilters(false);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${mode === 'wonder' ? 'bg-[#e63946] text-white' : 'text-white/40'}`}
          >
            WONDER
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════
          EXPORT MODE
      ════════════════════════════════════ */}
      {mode === 'export' && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Filtri header */}
          <div className="px-4 flex-shrink-0">

            {/* Source toggle: Box / Squadra */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSource('box')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  source === 'box' ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10 text-white/40'
                }`}
              >
                📦 Box <span className="opacity-60">({box.length})</span>
              </button>
              <button
                onClick={() => setSource('team')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  source === 'team' ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10 text-white/40'
                }`}
              >
                <Users size={12} /> Squadra <span className="opacity-60">({team.length})</span>
              </button>
              <button
                onClick={() => setShowFavoritesOnly(f => !f)}
                className={`ml-auto p-2 rounded-xl border transition-all text-lg ${showFavoritesOnly ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-[#1a1a2e] border-white/10 text-white/40'}`}
              >
                ★
              </button>
              <button
                onClick={() => setSortBy(sortBy === 'date' ? 'number' : 'date')}
                className={`p-2 rounded-xl border transition-all text-sm ${sortBy === 'date' ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10 text-white/40'}`}
              >
                📅
              </button>
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10'}`}
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>

            {/* Ricerca */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
              <input
                type="text"
                placeholder="Cerca per nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-white/5 rounded-xl py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#e63946]/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                  <X size={13} />
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
                    {(['number','name','level','type','iv'] as SortKey[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                          sortBy === s ? 'bg-[#e63946]' : 'bg-[#1a1a2e] text-white/40'
                        }`}
                      >
                        {s === 'number' ? '#' : s === 'name' ? 'Nome' : s === 'level' ? 'Lv.' : s === 'iv' ? 'IV' : 'Tipo'}
                      </button>
                    ))}
                  </div>

                  {/* Filtro tipo */}
                  <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                    <button
                      onClick={() => setFilterType(null)}
                      className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                        !filterType ? 'bg-[#e63946]' : 'bg-[#1a1a2e] text-white/40'
                      }`}
                    >
                      TUTTI
                    </button>
                    {TYPE_LIST.map(t => (
                      <button
                        key={t}
                        onClick={() => setFilterType(filterType === t ? null : t)}
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

            {/* Conteggio risultati */}
            <p className="text-[10px] text-white/30 font-bold mb-2">
              {filtered.length} Pokémon • tocca per generare il codice
            </p>
          </div>

          {/* ── Griglia scrollabile ── */}
          <div className="flex-1 overflow-y-auto px-4 no-scrollbar pb-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3 py-12">
                <span className="text-5xl">📦</span>
                <p className="font-bold text-sm">Nessun Pokémon trovato</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filtered.map(pkmn => (
                  <button
                    key={pkmn.id}
                    onClick={() => handleSelect(pkmn)}
                    className={`bg-[#1a1a2e] rounded-xl border flex flex-col items-center p-2 transition-all relative overflow-hidden ${
                      selectedPkmn?.id === pkmn.id
                        ? 'border-[#e63946] ring-1 ring-[#e63946]/40'
                        : 'border-white/5 active:border-white/20'
                    }`}
                  >
                    {pkmn.isShiny && (
                      <Sparkles size={10} className="absolute top-1.5 right-1.5 text-yellow-400" />
                    )}
                    {favorites.includes(pkmn.id) && (
                      <span className="absolute top-1.5 left-1.5 text-yellow-400 text-[9px] leading-none">★</span>
                    )}
                    <span className="text-[8px] text-white/20 font-mono self-end">
                      #{pkmn.pokemonId.toString().padStart(3, '0')}
                    </span>
                    <PokemonSprite
                      pokemonId={pkmn.pokemonId}
                      isShiny={pkmn.isShiny}
                      className="w-14 h-14 object-contain"
                      alt={pkmn.name}
                      spriteUrl={pkmn.spriteUrl}
                    />
                    <span className="text-[9px] font-black uppercase truncate w-full text-center leading-tight">
                      {pkmn.customName || pkmn.name}
                    </span>
                    <span className="text-[8px] text-white/30 font-bold">Lv.{pkmn.level}</span>
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {pkmn.types.map((t: string) => (
                        <TypeBadge key={t} type={t as any} small />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ════════════════════════════════════
          IMPORT MODE
      ════════════════════════════════════ */}
      {mode === 'import' && (
        <div className="flex-1 flex flex-col px-4 pb-4 gap-4">
          <p className="text-xs text-white/40 italic">
            Incolla qui il codice ricevuto da un altro allenatore per aggiungere il Pokémon al tuo Box.
          </p>

          <textarea
            value={importCode}
            onChange={e => setImportCode(e.target.value)}
            className="flex-1 min-h-0 bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-[#e63946]/50 resize-none"
            placeholder="Incolla il codice Base64 qui..."
          />

          <button
            onClick={handleImport}
            disabled={!importCode.trim()}
            className="w-full bg-[#e63946] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-30 transition-opacity"
          >
            <ArrowLeftRight size={20} /> IMPORTA POKÉMON
          </button>
        </div>
      )}

      {/* ════════════════════════════════════
          WONDER TRADE
      ════════════════════════════════════ */}
      {mode === 'wonder' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {wonderStep === 'select' && (
            <>
              {/* Filtri header */}
              <div className="px-4 flex-shrink-0">
                <p className="text-xs text-white/40 italic mb-2">
                  Scegli un Pokémon da scambiare. Riceverai un Pokémon casuale di livello simile!
                </p>

                {/* Filtri wonder */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setWonderSource('box')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      wonderSource === 'box' ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10 text-white/40'
                    }`}
                  >
                    📦 Box <span className="opacity-60">({box.length})</span>
                  </button>
                  <button
                    onClick={() => setWonderSource('team')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      wonderSource === 'team' ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10 text-white/40'
                    }`}
                  >
                    <Users size={12} /> Squadra <span className="opacity-60">({team.length})</span>
                  </button>
                  <button
                    onClick={() => setShowFavoritesOnly(f => !f)}
                    className={`ml-auto p-2 rounded-xl border transition-all text-lg ${showFavoritesOnly ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-[#1a1a2e] border-white/10 text-white/40'}`}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => setSortBy(sortBy === 'date' ? 'number' : 'date')}
                    className={`p-2 rounded-xl border transition-all text-sm ${sortBy === 'date' ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10 text-white/40'}`}
                  >
                    📅
                  </button>
                  <button
                    onClick={() => setShowFilters(f => !f)}
                    className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#1a1a2e] border-white/10'}`}
                  >
                    <SlidersHorizontal size={16} />
                  </button>
                </div>

                {/* Ricerca */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                  <input
                    type="text"
                    placeholder="Cerca per nome..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#1a1a2e] border border-white/5 rounded-xl py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#e63946]/50"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
                      <X size={13} />
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
                        {(['number','name','level','type','iv'] as SortKey[]).map(s => (
                          <button
                            key={s}
                            onClick={() => setSortBy(s)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                              sortBy === s ? 'bg-[#e63946]' : 'bg-[#1a1a2e] text-white/40'
                            }`}
                          >
                            {s === 'number' ? '#' : s === 'name' ? 'Nome' : s === 'level' ? 'Lv.' : s === 'iv' ? 'IV' : 'Tipo'}
                          </button>
                        ))}
                      </div>

                      {/* Filtro tipo */}
                      <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                        <button
                          onClick={() => setFilterType(null)}
                          className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                            !filterType ? 'bg-[#e63946]' : 'bg-[#1a1a2e] text-white/40'
                          }`}
                        >
                          TUTTI
                        </button>
                        {TYPE_LIST.map(t => (
                          <button
                            key={t}
                            onClick={() => setFilterType(filterType === t ? null : t)}
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

                {/* Conteggio risultati */}
                <p className="text-[10px] text-white/30 font-bold mb-2">
                  {filtered.length} Pokémon • tocca per selezionarlo
                </p>
              </div>

              {/* Griglia scrollabile */}
              <div className="flex-1 overflow-y-auto px-4 no-scrollbar pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {filtered.map(p => (
                    <div key={p.id}>
                      <button
                        onClick={() => setWonderPkmn(p)}
                        className={`relative w-full bg-[#1a1a2e] rounded-xl border flex flex-col items-center p-2 transition-all ${wonderPkmn?.id === p.id ? 'border-[#e63946] ring-1 ring-[#e63946]/40' : 'border-white/5'}`}>
                        {p.isShiny && <Sparkles size={8} className="absolute top-1 right-1 text-yellow-400" />}
                        <PokemonSprite pokemonId={p.pokemonId} isShiny={p.isShiny}
                          className="w-14 h-14 object-contain" spriteUrl={p.spriteUrl} />
                        <span className="text-[9px] font-black uppercase truncate w-full text-center">{p.name}</span>
                        <span className="text-[8px] text-white/30">Lv.{p.level}</span>
                      </button>

                      {wonderPkmn?.id === p.id && (
                        <div className="mt-2 p-2 bg-[#111226] border border-[#e63946]/30 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-white/40">{p.name} selezionato</span>
                            <button onClick={() => setWonderPkmn(null)} className="text-white/40">×</button>
                          </div>
                          <button
                            onClick={async () => {
                              setWonderStep('trading');
                              setWonderLoading(true);
                              try {
                                const randomId = Math.floor(Math.random() * 898) + 1;
                                const data = await api.getPokemon(randomId);
                                const species = await api.getSpecies(randomId);
                                const level = Math.max(5, wonderPkmn.level + Math.floor(Math.random() * 11) - 5);
                                const ivs = CatchEngine.generateIVs();
                                const nature = CatchEngine.getNature();
                                const baseStats = {
                                  hp: data.stats[0].base_stat, attack: data.stats[1].base_stat,
                                  defense: data.stats[2].base_stat, spAtk: data.stats[3].base_stat,
                                  spDef: data.stats[4].base_stat, speed: data.stats[5].base_stat,
                                };
                                const stats = BattleEngine.calculateStats(level, baseStats, ivs,
                                  { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, nature);
                                const moves = await api.getPokemonMoves(data, level);
                                const baseSpeciesId = await api.getBaseSpeciesId(species);
                                const newPokemon = {
                                  id: Math.random().toString(36).substr(2, 9),
                                  pokemonId: data.id,
                                  name: api.getItalianName(species.names),
                                  level, exp: Math.floor(level ** 3),
                                  types: data.types.map((t: any) => t.type.name),
                                  baseStats, ivs,
                                  evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
                                  stats, nature, moves,
                                  currentHp: stats.hp, status: null,
                                  isShiny: CatchEngine.checkShiny(),
                                  caughtAt: Date.now(),
                                  growthRate: species.growth_rate.name,
                                  baseSpeciesId,
                                };
                                await new Promise(r => setTimeout(r, 2200));
                                removePokemon(wonderPkmn.id);
                                addPokemon(newPokemon);
                                updatePokedex(data.id, 'caught');
                                addItem(`candy_${baseSpeciesId}`, 3);
                                setWonderResult(newPokemon);
                                setWonderStep('result');
                              } catch {
                                setWonderStep('select');
                              } finally {
                                setWonderLoading(false);
                              }
                            }}
                            className="w-full bg-[#e63946] py-2 rounded-lg font-black text-xs"
                          >
                            <Shuffle size={14} className="inline-block mr-2" /> {wonderLoading ? 'SCAMBIO IN CORSO...' : 'WONDER TRADE!'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {wonderStep === 'trading' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="text-6xl"
              >
                🔴
              </motion.div>
              <div className="text-center">
                <p className="font-black text-lg">Wonder Trade in corso...</p>
                <p className="text-white/40 text-sm mt-1">Scambio {wonderPkmn?.name} con il mondo!</p>
              </div>
            </div>
          )}

          {wonderStep === 'result' && wonderResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center gap-6 py-4 px-4">
              <div className="text-5xl">🎉</div>
              <p className="font-black text-xl text-center">Hai ricevuto!</p>
              <div className="bg-[#1a1a2e] border border-[#e63946]/40 rounded-2xl p-6 flex flex-col items-center gap-3 w-full">
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${wonderResult.isShiny ? '' : ''}${wonderResult.pokemonId}.png`}
                  className="w-32 h-32 object-contain drop-shadow-xl"
                />
                <p className="font-black text-xl uppercase">{wonderResult.name}</p>
                {wonderResult.isShiny && <p className="text-yellow-400 font-black text-sm">✨ È SHINY!</p>}
                <p className="text-white/50 text-sm">Lv.{wonderResult.level} · {wonderResult.nature}</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {wonderResult.types.map((t: string) => <TypeBadge key={t} type={t as any} small />)}
                </div>
                <p className="text-[10px] text-white/30">
                  IV: {((Object.values(wonderResult.ivs) as Array<number>).reduce((a, b) => a + b, 0))}/186
                </p>
              </div>
              <button
                onClick={() => { setWonderStep('select'); setWonderPkmn(null); setWonderResult(null); }}
                className="w-full bg-[#e63946] py-4 rounded-2xl font-black"
              >
                WONDER TRADE DI NUOVO
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Bottom sheet: codice generato ── */}
      <AnimatePresence>
        {selectedPkmn && code && mode === 'export' && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex-shrink-0 mx-4 mb-4 bg-[#1a1a2e] border border-white/10 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <PokemonSprite
                pokemonId={selectedPkmn.pokemonId}
                isShiny={selectedPkmn.isShiny}
                className="w-12 h-12 object-contain"
                spriteUrl={selectedPkmn.spriteUrl}
              />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase truncate">{selectedPkmn.name}</p>
                <p className="text-[10px] text-white/40">Lv.{selectedPkmn.level} • {selectedPkmn.nature}</p>
              </div>
              <button onClick={() => { setSelectedPkmn(null); setCode(''); }} className="p-1.5 bg-white/5 rounded-lg">
                <X size={14} />
              </button>
            </div>

            {/* Codice */}
            <div className="bg-black/40 rounded-xl p-3 mb-3">
              <p className="text-[8px] font-mono break-all text-white/40 leading-relaxed line-clamp-3">
                {code}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#e63946] text-white'
              }`}
            >
              {copied ? <><Check size={16} /> COPIATO!</> : <><Copy size={16} /> COPIA CODICE</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}