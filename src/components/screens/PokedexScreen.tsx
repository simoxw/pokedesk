import React, { useState, useEffect } from 'react'; 
import { useStore } from '../../store'; 
import { api } from '../../api'; 
import { REGIONAL_FORMS } from '../../data/regionalForms';
import { MEGA_IDS } from '../../data/legendaryIds';
import { motion, AnimatePresence } from 'motion/react'; 
import { ArrowLeft, X, Heart, Sword, Shield, Zap, Activity, Filter, Search, Calculator } from 'lucide-react';
import { TYPE_CHART } from '../../BattleEngine'; 
import TypeBadge from '../ui/TypeBadge';
import type { PokemonType } from '../../types'; 

const STAT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = { 
  hp:      { label: 'HP',       icon: <Heart size={12} />,    color: '#f87171' }, 
  attack:  { label: 'ATT',      icon: <Sword size={12} />,    color: '#fb923c' }, 
  defense: { label: 'DIF',      icon: <Shield size={12} />,   color: '#60a5fa' }, 
  spAtk:   { label: 'ATT.SP',   icon: <Zap size={12} />,      color: '#c084fc' }, 
  spDef:   { label: 'DIF.SP',   icon: <Shield size={12} />,   color: '#34d399' }, 
  speed:   { label: 'VEL',      icon: <Activity size={12} />, color: '#facc15' }, 
}; 
 
