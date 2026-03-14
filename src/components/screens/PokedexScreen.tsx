import React, { useState } from 'react'; 
import { useStore } from '../../store'; 
import { api } from '../../api'; 
import { motion, AnimatePresence } from 'motion/react'; 
import { ArrowLeft, X, Heart, Sword, Shield, Zap, Activity } from 'lucide-react'; 
import TypeBadge from '../ui/TypeBadge'; 

const STAT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = { 
  hp:      { label: 'HP',       icon: <Heart size={12} />,    color: '#f87171' }, 
  attack:  { label: 'ATT',      icon: <Sword size={12} />,    color: '#fb923c' }, 
  defense: { label: 'DIF',      icon: <Shield size={12} />,   color: '#60a5fa' }, 
  spAtk:   { label: 'ATT.SP',   icon: <Zap size={12} />,      color: '#c084fc' }, 
  spDef:   { label: 'DIF.SP',   icon: <Shield size={12} />,   color: '#34d399' }, 
  speed:   { label: 'VEL',      icon: <Activity size={12} />, color: '#facc15' }, 
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
  const { pokedex, setScreen } = useStore(); 
  const [selected, setSelected] = useState<any>(null); 
  const [loadingModal, setLoadingModal] = useState(false); 
  const [tab, setTab] = useState<'info' | 'stats' | 'moves' | 'evo'>('info'); 
  const [evolutions, setEvolutions] = useState<{ name: string; id: number; sprite: string }[]>([]); 
 
  const entries = Array.from({ length: 721 }, (_, i) => i + 1); 
 
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
 
  const seen  = Object.values(pokedex).filter(s => s === 'seen').length; 
  const caught = Object.values(pokedex).filter(s => s === 'caught').length; 
 
  return ( 
    <div className="h-full flex flex-col bg-[#0f0f1a]"> 
      {/* Header */} 
      <div className="p-6 pb-3"> 
        <div className="flex items-center gap-4 mb-4"> 
          <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl"> 
            <ArrowLeft size={20} /> 
          </button> 
          <h2 className="text-2xl font-black uppercase tracking-tighter">Pokédex</h2> 
        </div> 
        <div className="flex gap-3"> 
          <div className="flex-1 bg-[#1a1a2e] rounded-2xl p-3 text-center border border-white/5"> 
            <div className="text-xl font-black text-yellow-400">{caught}</div> 
            <div className="text-[10px] text-white/40 font-bold uppercase">Catturati</div> 
          </div> 
          <div className="flex-1 bg-[#1a1a2e] rounded-2xl p-3 text-center border border-white/5"> 
            <div className="text-xl font-black text-blue-400">{seen}</div> 
            <div className="text-[10px] text-white/40 font-bold uppercase">Visti</div> 
          </div> 
          <div className="flex-1 bg-[#1a1a2e] rounded-2xl p-3 text-center border border-white/5"> 
            <div className="text-xl font-black text-white/60">721</div> 
            <div className="text-[10px] text-white/40 font-bold uppercase">Totali</div> 
          </div> 
        </div> 
      </div> 
 
      {/* Griglia — solo catturati */} 
      <div className="overflow-y-auto flex-1 px-4 pb-24 no-scrollbar"> 
        {Object.entries(pokedex).filter(([, status]) => status === 'caught').length === 0 ? ( 
          <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3"> 
            <span className="text-5xl">📖</span> 
            <p className="font-bold text-sm">Nessun Pokémon catturato ancora!</p> 
          </div> 
        ) : ( 
          <div className="grid grid-cols-4 gap-3"> 
            {Object.entries(pokedex) 
              .filter(([, status]) => status === 'caught') 
              .sort(([a], [b]) => Number(a) - Number(b)) 
              .map(([idStr]) => { 
                const id = Number(idStr); 
                return ( 
                  <button 
                    key={id} 
                    onClick={() => handleSelect(id)} 
                    className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-2 flex flex-col items-center gap-1 active:border-[#e63946] transition-all" 
                  > 
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} 
                      className="w-16 h-16 object-contain" 
                    /> 
                    <span className="text-[10px] font-mono text-white/30"> 
                      #{id.toString().padStart(3, '0')} 
                    </span> 
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
    </div> 
  ); 
} 
