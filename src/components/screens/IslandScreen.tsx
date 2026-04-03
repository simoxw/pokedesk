import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { CatchEngine } from '../../CatchEngine';
import { BattleEngine } from '../../BattleEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSoundEffects } from '../../useSoundEffects';
import PokemonSprite from '../ui/PokemonSprite';

const ISLAND_LEGENDARIES = [
  // Gen 1
  144, 145, 146, 150, 151,
  // Gen 2
  243, 244, 245, 249, 250, 251,
  // Gen 3
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  // Gen 4
  480, 481, 482, 483, 484, 485, 487, 488, 491, 492, 493,
  // Gen 5
  638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  // Gen 6
  716, 717, 718, 719, 720, 721,
  // Gen 7
  772, 773, 778, 779, 780, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802,
  // Gen 8
  888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 899, 900, 901, 902, 903, 904, 905, 906,
];

// Evento mensile: primo lunedì del mese (giorni 1-7)
const isEventDay = (date: Date) => {
  const day = date.getDate(); // 1-31
  const dayOfWeek = date.getDay(); // 0=Domenica, 1=Lunedì, ..., 6=Sabato
  // È lunedì (dayOfWeek === 1) E siamo nei primi 7 giorni del mese
  return dayOfWeek === 1 && day >= 1 && day <= 7;
};