const POKEDEX_TYPE_COLORS: Record<string, { bg: string; border: string }> = {
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

function extractEvolutions(chain: any): { name: string; id: number }[] { 
  const result: { name: string; id: number }[] = []; 
  const traverse = (node: any) => { 
    const url = node.species.url; 
    const id = parseInt(url.split('/').filter(Boolean).pop() || '0'); 
    result.push({ name: node.species.name, id }); 
    node.evolves_to?.forEach((child: any) => traverse(child)); 
  }; 
  traverse(chain); 
  return result; 
} 
 
export default function PokedexScreen() { 
  const { pokedex, pokedexTypes, savePokedexTypes, setScreen, claimPokedexReward, claimedPokedexRewards, inventory, coins, team, box } = useStore(); 
  const [selected, setSelected] = useState<any>(null); 
  const [loadingModal, setLoadingModal] = useState(false); 
  const [tab, setTab] = useState<'info' | 'stats' | 'moves' | 'evo'>('info'); 
  const [evolutions, setEvolutions] = useState<{ name: string; id: number; sprite: string }[]>([]); 
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterGen, setFilterGen] = useState<number | null>(null);
  const [filterRegional, setFilterRegional] = useState(false);
  const [filterMega, setFilterMega] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showTypeCalc, setShowTypeCalc] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [calcAttackType, setCalcAttackType] = useState<string | null>(null);

  const GEN_RANGES = [
    { id: 1, label: 'Gen 1', range: [1, 151] },
    { id: 2, label: 'Gen 2', range: [152, 251] },
    { id: 3, label: 'Gen 3', range: [252, 386] },
    { id: 4, label: 'Gen 4', range: [387, 493] },
    { id: 5, label: 'Gen 5', range: [494, 649] },
    { id: 6, label: 'Gen 6', range: [650, 721] },
    { id: 7, label: 'Gen 7', range: [722, 809] },
    { id: 8, label: 'Gen 8', range: [810, 898] },
    { id: 9, label: 'Gen 9', range: [906, 1025] },
    { id: 10, label: 'Mega', range: [10033, 10080] },
  ];

  const TYPES = [
    'normal', 'fire', 'water', 'grass', 'electric', 'ice', 
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
    'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy'
  ];
 
  const entries = Array.from({ length: 1025 }, (_, i) => i + 1); 
 
  const handleSelect = async (id: number) => { 
    if (!pokedex[id]) return; 
    setLoadingModal(true); 
    setTab('info'); 
    setEvolutions([]); 
    try { 
      const [data, species] = await Promise.all([ 
        api.getPokemon(id), 
        api.getSpecies(id), 
      ]); 
      setSelected({ ...data, species }); 
 
      // Catena evolutiva 
      const chain = await api.getEvolutionChain(species.evolution_chain.url); 
      const evoList = extractEvolutions(chain.chain); 
      const evoWithSprites = await Promise.all( 
        evoList.map(async (e) => { 
          try { 
            const d = await api.getPokemon(e.id); 
            return { ...e, sprite: d.sprites.front_default }; 
          } catch { return { ...e, sprite: '' }; } 
        }) 
      ); 
      setEvolutions(evoWithSprites); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoadingModal(false); 
    } 
  }; 
 
  const caught = Object.values(pokedex).filter(s => s === 'caught').length;
  const seen = Object.values(pokedex).length; // tutte le specie registrate (seen + caught)
  const regionalCaught = Object.entries(pokedex).filter(([id, status]) => status === 'caught' && Number(id) > 10000).length;
  const megaCaught = Object.entries(pokedex).filter(([id, status]) => status === 'caught' && MEGA_IDS.has(Number(id))).length;
  const regionalTotal = Object.entries(pokedex).filter(([id]) => Number(id) > 10000).length;
  const regionalCount = REGIONAL_FORMS.length;
 
  const regionalProgress = {
    id: 0,
    label: 'Regionali',
    caughtInGen: regionalCaught,
    total: regionalCount,
    pct: regionalCount > 0 ? Math.round((regionalCaught / regionalCount) * 100) : 0,
    flag: '🌎',
  };
 
  const regionalStats = GEN_RANGES.map(gen => { 
    const total = gen.range[1] - gen.range[0] + 1; 
    const caughtInGen = Array.from({ length: total }, (_, i) => gen.range[0] + i) 
      .filter(id => pokedex[id] === 'caught').length; 
    const pct = Math.round((caughtInGen / total) * 100); 
    const flags: Record<number, string> = { 1: '🗾', 2: '🌸', 3: '🌊', 4: '❄️', 5: '🗽', 6: '🗼', 7: '🌺', 8: '⚔️', 9: '🔴' };
    return { ...gen, caughtInGen, total, pct, flag: flags[gen.id] }; 
  });

  const filteredEntries = Object.entries(pokedex)
    .map(([id, status]) => ({ id: Number(id), status }))
    .filter(({ id }) => {
      if (filterGen) {
        const range = GEN_RANGES.find(g => g.id === filterGen)?.range;
        if (range && (id < range[0] || id > range[1])) return false;
      }
      if (filterRegional && id <= 10000) return false;
      if (filterMega && !MEGA_IDS.has(Number(id))) return false;
      return true;
    })
    .sort((a, b) => a.id - b.id);

  const [pokedexEntryTypes, setPokedexEntryTypes] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchMissingTypes = async () => {
      const missingEntries = filteredEntries.filter(
        ({ id }) => !pokedexTypes[id] && !pokedexEntryTypes[id]
      );

      if (missingEntries.length > 0) {
        const newTypes: Record<number, string> = {};
        const promises = missingEntries.map(async ({ id }) => {
          try {
            const data = await api.getPokemon(id);
            newTypes[id] = data.types[0].type.name;
          } catch (error) {
            console.error(`Failed to fetch type for Pokemon ID ${id}:`, error);
          }
        });
        await Promise.all(promises);
        setPokedexEntryTypes(prev => ({ ...prev, ...newTypes }));
        // Salva permanentemente nello store globale i tipi appena scaricati
        savePokedexTypes(newTypes);
      }
    };
    fetchMissingTypes();
  }, [filteredEntries, pokedexTypes, pokedexEntryTypes]);

  return ( 
    <div className="h-full flex flex-col bg-[#0f0f1a]"> 
      {/* Header */} 
      <div className="p-6 pb-3"> 
        <div className="flex items-center justify-between mb-4"> 
          <div className="flex items-center gap-4">
            <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl"> 
              <ArrowLeft size={20} /> 
            </button> 
            <h2 className="text-2xl font-black uppercase tracking-tighter">Pokédex</h2> 
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTypeCalc(true)}
              className="p-2 rounded-xl transition-colors bg-[#1a1a2e] text-white/60"
            >
              <Calculator size={20} />
            </button>
            <button
              onClick={() => setShowProgress(!showProgress)}
              className={`p-2 rounded-xl transition-colors ${showProgress ? 'bg-[#e63946] text-white' : 'bg-[#1a1a2e] text-white/60'}`}
            >
              Progressi
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-colors ${showFilters ? 'bg-[#e63946] text-white' : 'bg-[#1a1a2e] text-white/60'}`}
            >
              <Filter size={20} />
            </button>
          </div>
        </div> 

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-[#1a1a2e] rounded-2xl p-4 border border-white/5 space-y-4">
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase mb-2">Generazione</p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setFilterGen(null)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!filterGen ? 'bg-[#e63946] text-white' : 'bg-white/5 text-white/40'}`}
                    >
                      TUTTE
                    </button>
                    {GEN_RANGES.map(gen => (
                      <button 
                        key={gen.id}
                        onClick={() => setFilterGen(gen.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterGen === gen.id ? 'bg-[#e63946] text-white' : 'bg-white/5 text-white/40'}`}
                      >
                        {gen.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/30 uppercase mb-2">Categoria</p>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setFilterRegional(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!filterRegional ? 'bg-[#e63946] text-white' : 'bg-white/5 text-white/40'}`}
                    >
                      TUTTE
                    </button>
                    <button 
                      onClick={() => setFilterRegional(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterRegional ? 'bg-[#e63946] text-white' : 'bg-white/5 text-white/40'}`}
                    >
                      REGIONALI
                    </button>
                    <button 
                      onClick={() => setFilterMega(m => !m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        filterMega ? 'bg-[#e63946] text-white' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      MEGA
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-[minmax(0,320px)_1fr] gap-3">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1a1a2e] rounded-2xl p-3 text-center border border-white/5">
                <div className="text-xl font-black text-yellow-400">{caught}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase">Catturati</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-2xl p-3 text-center border border-white/5">
                <div className="text-xl font-black text-blue-400">{seen}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase">Visti</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-2xl p-3 text-center border border-white/5">
                <div className="text-xl font-black text-white/60">1025</div>
                <div className="text-[10px] text-white/40 font-bold uppercase">Totali</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1a1a2e] rounded-2xl p-3 text-center border border-white/5">
                <div className="text-xl font-black text-purple-400">{regionalCaught}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase">Regionali</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-2xl p-3 text-center border border-white/5">
                <div className="text-xl font-black text-purple-400">{regionalTotal}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase">Regionali tot.</div>
              </div>
              <div className="bg-[#1a1a2e] rounded-2xl p-3 text-center border border-white/5">
                <div className="text-xl font-black text-pink-400">{megaCaught}</div>
                <div className="text-[10px] text-white/40 font-bold uppercase">Mega</div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showProgress && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#1a1a2e]/50 rounded-2xl p-3 border border-white/5 max-h-[24rem] overflow-y-auto">
                  {[regionalProgress, ...regionalStats].map(gen => {
                    const isClaimed = gen.id !== 0 && claimedPokedexRewards.includes(`gen${gen.id}`);
                    const canClaim = gen.id !== 0 && gen.pct === 100 && !isClaimed;
                    return (
                      <div key={gen.id} className="space-y-1.5 mb-3 last:mb-0">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="flex items-center gap-2">
                            <span>{gen.flag}</span>
                            <span className="text-white/60">{gen.label}</span>
                          </span>
                          <span className="text-white/40">{gen.caughtInGen}/{gen.total} ({gen.pct}%)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${gen.pct}%` }}
                              className={`h-full rounded-full ${
                                gen.pct >= 70 ? 'bg-green-500' : gen.pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            />
                          </div>
                          {isClaimed ? (
                            <span className="text-[9px] font-black uppercase text-green-500/80 px-2 py-0.5 bg-green-500/10 rounded-lg">
                              ✓ RITIRATO
                            </span>
                          ) : canClaim ? (
                            <button
                              onClick={() => claimPokedexReward(`gen${gen.id}`)}
                              className="text-[9px] font-black uppercase bg-[#e63946] text-white px-2 py-1 rounded-lg animate-pulse"
                            >
                              🎁 RITIRA
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div> 
 
      {/* Griglia — solo catturati */} 
      <div className="overflow-y-auto flex-1 px-4 pb-24 no-scrollbar"> 
        {filteredEntries.length === 0 ? ( 
          <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3"> 
            <span className="text-5xl">📖</span> 
            <p className="font-bold text-sm">Nessun Pokémon trovato!</p> 
          </div> 
        ) : ( 
          <div className="grid grid-cols-4 gap-3"> 
            {filteredEntries.map(({ id, status }) => {
                const isSeen = status === 'seen';
                const primaryType = pokedexTypes[id] || pokedexEntryTypes[id];
                const typeStyle = primaryType ? {
                  background: `linear-gradient(135deg, ${POKEDEX_TYPE_COLORS[primaryType]?.bg ?? 'rgba(255,255,255,0.05)'} 0%, #13132a 70%)`,
                  borderColor: POKEDEX_TYPE_COLORS[primaryType]?.border ?? '#ffffff15',
                  borderWidth: 2,
                } : {};
                return ( 
                  <button 
                    key={id} 
                    onClick={() => !isSeen ? handleSelect(id) : undefined}
                    disabled={isSeen}
                    style={typeStyle}
                    className={`rounded-2xl p-2 flex flex-col items-center gap-1 transition-all ${!primaryType ? 'bg-[#1a1a2e] border border-white/10' : ''} ${isSeen ? 'cursor-default' : 'active:border-[#e63946]'}`}
                  > 
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} 
                      className="w-16 h-16 object-contain"
                      style={isSeen ? { filter: 'brightness(0) opacity(0.5)' } : undefined}
                    /> 
                    <span className="text-[10px] font-mono text-white/30"> 
                      #{id.toString().padStart(3, '0')} 
                    </span>
                    {isSeen && <span className="text-[8px] text-white/20 font-bold uppercase">Visto</span>}
                  </button> 
                ); 
              })} 
          </div> 
        )} 
      </div> 
 
      {/* Loading indicator */} 
      {loadingModal && ( 
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"> 
          <div className="text-white/60 font-bold animate-pulse">Caricamento...</div> 
        </div> 
      )} 
 
      {/* MODAL DETTAGLIO */} 
      <AnimatePresence> 
        {selected && !loadingModal && ( 
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col" 
            onClick={() => setSelected(null)} 
          > 
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25 }} 
              className="absolute bottom-0 left-0 right-0 bg-[#0f0f1a] rounded-t-[32px] flex flex-col" 
              style={{ maxHeight: '90vh' }} 
              onClick={e => e.stopPropagation()} 
            > 
              {/* Header modal */} 
              <div className="relative p-6 pb-0"> 
                <div className="flex items-start justify-between"> 
                  <div> 
                    <p className="text-[10px] text-white/30 font-mono"> 
                      #{selected.id.toString().padStart(3, '0')} 
                    </p> 
                    <h2 className="text-2xl font-black uppercase"> 
                      {api.getItalianName(selected.species.names)} 
                    </h2> 
                    <div className="flex gap-2 mt-1"> 
                      {selected.types.map((t: any) => ( 
                        <TypeBadge key={t.type.name} type={t.type.name as any} /> 
                      ))} 
                    </div> 
                  </div> 
                  <button 
                    onClick={() => setSelected(null)} 
                    className="p-2 bg-white/10 rounded-xl mt-1" 
                  > 
                    <X size={18} /> 
                  </button> 
                </div> 
 
                {/* Sprite */} 
                <div className="flex justify-center my-2"> 
                  <img 
                    src={selected.sprites?.other?.['official-artwork']?.front_default || selected.sprites?.front_default} 
                    className="w-36 h-36 object-contain drop-shadow-2xl" 
                  /> 
                </div> 
 
                {/* Tab bar */} 
                <div className="flex gap-1 bg-[#1a1a2e] p-1 rounded-2xl mb-4"> 
                  {(['info','stats','moves','evo'] as const).map(t => ( 
                    <button 
                      key={t} 
                      onClick={() => setTab(t)} 
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${ 
                        tab === t ? 'bg-[#e63946] text-white' : 'text-white/40' 
                      }`} 
                    > 
                      {t === 'info' ? 'Info' : t === 'stats' ? 'Stats' : t === 'moves' ? 'Mosse' : 'Evo'} 
                    </button> 
                  ))} 
                </div> 
              </div> 
 
              {/* Contenuto tab */} 
              <div className="overflow-y-auto px-6 pb-8 no-scrollbar flex-1"> 
 
                {/* TAB INFO */} 
                {tab === 'info' && ( 
                  <div className="space-y-4"> 
                    <p className="text-sm text-white/60 leading-relaxed italic"> 
                      "{api.getItalianDescription(selected.species.flavor_text_entries)}" 
                    </p> 
                    <div className="grid grid-cols-2 gap-3"> 
                      {[ 
                        { label: 'Altezza', value: `${selected.height / 10} m` }, 
                        { label: 'Peso',    value: `${selected.weight / 10} kg` }, 
                        { label: 'Cattura', value: `${selected.species.capture_rate}` }, 
                        { label: 'Felicità base', value: `${selected.species.base_happiness ?? '–'}` }, 
                        { label: 'Gen.',    value: selected.species.generation?.name?.replace('generation-','').toUpperCase() ?? '–' }, 
                        { label: 'Crescita', value: selected.species.growth_rate?.name ?? '–' }, 
                      ].map(({ label, value }) => ( 
                        <div key={label} className="bg-[#1a1a2e] rounded-2xl p-3 border border-white/5"> 
                          <p className="text-[10px] text-white/30 uppercase font-bold">{label}</p> 
                          <p className="font-black text-sm mt-0.5">{value}</p> 
                        </div> 
                      ))} 
                    </div> 
                    {/* Abilità */} 
                    <div> 
                      <p className="text-[10px] text-white/30 uppercase font-bold mb-2">Abilità</p> 
                      <div className="flex flex-wrap gap-2"> 
                        {selected.abilities?.map((a: any) => ( 
                          <span 
                            key={a.ability.name} 
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${ 
                              a.is_hidden 
                                ? 'border-purple-500/30 bg-purple-500/10 text-purple-300' 
                                : 'border-white/10 bg-white/5' 
                            }`} 
                          > 
                            {a.ability.name.replace('-', ' ')} 
                            {a.is_hidden && <span className="text-[9px] ml-1 opacity-60">(nascosta)</span>} 
                          </span> 
                        ))} 
                      </div> 
                    </div> 
                  </div> 
                )} 
 
                {/* TAB STATS */} 
                {tab === 'stats' && ( 
                  <div className="space-y-3"> 
                    {selected.stats.map((s: any) => { 
                      const key = s.stat.name 
                        .replace('special-attack','spAtk') 
                        .replace('special-defense','spDef') 
                        .replace('-',''); 
                      const meta = STAT_META[key] ?? STAT_META[s.stat.name] ?? { label: s.stat.name, icon: null, color: '#fff' }; 
                      const pct = Math.min(100, Math.floor((s.base_stat / 255) * 100)); 
                      return ( 
                        <div key={s.stat.name} className="flex items-center gap-3"> 
                          <div className="w-16 flex items-center gap-1 text-[10px] font-bold text-white/50 uppercase"> 
                            {meta.label} 
                          </div> 
                          <div className="w-8 text-right font-black text-sm">{s.base_stat}</div> 
                          <div className="flex-1 bg-white/10 rounded-full h-2.5 overflow-hidden"> 
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${pct}%` }} 
                              transition={{ duration: 0.5, delay: 0.1 }} 
                              className="h-full rounded-full" 
                              style={{ backgroundColor: meta.color }} 
                            /> 
                          </div> 
                        </div> 
                      ); 
                    })} 
                    {/* Totale */} 
                    <div className="flex items-center gap-3 pt-2 border-t border-white/10"> 
                      <div className="w-16 text-[10px] font-bold text-white/50 uppercase">Totale</div> 
                      <div className="w-8 text-right font-black text-sm text-[#e63946]"> 
                        {selected.stats.reduce((acc: number, s: any) => acc + s.base_stat, 0)} 
                      </div> 
                    </div> 
                  </div> 
                )} 
 
                {/* TAB MOSSE */} 
                {tab === 'moves' && ( 
                  <div className="space-y-2"> 
                    {selected.moves 
                      ?.filter((m: any) => 
                        m.version_group_details.some((v: any) => v.move_learn_method.name === 'level-up') 
                      ) 
                      .sort((a: any, b: any) => { 
                        const la = a.version_group_details.find((v: any) => v.move_learn_method.name === 'level-up')?.level_learned_at ?? 0; 
                        const lb = b.version_group_details.find((v: any) => v.move_learn_method.name === 'level-up')?.level_learned_at ?? 0; 
                        return la - lb; 
                      }) 
                      .slice(0, 30) 
                      .map((m: any) => { 
                        const lv = m.version_group_details.find((v: any) => v.move_learn_method.name === 'level-up')?.level_learned_at ?? 0; 
                        return ( 
                          <div key={m.move.name} className="flex items-center gap-3 bg-[#1a1a2e] rounded-xl px-4 py-2.5 border border-white/5"> 
                            <span className="text-[10px] font-mono text-white/30 w-8">Lv.{lv}</span> 
                            <span className="flex-1 text-xs font-bold capitalize">{m.move.name.replace('-', ' ')}</span> 
                          </div> 
                        ); 
                      })} 
                  </div> 
                )} 
 
                {/* TAB EVOLUZIONE */} 
                {tab === 'evo' && ( 
                  <div className="space-y-3"> 
                    {evolutions.length <= 1 ? ( 
                      <p className="text-center text-white/30 italic text-sm py-4"> 
                        Questo Pokémon non si evolve. 
                      </p> 
                    ) : ( 
                      evolutions.map((evo, idx) => ( 
                        <div key={evo.id} className="flex items-center gap-4"> 
                          {idx > 0 && ( 
                            <div className="text-white/20 text-xl font-black pl-2">→</div> 
                          )} 
                          <div className={`flex items-center gap-3 flex-1 p-3 rounded-2xl border ${ 
                            evo.id === selected.id 
                              ? 'border-[#e63946] bg-[#e63946]/10' 
                              : 'border-white/5 bg-[#1a1a2e]' 
                          }`}> 
                            {evo.sprite && ( 
                              <img src={evo.sprite} className="w-14 h-14 object-contain" /> 
                            )} 
                            <div> 
                              <p className="font-black text-sm uppercase capitalize">{evo.name}</p> 
                              <p className="text-[10px] text-white/30">#{evo.id.toString().padStart(3,'0')}</p> 
                            </div> 
                            {evo.id === selected.id && ( 
                              <span className="ml-auto text-[10px] text-[#e63946] font-black">ATTUALE</span> 
                            )} 
                          </div> 
                        </div> 
                      )) 
                    )} 
                  </div> 
                )} 
 
              </div> 
            </motion.div> 
          </motion.div> 
        )} 
      </AnimatePresence> 

      {/* MODAL CALCOLATORE TIPI */}
      <AnimatePresence>
        {showTypeCalc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
            onClick={() => { setShowTypeCalc(false); setCalcAttackType(null); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 bg-[#0f0f1a] rounded-t-[32px] flex flex-col"
              style={{ maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black uppercase">Calcolatore Tipi</h2>
                  <button onClick={() => { setShowTypeCalc(false); setCalcAttackType(null); }}
                    className="p-2 bg-white/10 rounded-xl"><X size={18} /></button>
                </div>
                <p className="text-xs text-white/40 mb-4">Scegli un tipo attaccante per vedere l'efficacia su tutti i tipi difensivi.</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(Object.keys(TYPE_CHART) as string[]).map(t => (
                    <button key={t}
                      onClick={() => setCalcAttackType(calcAttackType === t ? null : t)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all ${calcAttackType === t ? 'border-[#e63946] bg-[#e63946]/20 text-white' : 'border-white/10 bg-[#1a1a2e] text-white/50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {calcAttackType && (
                <div className="overflow-y-auto px-6 pb-8 no-scrollbar flex-1">
                  {[
                    { label: '⚡ Superefficace ×2', mult: 2, color: 'text-green-400 border-green-500/30 bg-green-500/10' },
                    { label: '✅ Neutro ×1', mult: 1, color: 'text-white/60 border-white/10 bg-white/5' },
                    { label: '🔻 Non molto efficace ×0.5', mult: 0.5, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
                    { label: '🚫 Nessun effetto ×0', mult: 0, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
                  ].map(({ label, mult, color }) => {
                    const chart = TYPE_CHART[calcAttackType as PokemonType] ?? {};
                    const types = (Object.keys(TYPE_CHART) as string[]).filter(defType => {
                      const val = chart[defType as PokemonType] ?? 1;
                      return val === mult;
                    });
                    if (types.length === 0) return null;
                    return (
                      <div key={mult} className="mb-4">
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${color.split(' ')[0]}`}>{label}</p>
                        <div className="flex flex-wrap gap-2">
                          {types.map(t => (
                            <span key={t} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${color}`}>{t}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!calcAttackType && (
                <div className="flex items-center justify-center py-8 text-white/20 text-sm">
                  Seleziona un tipo attaccante
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
} 
