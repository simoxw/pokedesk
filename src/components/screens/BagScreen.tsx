import React, { useState } from 'react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Package, Heart, Zap, Star } from 'lucide-react';

export default function BagScreen() {
  const { inventory, setScreen, useItem, team, box, updatePokemon } = useStore();
  const [tab, setTab] = useState<'balls' | 'heal' | 'candy'>('balls');
  const [pendingItem, setPendingItem] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const items = {
    balls: [
      { id: 'pokeball', name: 'Pokéball', icon: '🔴' },
      { id: 'megaball', name: 'Megaball', icon: '🔵' },
      { id: 'ultraball', name: 'Ultraball', icon: '🟡' },
      { id: 'masterball', name: 'Masterball', icon: '🟣' },
    ],
    heal: [
      { id: 'potion', name: 'Pozione', icon: '🧪', description: 'Ripristina 20 HP' },
      { id: 'superpotion', name: 'Superpozione', icon: '🧪', description: 'Ripristina 50 HP' },
      { id: 'hyperpotion', name: 'Iperpozione', icon: '🧪', description: 'Ripristina 200 HP' },
      { id: 'full_heal', name: 'Cura Totale', icon: '💊', description: 'Cura qualsiasi stato alterato (PSN, BRN, PAR, SLP, FRZ)' },
    ],
    candy: [
        { id: 'rare_candy', name: 'Caramella Rara', icon: '🍬' },
        { id: 'fire_stone', name: 'Pietra Focaia', icon: '🔥' },
        { id: 'water_stone', name: 'Pietra Idrica', icon: '💧' },
        { id: 'thunder_stone', name: 'Pietra Tuono', icon: '⚡' },
        { id: 'leaf_stone', name: 'Pietra Foglia', icon: '🍃' },
        { id: 'moon_stone', name: 'Pietra Lunare', icon: '🌙' },
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
                {'description' in item && ( 
                  <p className="text-[10px] text-white/50 mt-0.5">{(item as any).description}</p> 
                )} 
                <p className="text-xs text-white/30">Posseduti: {inventory[item.id] || 0}</p>
              </div>
            </div>
            {(inventory[item.id] || 0) > 0 && tab !== 'balls' && ( 
              <button 
                className="bg-[#e63946] px-4 py-2 rounded-xl text-xs font-bold" 
                onClick={() => setPendingItem(item)} 
              > 
                USA 
              </button> 
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
                  
                  // Gestione Pietre Evolutive
                  if (pendingItem.id.endsWith('_stone')) {
                    setIsProcessing(true);
                    try {
                      const species = await api.getSpecies(p.pokemonId);
                      const itemNameForApi = pendingItem.id.replace('_', '-');
                      const evolution = await api.getEvolutionByItem(species, itemNameForApi);
                      
                      if (evolution) {
                        useStore.getState().updatePlayer({}); // trigger refresh? no, meglio evolution modal
                        useStore.setState({ 
                          pendingEvolution: { 
                            pokemonId: p.id, 
                            newPokemonId: evolution.newId, 
                            newName: evolution.newName 
                          } 
                        });
                        useItem(pendingItem.id);
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

                  if (isFullHeal) { 
                    updatePokemon(p.id, { status: null, sleepTurns: undefined }); 
                  } else { 
                    let healed = 0; 
                    if (pendingItem.id === 'potion') healed = 20; 
                    if (pendingItem.id === 'superpotion') healed = 50; 
                    if (pendingItem.id === 'hyperpotion') healed = 200; 
                    const newHp = Math.min(p.stats.hp, p.currentHp + healed); 
                    updatePokemon(p.id, { currentHp: newHp }); 
                  } 
                  useItem(pendingItem.id); 
                  setPendingItem(null); 
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