export default function IslandScreen() {
  const { addPokemon, setScreen, incrementStat, addItem, inventory, updatePokedex, setIslandLastCatch, team, settings } = useStore();
  const [pokemon, setPokemon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isShiny, setIsShiny] = useState(false);
  const [ballType, setBallType] = useState('pokeball');
  const [catching, setCatching] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);
  const [circleSize, setCircleSize] = useState(100);
  const [attempts, setAttempts] = useState(0);
  const [ballVisible, setBallVisible] = useState(false);
  const [dropMessage, setDropMessage] = useState<string | null>(null);
  const maxAttempts = 3;

  useEffect(() => {
    if (!inventory[ballType] || inventory[ballType] === 0) {
      const first = ['pokeball','megaball','ultraball','masterball'].find(b => (inventory[b] || 0) > 0);
      if (first) setBallType(first);
    }
  }, [inventory, ballType]);

  const [isPerfectIVs, setIsPerfectIVs] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const dayHash = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const id = ISLAND_LEGENDARIES[dayHash % ISLAND_LEGENDARIES.length];
        const avgLevel = team.length > 0 ? Math.floor(team.reduce((acc, p) => acc + p.level, 0) / team.length) : 50;
        const level = Math.max(45, Math.min(70, avgLevel + 5));
        const data = await api.getPokemon(id);
        const species = await api.getSpecies(id);
        setPokemon({ ...data, species, level });

        // Check evento mensile (10% chance di IVs perfetti)
        const eventActive = isEventDay(new Date());
        const perfectRoll = eventActive && Math.random() < 0.10;
        setIsPerfectIVs(perfectRoll);

        // Shiny rate: 1/100 durante evento con IVs perfetti, altrimenti 1/512
        const shinyChance = perfectRoll ? 1 / 100 : 1 / 512;
        const shinyRoll = Math.random();
        setIsShiny(shinyRoll < shinyChance);

        updatePokedex(id, 'seen');
        try {
          const cry = new Audio(api.getPokemonCry(id));
          cry.volume = 0.5;
          if (settings.audio) cry.play().catch(() => {});
        } catch {}
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (catching || result) return;
    const interval = setInterval(() => {
      setCircleSize(prev => (prev <= 20 ? 100 : prev - 2));
    }, 30);
    return () => clearInterval(interval);
  }, [catching, result]);

  const handleCatch = async () => {
    if (catching || result || attempts >= maxAttempts) return;
    setCatching(true);
    setBallVisible(true);
    let bonus = 1.0;
    if (circleSize < 40) bonus = 2.0;
    else if (circleSize < 70) bonus = 1.5;
    useStore.getState().useItem(ballType);
    const success = CatchEngine.calculateCatchRate(pokemon.species, ballType, bonus, isShiny);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    await new Promise(r => setTimeout(r, 1200));
    setBallVisible(false);
    await new Promise(r => setTimeout(r, 300));
    const today = new Date().toISOString().split('T')[0];
    if (success) {
      setResult('success');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#fbbf24','#60a5fa','#a78bfa','#34d399'] });
      // IVs perfetti se evento, altrimenti random
      const ivs = isPerfectIVs 
        ? { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 }
        : CatchEngine.generateIVs();
      const nature = CatchEngine.getNature();
      const baseStats = {
        hp: pokemon.stats[0].base_stat, attack: pokemon.stats[1].base_stat,
        defense: pokemon.stats[2].base_stat, spAtk: pokemon.stats[3].base_stat,
        spDef: pokemon.stats[4].base_stat, speed: pokemon.stats[5].base_stat,
      };
      const stats = BattleEngine.calculateStats(pokemon.level, baseStats, ivs, { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, nature);
      const moves = await api.getPokemonMoves(pokemon, pokemon.level);
      const baseSpeciesId = await api.getBaseSpeciesId(pokemon.species);
      addPokemon({
        id: Math.random().toString(36).substr(2, 9),
        pokemonId: pokemon.id,
        name: api.getItalianName(pokemon.species.names),
        level: pokemon.level,
        exp: Math.floor(pokemon.level ** 3),
        types: pokemon.types.map((t: any) => t.type.name),
        baseStats, ivs,
        evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        stats, nature, moves,
        currentHp: stats.hp, status: null, isShiny,
        caughtAt: Date.now(),
        growthRate: pokemon.species.growth_rate.name,
        baseSpeciesId,
        spriteUrl: api.getSpriteUrl(pokemon, isShiny),
      });
      incrementStat('totalCaught');
      if (isShiny) incrementStat('shiniesFound');
      addItem(`candy_${baseSpeciesId}`, 3);
      addItem('pokeball', 2);
      addItem('potion', 2);
      setDropMessage('🔴 2 Pokéball · 🧪 2 Pozioni');
      updatePokedex(pokemon.id, 'caught');
      setIslandLastCatch(today);
    } else {
      if (newAttempts >= maxAttempts) {
        setIslandLastCatch(today);
        setResult('fail');
      } else {
        setCatching(false);
      }
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#0f0f1a] text-white/50 animate-pulse font-bold">
      Preparazione incontro...
    </div>
  );

  return (
    <div className="h-full relative overflow-hidden flex flex-col">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a2040 0%, #1a4060 30%, #0d6e6e 60%, #0a4a4a 100%)' }} />
        <div className="absolute top-6 right-10 w-12 h-12 rounded-full" style={{ background: '#ffe54d', boxShadow: '0 0 0 8px rgba(255,220,60,0.15), 0 0 40px rgba(255,200,40,0.2)' }} />
        {[1,2,3].map(i => (
          <motion.div key={i}
            animate={{ x: ['0%','15%','0%'] }}
            transition={{ duration: 4 + i * 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
            className="absolute"
            style={{ bottom: `${28 + i * 8}%`, left: 0, right: 0, height: 3, background: `rgba(100,200,220,${0.12 + i * 0.06})`, borderRadius: 2 }}
          />
        ))}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '30%', background: 'linear-gradient(180deg, #0a3a3a 0%, #062828 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,220,220,0.5), transparent)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4)' }} />
      </div>

      <div className="relative z-10 pt-6 pb-2 text-center">
        {isPerfectIVs && (
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/30 via-amber-400/30 to-yellow-500/30 border border-yellow-400/50 rounded-full px-4 py-1.5 mb-2"
          >
            <span className="text-yellow-300 font-black text-xs uppercase tracking-widest">🌟 EVENTO SPECIALE - IVs PERFETTI!</span>
          </motion.div>
        )}
        <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-4 py-1.5 mb-2">
          <span className="text-yellow-400 font-black text-xs uppercase tracking-widest">⭐ Pokémon Leggendario</span>
        </div>
        <h2 className="text-3xl font-black drop-shadow-lg text-cyan-300">
          {api.getItalianName(pokemon.species.names)}
        </h2>
        <p className="font-bold opacity-60 text-sm">Lv. {pokemon.level}</p>
        {isPerfectIVs && (
          <div className="mt-2 flex items-center justify-center gap-1">
            {[31,31,31,31,31,31].map((iv, i) => (
              <span key={i} className="text-[10px] font-black text-yellow-400 bg-yellow-500/20 px-1.5 py-0.5 rounded">
                {['HP','ATK','DEF','SPA','SPD','SPE'][i]}: {iv}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="relative flex items-center justify-center" style={{ height: 280 }}>
          <motion.img
            animate={catching ? { scale: [1, 0.8, 1] } : { y: [0, -12, 0] }}
            transition={catching ? { duration: 0.4 } : { duration: 3, repeat: Infinity }}
            src={isShiny
              ? (pokemon.sprites.other?.['official-artwork']?.front_shiny || pokemon.sprites.front_shiny)
              : (pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default)}
            className="w-72 h-72 object-contain drop-shadow-2xl"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = '1';
                img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon?.id}.png`;
              }
            }}
          />
          {isShiny && !catching && (
            <motion.div animate={{ opacity: [0,1,0], scale: [0.5,1.2,0.5] }} transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 flex items-center justify-center text-yellow-300 pointer-events-none">
              <Sparkles size={100} />
            </motion.div>
          )}
          {!catching && !result && (
            <div className="absolute border-2 rounded-full pointer-events-none transition-all"
              style={{ width: circleSize * 2, height: circleSize * 2, borderColor: circleSize < 40 ? '#4ade80' : circleSize < 70 ? '#facc15' : '#ffffff80' }} />
          )}
          <AnimatePresence>
            {ballVisible && (
              <motion.img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${
                  ballType === 'megaball' ? 'great-ball' : ballType === 'ultraball' ? 'ultra-ball' : ballType === 'masterball' ? 'master-ball' : 'poke-ball'}.png`}
                initial={{ y: 160, scale: 0.8, opacity: 1 }}
                animate={{ y: -20, x: [0,-15,15,0], scale: [0.8,1.2,1], rotate: [0,360,720] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                className="absolute w-14 h-14 object-contain pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-20 p-6 bg-black/30 backdrop-blur-md">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              {result === 'success' ? (
                <>
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-2xl font-black mb-1">CATTURATO!</h3>
                  {dropMessage && <p className="text-yellow-400 text-xs font-bold mb-2">🎁 {dropMessage}</p>}
                  <p className="text-white/60 text-sm mb-4">Domani apparirà un nuovo leggendario!</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">💨</div>
                  <h3 className="text-2xl font-black mb-1">FUGGITO!</h3>
                  <p className="text-white/60 text-sm mb-4">Riprova domani con un altro leggendario.</p>
                </>
              )}
              <button onClick={() => setScreen('HUB_SCREEN')} className="bg-white text-black px-8 py-3 rounded-2xl font-black">
                TORNA ALL'HUB
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {[{id:'pokeball',sprite:'poke-ball'},{id:'megaball',sprite:'great-ball'},{id:'ultraball',sprite:'ultra-ball'},{id:'masterball',sprite:'master-ball'}].map(ball => {
                  const qty = inventory[ball.id] || 0;
                  return (
                    <button key={ball.id} onClick={() => qty > 0 && setBallType(ball.id)} disabled={qty === 0}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${ballType === ball.id ? 'border-[#e63946] bg-[#e63946]/20' : qty === 0 ? 'border-white/5 opacity-30 cursor-not-allowed' : 'border-white/10'}`}>
                      <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${ball.sprite}.png`} className="w-10 h-10 object-contain" />
                      <span className="text-[10px] font-black">x{qty}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-center gap-2">
                {Array.from({ length: maxAttempts }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < attempts ? 'bg-red-500' : 'bg-white/30'}`} />
                ))}
              </div>
              <p className="text-center text-xs text-white/50">
                {attempts < maxAttempts ? `Tentativi rimasti: ${maxAttempts - attempts}` : 'Nessun tentativo rimasto!'}
              </p>
              <button disabled={catching || attempts >= maxAttempts} onClick={handleCatch}
                className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform disabled:opacity-50">
                {catching ? 'LANCIO...' : 'LANCIA POKÉBALL'}
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}