import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Package, Heart, Zap, Star, Loader, X } from 'lucide-react';
import NatureSelector from '../ui/NatureSelector';
import StatComparison from '../ui/StatComparison'; 

export default function BagScreen() {
  const { inventory, medals, setScreen, useItem, addItem, addCoins, team, box, updatePokemon, expShareActive, toggleExpShare, expBoostActive, toggleExpBoost, useRareCandy, useSpeciesCandy, changeNature } = useStore();
  const [tab, setTab] = useState<'balls' | 'heal' | 'candy'>('balls');

  useEffect(() => {
    const bossesWon = medals.filter((m: any) => m.isUnlocked).length;
    if (bossesWon >= 40) {
      if ((inventory['exp_share'] || 0) === 0) {
        addItem('exp_share', 1);
      }
      if ((inventory['exp_boost'] || 0) === 0) {
        addItem('exp_boost', 1);
      }
    }
  }, [medals, inventory, addItem]);

  const SELL_PRICES: Record<string, number> = {
    pokeball: 100,
    potion: 150,
    superpotion: 350,
    hyperpotion: 750,
    full_heal: 150,
  };

  const [pendingItem, setPendingItem] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [sellItem, setSellItem] = useState<{ id: string; name: string; icon: string; sellPrice: number } | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [tmMoves, setTmMoves] = useState<any[]>([]); 
  const [tmPokemon, setTmPokemon] = useState<any>(null); 
  const [loadingTm, setLoadingTm] = useState(false);

  // Nature Changer Flow States
  const [natureChangerStep, setNatureChangerStep] = useState<'select_pokemon' | 'select_nature' | 'confirm_change'>('select_pokemon');
  const [selectedNatureChangerPokemon, setSelectedNatureChangerPokemon] = useState<any>(null);
  const [selectedNewNature, setSelectedNewNature] = useState<string | null>(null);

  const items = useMemo(() => ({
    balls: [
      { id: 'pokeball', name: 'Pokéball', icon: '🔴' },
      { id: 'megaball', name: 'Megaball', icon: '🔵' },
      { id: 'ultraball', name: 'Ultraball', icon: '🟡' },
      { id: 'masterball', name: 'Masterball', icon: '🟣' },
    ],
    heal: [
      { id: 'potion', name: 'Pozione', icon: '🧪', description: 'Ripristina 30 HP' },
      { id: 'superpotion', name: 'Superpozione', icon: '🧪', description: 'Ripristina 80 HP' },
      { id: 'hyperpotion', name: 'Iperpozione', icon: '🧪', description: 'Ripristina 200 HP' },
      { id: 'full_heal', name: 'Cura Totale', icon: '💊', description: 'Cura qualsiasi stato alterato (PSN, BRN, PAR, SLP, FRZ)' },
    ],
    candy: [
        { id: 'exp_share', name: 'Condividi ESP', icon: '📡', description: expShareActive ? '✅ Attivo — tutta la squadra riceve ESP' : '❌ Disattivo — solo il Pokémon attivo', isToggle: true }, 
        { id: 'exp_boost', name: 'Potenziamento ESP', icon: '⚡', description: expBoostActive ? '✅ Attivo — ESP bonus +100%' : '❌ Disattivo — ESP normale', isToggle: true },
        { id: 'tm', name: 'MT Casuale', icon: '💿', description: 'Insegna una mossa MT' }, 
        { id: 'heart_scale', name: 'Squama Cuore', icon: '❤️', description: 'Insegna una mossa potente o rara' },
        { id: 'nature_changer', name: 'Modificatore Natura', icon: '🧬', description: 'Cambia la natura di un Pokémon della squadra' },
        { id: 'rare_candy', name: 'Caramella Rara', icon: '🍬' },
        { id: 'fire_stone', name: 'Pietra Focaia', icon: '🔥' },
        { id: 'water_stone', name: 'Pietra Idrica', icon: '💧' },
        { id: 'thunder_stone', name: 'Pietra Tuono', icon: '⚡' },
        { id: 'leaf_stone', name: 'Pietra Foglia', icon: '🍃' },
        { id: 'moon_stone', name: 'Pietra Lunare', icon: '🌙' },
        { id: 'dawn_stone', name: 'Pietra Alba', icon: '🌅' },
        { id: 'ice_stone', name: 'Pietra Ghiaccio', icon: '🧊' },
        { id: 'dark_stone', name: 'Pietra Buia', icon: '🌑' },
        { id: 'sun_stone', name: 'Pietra Solare', icon: '☀️' },
        { id: 'prism_scale', name: 'Scaglia Prisma', icon: '🌈' },
        // Caramelle specie dinamiche dai pokemon in squadra/box 
        ...[...team, ...box].reduce((acc: any[], p) => { 
          const key = `candy_${p.baseSpeciesId ?? p.pokemonId}`; 
          if (!acc.find(i => i.id === key) && (inventory[key] || 0) > 0) { 
            acc.push({ id: key, name: `Caramella ${p.name}`, icon: '🍭' }); 
          } 
          return acc; 
        }, []), 
      ]
  }), [inventory, team, box, expShareActive, expBoostActive]);

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
                {'description' in item && ( 
                  <p className="text-[10px] text-white/50 mt-0.5">{(item as any).description}</p> 
                )} 
                <p className="text-xs text-white/30">Posseduti: {inventory[item.id] || 0}</p>
              </div>
            </div>
            {(inventory[item.id] || 0) > 0 && (
              <div className="flex items-center gap-2">
                {SELL_PRICES[item.id] && (
                  <button
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-yellow-500"
                    onClick={() => {
                      setSellItem({ id: item.id, name: item.name, icon: item.icon, sellPrice: SELL_PRICES[item.id] });
                      setSellQty(1);
                    }}
                  >
                    VENDI
                  </button>
                )}
                {tab !== 'balls' && (
                  <button 
                    className={`px-4 py-2 rounded-xl text-xs font-bold ${ (item as any).isToggle ? (item.id === 'exp_share' ? (expShareActive ? 'bg-green-500' : 'bg-slate-600') : item.id === 'exp_boost' ? (expBoostActive ? 'bg-green-500' : 'bg-slate-600') : 'bg-slate-600') : 'bg-[#e63946]' }`} 
                    onClick={() => {
                      if ((item as any).isToggle) {
                        if (item.id === 'exp_share') toggleExpShare();
                        else if (item.id === 'exp_boost') toggleExpBoost();
                      } else {
                        setPendingItem(item);
                      }
                    }} 
                  > 
                    {(item as any).isToggle ? (item.id === 'exp_share' ? (expShareActive ? 'ON' : 'OFF') : item.id === 'exp_boost' ? (expBoostActive ? 'ON' : 'OFF') : 'OFF') : 'USA'} 
                  </button> 
                )}
              </div>
            )}
          </div> 
        ))} 
      </div>

      {/* Overlay selezione Pokémon */} 
      <AnimatePresence> 
        {pendingItem && ( 
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end" 
            onClick={() => setPendingItem(null)} 
          > 
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              className="bg-[#1a1a2e] rounded-t-3xl p-6 space-y-3" 
              onClick={e => e.stopPropagation()} 
            > 
              <div className="flex items-center justify-between mb-2"> 
                <div className="flex items-center gap-3"> 
                   <span className="text-2xl">{pendingItem.icon}</span> 
                   <div> 
                     <h3 className="font-black text-lg">{pendingItem.name}</h3> 
                     <p className="text-xs text-white/40">Scegli su chi usarla</p> 
                   </div> 
                </div> 
                <button onClick={() => setPendingItem(null)} className="p-2 bg-white/10 rounded-xl"> 
                  ✕ 
                </button> 
              </div> 
 
              {team.map(p => { 
                const isFullHp = p.currentHp >= p.stats.hp; 
                const isHeal = ['potion','superpotion','hyperpotion'].includes(pendingItem.id); 
                const isFullHeal = pendingItem.id === 'full_heal'; 
                const disabled = isHeal ? p.currentHp >= p.stats.hp : isFullHeal ? !p.status : false; 
 
                const handleUse = async () => { 
                  if (disabled || isProcessing) return; 
                  
                  // Gestione MT o Squama Cuore
                  if (pendingItem.id === 'tm' || pendingItem.id === 'heart_scale') { 
                    setIsProcessing(true); 
                    setLoadingTm(true); 
                    try { 
                      const data = await api.getPokemon(p.pokemonId); 
                      const BANNED_TM = new Set([ 
                        'protect','detect','endure','substitute','splash','celebrate','hold-hands', 
                        'confuse-ray','swagger','flatter','supersonic','teeter-dance','attract','captivate', 
                        'taunt','encore','torment','disable','snatch','thief','trick','switcheroo','embargo', 
                        'sleep-talk','baton-pass','u-turn','volt-switch','parting-shot', 
                        'sunny-day','rain-dance','sandstorm','hail','snow', 
                        'grassy-terrain','misty-terrain','electric-terrain','psychic-terrain','gravity', 
                        'magic-room','wonder-room','mud-sport','water-sport','trick-room', 
                        'spikes','stealth-rock','toxic-spikes','sticky-web', 
                        'whirlwind','roar','mean-look','block','spider-web', 
                        'reflect','light-screen','aurora-veil','safeguard','mist','tailwind','lucky-chant', 
                        'healing-wish','lunar-dance','helping-hand','follow-me','rage-powder','spotlight', 
                        'transform','mirror-move','mimic','sketch','copycat','me-first','assist','metronome', 
                        'nature-power','instruct','conversion','conversion2','camouflage', 
                        'sonic-boom','dragon-rage','night-shade','seismic-toss','super-fang','psywave', 
                        'fissure','guillotine','horn-drill','sheer-cold', 
                        'self-destruct','explosion','wide-guard','quick-guard','memento','final-gambit', 
                        'destiny-bond','counter','mirror-coat','metal-burst','bide','focus-punch', 
                        'shell-trap','endeavor','pain-split','stockpile','swallow','spit-up', 
                        'future-sight','doom-desire','haze','topsy-turvy','fling','bestow','heal-block', 
                        'perish-song','yawn','imprison','frustration','return','beat-up', 
                        'leech-seed','ingrain','aqua-ring','curse','nightmare','telekinesis','magnet-rise', 
                        'autotomize','charge','recycle','belch','false-swipe','wish','struggle','teleport', 
                      ]); 
                      
                      let candidateMoves = [];
                      if (pendingItem.id === 'tm') {
                        candidateMoves = data.moves.filter((m: any) => 
                          m.version_group_details.some((v: any) => v.move_learn_method.name === 'machine') && 
                          !BANNED_TM.has(m.move.name) 
                        ).slice(0, 30);
                      } else {
                        // Squama Cuore: tutte le mosse, ordinando per priorità (egg/tutor > machine/level-up) e potenza
                        candidateMoves = data.moves.filter((m: any) => !BANNED_TM.has(m.move.name));
                        // Mischia un po' per varietà ma favorisci le mosse forti
                      }

                      const moveDetails = await Promise.all( 
                        candidateMoves.slice(0, 45).map((m: any) => api.getMove(m.move.name)) 
                      ); 

                      let validMoves = moveDetails 
                        .filter((m: any) => m && m.power !== undefined && m.damage_class?.name !== 'status') 
                        .map((m: any) => ({ 
                          id: m.id.toString(), 
                          name: api.getItalianName(m.names), 
                          type: m.type.name, 
                          power: m.power || 0, 
                          accuracy: m.accuracy || 100, 
                          pp: m.pp, 
                          maxPp: m.pp, 
                          priority: m.priority || 0, 
                          category: m.damage_class.name, 
                          description: api.getItalianDescription(m.flavor_text_entries), 
                        })); 

                      if (pendingItem.id === 'heart_scale') {
                        // Ordina per potenza decrescente
                        validMoves = validMoves.sort((a, b) => b.power - a.power).slice(0, 30);
                      } else {
                        validMoves = validMoves.slice(0, 20);
                      }

                      setTmMoves(validMoves); 
                      setTmPokemon(p); 
                    } catch(e) { 
                      alert('Errore nel caricare le mosse!'); 
                    } finally { 
                      setLoadingTm(false); 
                      setIsProcessing(false); 
                    } 
                    return; 
                  } 
                  // Gestione Condividi ESP (toggle, non si usa su pokemon) 
                  if (pendingItem.id === 'exp_share') { 
                    toggleExpShare(); 
                    setPendingItem(null); 
                    return; 
                  } 
                  // Gestione Potenziamento ESP (toggle, non si usa su pokemon) 
                  if (pendingItem.id === 'exp_boost') { 
                    toggleExpBoost(); 
                    setPendingItem(null); 
                    return; 
                  } 
                  // Gestione Pietre Evolutive 
                  if (pendingItem.id.endsWith('_stone') || pendingItem.id === 'prism_scale') { 

                    setIsProcessing(true);
                    try {
                      const species = await api.getSpecies(p.pokemonId);
                      const itemNameForApi = pendingItem.id.replace('_', '-');
                      const evolution = await api.getEvolutionByItem(species, itemNameForApi);
                      
                      if (evolution) {
                        // Usa setState direttamente per impostare pendingEvolution con TUTTI i dati necessari
                        useStore.setState((state) => ({ 
                          pendingEvolution: { 
                            pokemonId: p.id, 
                            newPokemonId: evolution.newId, 
                            newName: evolution.newName,
                            newBaseStats: evolution.newBaseStats,
                            newTypes: evolution.newTypes as any
                          },
                          // Decrementa anche l'item qui per evitare conflitti con useItem
                          inventory: { 
                            ...state.inventory, 
                            [pendingItem.id]: Math.max(0, (state.inventory[pendingItem.id] || 0) - 1) 
                          }
                        }));
                        
                        setPendingItem(null);
                      } else {
                        alert(`${p.name} non può evolversi con questa pietra!`);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsProcessing(false);
                    }
                    return;
                  }

                  // Gestione Caramelle Rari/Specie
                  if (pendingItem.id === 'rare_candy') {
                    if (p.level >= 100) { alert('Livello massimo!'); return; }
                    useRareCandy(p.id);
                    setPendingItem(null);
                    return;
                  }
                  if (pendingItem.id.startsWith('candy_')) {
                    const speciesId = parseInt(pendingItem.id.split('_')[1]);
                    const owned = inventory[pendingItem.id] || 0;
                    if (p.level >= 100) { alert('Livello massimo!'); return; }
                    if ((p.pokemonId !== speciesId && p.baseSpeciesId !== speciesId)) { 
                      alert(`Questa caramella è specifica per la specie di ${p.name}!`); 
                      return; 
                    }
                    if (owned < 3) { alert(`Caramelle: ${owned}/3 — servono 3 caramelle!`); return; }
                    useSpeciesCandy(p.id, speciesId);
                    setPendingItem(null);
                    return;
                  }

                  // Gestione Nature Changer
                  if (pendingItem.id === 'nature_changer') {
                    setSelectedNatureChangerPokemon(p);
                    setNatureChangerStep('select_nature');
                    return;
                  }

                  if (isFullHeal) { 
                    updatePokemon(p.id, { status: null, sleepTurns: undefined }); 
                  } else { 
                    let healed = 0; 
                    if (pendingItem.id === 'potion') healed = 30; 
                    if (pendingItem.id === 'superpotion') healed = 80; 
                    if (pendingItem.id === 'hyperpotion') healed = 200; 
                    const newHp = Math.min(p.stats.hp, p.currentHp + healed); 
                    updatePokemon(p.id, { currentHp: newHp }); 
                  } 
                  useItem(pendingItem.id);
                  // Chiudi solo se esaurito
                  const remaining = (inventory[pendingItem.id] || 0) - 1;
                  if (remaining <= 0) setPendingItem(null); 
                  // Per le cure mediche non serve chiudere subito se ne hai altre
                }; 
 
                return ( 
                  <button 
                    key={p.id} 
                    onClick={handleUse} 
                    disabled={disabled} 
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all ${ 
                      disabled 
                        ? 'border-white/5 opacity-30 cursor-not-allowed' 
                        : 'border-white/10 bg-white/5 active:bg-white/10' 
                    }`} 
                  > 
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`} 
                      className="w-12 h-12 object-contain" 
                    /> 
                    <div className="flex-1 text-left"> 
                      <div className="font-black text-sm uppercase">{p.name}</div> 
                      <div className="flex items-center gap-2 mt-1"> 
                        <div className="flex-1 bg-white/10 rounded-full h-1.5"> 
                          <div 
                            className="h-1.5 rounded-full bg-green-400" 
                            style={{ width: `${(p.currentHp / p.stats.hp) * 100}%` }} 
                          /> 
                        </div> 
                        <span className="text-[10px] text-white/50">{p.currentHp}/{p.stats.hp}</span> 
                      </div> 
                      {p.status && ( 
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1 inline-block ${ 
                          p.status === 'PSN' ? 'bg-purple-500' : 
                          p.status === 'BRN' ? 'bg-orange-500' : 
                          p.status === 'PAR' ? 'bg-yellow-400 text-black' : 'bg-white/20' 
                        }`}>{p.status}</span> 
                      )} 
                    </div> 
                    {!disabled && ( 
                      <span className="text-xs font-black text-green-400">USA</span> 
                    )} 
                  </button> 
                ); 
              })} 
 
              {team.every(p => 
                pendingItem.id === 'full_heal' 
                  ? !p.status 
                  : p.currentHp >= p.stats.hp 
              ) && ( 
                <p className="text-center text-white/30 text-sm italic py-2"> 
                  {pendingItem.id === 'full_heal' 
                    ? 'Nessun Pokémon ha problemi di stato!' 
                    : 'Tutti i Pokémon sono a piena salute!'} 
                </p> 
              )} 
            </motion.div> 
          </motion.div> 
        )} 
      </AnimatePresence> 

      {/* Overlay vendita oggetto */}
      <AnimatePresence>
        {sellItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
            onClick={() => setSellItem(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#1a1a2e] rounded-t-3xl p-6 space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sellItem.icon}</span>
                  <div>
                    <h3 className="font-black text-lg">Vendi {sellItem.name}</h3>
                    <p className="text-xs text-white/40">Prezzo: {sellItem.sellPrice}¢ ciascuno</p>
                  </div>
                </div>
                <button onClick={() => setSellItem(null)} className="p-2 bg-white/10 rounded-xl">
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-white/40">Scegli la quantità da vendere</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={inventory[sellItem.id] || 1}
                    value={sellQty}
                    onChange={e => setSellQty(Math.min(Math.max(1, Number(e.target.value)), inventory[sellItem.id] || 1))}
                    className="w-full"
                  />
                  <span className="min-w-[2.5rem] text-right text-sm font-bold">{sellQty}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>Disponibili: {inventory[sellItem.id] || 0}</span>
                  <span>Totale: {(sellQty * sellItem.sellPrice).toLocaleString()}¢</span>
                </div>
              </div>

              <button
                disabled={(inventory[sellItem.id] || 0) <= 0}
                onClick={() => {
                  const maxQty = inventory[sellItem.id] || 0;
                  const qty = Math.min(Math.max(1, sellQty), maxQty);
                  if (qty <= 0) return;
                  addItem(sellItem.id, -qty);
                  addCoins(qty * sellItem.sellPrice);
                  setSellItem(null);
                }}
                className="w-full bg-green-500 disabled:opacity-50 text-black font-bold py-3 rounded-2xl"
              >
                CONFERMA
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay selezione Mosse MT */}
      <AnimatePresence> 
        {tmPokemon && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
            onClick={() => setTmPokemon(null)}
          > 
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              className="bg-[#1a1a2e] rounded-t-3xl p-6 space-y-4 max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            > 
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg uppercase">Impara una MT</h3>
                  <p className="text-xs text-white/40">Scegli la mossa per {tmPokemon.name}</p>
                </div>
                <button onClick={() => setTmPokemon(null)} className="p-2 bg-white/10 rounded-xl">
                  <X size={20} />
                </button>
              </div>

               {loadingTm && ( 
                 <div className="flex-1 flex items-center justify-center"> 
                   <Loader size={32} className="animate-spin text-white/40" /> 
                 </div> 
               )} 

               <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                {tmMoves.map(move => (
                  <button 
                    key={move.id} 
                    onClick={() => { 
                      const alreadyHas = tmPokemon.moves.some((m: any) => m.id === move.id); 
                      if (alreadyHas) { alert('Questo Pokémon conosce già questa mossa!'); return; } 
                      if (tmPokemon.moves.length < 4) { 
                        updatePokemon(tmPokemon.id, { moves: [...tmPokemon.moves, move] }); 
                      } else { 
                        useStore.setState((state) => ({ 
                          pendingNewMoveQueue: [...(state.pendingNewMoveQueue ?? []), { pokemonId: tmPokemon.id, move }] 
                        })); 
                      } 
                      if (pendingItem) useItem(pendingItem.id); 
                      setTmMoves([]); 
                      setTmPokemon(null); 
                      setPendingItem(null); 
                    }} 
                    className="w-full flex flex-col p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-left"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm uppercase">{move.name}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 uppercase">{move.type}</span>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">{move.description}</p>
                    <div className="flex gap-4 mt-2 text-[10px] font-bold">
                      <span className="text-orange-400">POT: {move.power}</span>
                      <span className="text-blue-400">ACC: {move.accuracy}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nature Changer Overlay */}
      <AnimatePresence>
        {pendingItem?.id === 'nature_changer' && selectedNatureChangerPokemon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
            onClick={() => {
              setPendingItem(null);
              setSelectedNatureChangerPokemon(null);
              setNatureChangerStep('select_pokemon');
              setSelectedNewNature(null);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#1a1a2e] rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto space-y-4"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧬</span>
                  <div>
                    <h3 className="font-black text-lg">Modificatore Natura</h3>
                    <p className="text-xs text-white/40">Cambia la natura di {selectedNatureChangerPokemon.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPendingItem(null);
                    setSelectedNatureChangerPokemon(null);
                    setNatureChangerStep('select_pokemon');
                    setSelectedNewNature(null);
                  }}
                  className="p-2 bg-white/10 rounded-xl"
                >
                  ✕
                </button>
              </div>

              {/* Step 1: Select Nature */}
              {natureChangerStep === 'select_nature' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold mb-3 uppercase text-white/70">Seleziona una nuova natura</h4>
                    <NatureSelector
                      currentNature={selectedNatureChangerPokemon.nature}
                      onSelect={(nature) => {
                        setSelectedNewNature(nature);
                        setNatureChangerStep('confirm_change');
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Confirm Change */}
              {natureChangerStep === 'confirm_change' && selectedNewNature && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold mb-3 uppercase text-white/70">Anteprima cambiamento</h4>
                    <StatComparison
                      pokemon={selectedNatureChangerPokemon}
                      oldNature={selectedNatureChangerPokemon.nature}
                      newNature={selectedNewNature}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setNatureChangerStep('select_nature');
                        setSelectedNewNature(null);
                      }}
                      className="flex-1 py-3 rounded-2xl font-bold bg-white/10 hover:bg-white/20 transition-all"
                    >
                      INDIETRO
                    </button>
                    <button
                      onClick={() => {
                        changeNature(selectedNatureChangerPokemon.id, selectedNewNature);
                        useItem('nature_changer');
                        setPendingItem(null);
                        setSelectedNatureChangerPokemon(null);
                        setNatureChangerStep('select_pokemon');
                        setSelectedNewNature(null);
                      }}
                      className="flex-1 py-3 rounded-2xl font-bold bg-green-500 hover:bg-green-600 transition-all text-black"
                    >
                      APPLICA
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
