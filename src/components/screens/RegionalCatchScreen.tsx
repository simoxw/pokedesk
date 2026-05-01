import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { CatchEngine } from '../../CatchEngine';
import { BattleEngine } from '../../BattleEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { REGIONAL_FORMS, RegionalRegion } from '../../data/regionalForms';
import { useSoundEffects } from '../../useSoundEffects';

const REGION_COLORS: Record<RegionalRegion, string> = {
  Alola:  'from-yellow-900/60 to-amber-950/80',
  Galar:  'from-purple-900/60 to-indigo-950/80',
  Hisui:  'from-red-900/60 to-rose-950/80',
  Paldea: 'from-orange-900/60 to-red-950/80',
};
const REGION_FLAGS: Record<RegionalRegion, string> = {
  Alola: '🌺', Galar: '⚔️', Hisui: '🏔️', Paldea: '🌀',
};

export default function RegionalCatchScreen() {
  const {
    consumeRegionalCharge, addPokemon, setScreen,
    incrementStat, addItem, inventory, updatePokedex, settings,
  } = useStore();
  const { playSound } = useSoundEffects(settings.audio);

  const [pokemon, setPokemon] = useState<any>(null);
  const [region, setRegion] = useState<RegionalRegion>('Alola');
  const [loading, setLoading] = useState(true);
  const [isShiny, setIsShiny] = useState(false);
  const [ballType, setBallType] = useState('pokeball');
  const [catching, setCatching] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);
  const [circleSize, setCircleSize] = useState(100);
  const [attempts, setAttempts] = useState(0);
  const [ballVisible, setBallVisible] = useState(false);
  const [dropMessage, setDropMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const maxAttempts = 3;

  useEffect(() => {
    if (!inventory[ballType] || inventory[ballType] === 0) {
      const first = ['pokeball', 'megaball', 'ultraball', 'masterball'].find(b => (inventory[b] || 0) > 0);
      if (first) setBallType(first);
    }
  }, [inventory, ballType]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Scegli una forma regionale con pesi per rarità
        const pool: typeof REGIONAL_FORMS = [];
        REGIONAL_FORMS.forEach(f => {
          const weight = f.rarity === 'common' ? 5 : f.rarity === 'uncommon' ? 3 : 1;
          for (let i = 0; i < weight; i++) pool.push(f);
        });
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        setRegion(chosen.region);

        const data = await api.getPokemon(chosen.slug);
        const species = await api.getSpecies(data.id);

        // Livello basato sul tipo di cattura: forme regionali lvl 30-60
        const level = 30 + Math.floor(Math.random() * 31);
        setPokemon({ ...data, species, level });
        setIsShiny(CatchEngine.checkShiny());
        updatePokedex(data.id, 'seen');
        try {
          const cry = new Audio(api.getPokemonCry(data.id));
          cry.volume = 0.5;
          if (settings.audio) cry.play().catch(() => {});
        } catch {}
      } catch (err: any) {
        setApiError('Errore di connessione. Riprova tra qualche secondo.');
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
    // Forme regionali leggermente più difficili da catturare
    const catchModified = { ...pokemon.species, capture_rate: Math.floor((pokemon.species.capture_rate || 45) * 0.75) };
    const success = CatchEngine.calculateCatchRate(catchModified, ballType, bonus, isShiny);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    await new Promise(r => setTimeout(r, 1200));
    setBallVisible(false);
    await new Promise(r => setTimeout(r, 300));

    if (success) {
      setResult('success');
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#c084fc', '#60a5fa', '#34d399'],
      });

      const ivs = CatchEngine.generateIVs();
      const nature = CatchEngine.getNature();
      const baseStats = {
        hp: pokemon.stats[0].base_stat, attack: pokemon.stats[1].base_stat,
        defense: pokemon.stats[2].base_stat, spAtk: pokemon.stats[3].base_stat,
        spDef: pokemon.stats[4].base_stat, speed: pokemon.stats[5].base_stat,
      };
      const stats = BattleEngine.calculateStats(
        pokemon.level, baseStats, ivs,
        { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, nature
      );
      const moves = await api.getPokemonMoves(pokemon, pokemon.level);
      const baseSpeciesId = await api.getBaseSpeciesId(pokemon.species);
      const startExp = (() => {
        const l = pokemon.level;
        switch (pokemon.species.growth_rate.name) {
          case 'slow': return Math.floor(5 * l ** 3 / 4);
          case 'medium-slow': return Math.max(0, Math.floor(6/5 * l**3 - 15*l**2 + 100*l - 140));
          case 'fast': return Math.floor(4 * l ** 3 / 5);
          default: return Math.floor(l ** 3);
        }
      })();

      addPokemon({
        id: Math.random().toString(36).substr(2, 9),
        pokemonId: pokemon.id,
        name: api.getItalianName(pokemon.species.names),
        level: pokemon.level,
        exp: startExp,
        types: pokemon.types.map((t: any) => t.type.name),
        baseStats, ivs,
        evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        stats, nature, moves,
        currentHp: stats.hp, status: null, isShiny,
        caughtAt: Date.now(),
        growthRate: pokemon.species.growth_rate.name,
        baseSpeciesId,
      });

      incrementStat('totalCaught');
      if (isShiny) incrementStat('shiniesFound');
      addItem(`candy_${baseSpeciesId}`, 3);
      addItem('pokeball', 2);
      addItem('potion', 2);
      const drops = ['🔴 2 Pokéball', '🧪 2 Pozioni'];
      if (Math.random() < 0.15) { addItem('rare_candy', 1); drops.push('🍬 1 Caramella Rara'); }
      if (Math.random() < 0.1)  { addItem('ultraball', 1);  drops.push('🟡 1 Ultraball'); }
      setDropMessage(drops.join(' · '));
      updatePokedex(pokemon.id, 'caught');
    } else {
      if (newAttempts >= maxAttempts) {
        setResult('fail');
      } else {
        setCatching(false);
      }
    }
  };

  const bgGradient = REGION_COLORS[region];
  const flag = REGION_FLAGS[region];

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#0f0f1a] text-white/50 animate-pulse font-bold">
      Ricerca forme regionali...
    </div>
  );

  return (
    <div className="h-full relative overflow-hidden flex flex-col">
      {apiError && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-900/90 border border-red-500/50 rounded-2xl p-3 text-center text-sm font-bold text-red-200">
          ⚠️ {apiError}
          <button onClick={() => setApiError(null)} className="ml-3 underline text-xs">Chiudi</button>
        </div>
      )}
      {!result && (
        <button
          onClick={() => setScreen('HUB_SCREEN')}
          className="absolute top-4 left-4 z-30 p-2 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white/70"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {/* Sfondo */}
      <div className={`absolute inset-0 bg-gradient-to-b ${bgGradient}`} />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)' }} />;

      {/* Header regione */}
      <div className="relative z-10 pt-6 pb-2 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-2">
          <span className="text-xl">{flag}</span>
          <span className="text-white font-black text-xs uppercase tracking-widest">
            Forma di {region}
          </span>
        </div>
        <h2 className="text-3xl font-black drop-shadow-lg">
          {api.getItalianName(pokemon.species.names)}
        </h2>
        <p className="font-bold opacity-60 text-sm">Lv. {pokemon.level}</p>
      </div>

      {/* Sprite */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="relative flex items-center justify-center" style={{ height: 280 }}>
          <motion.img
            animate={catching ? { scale: [1, 0.8, 1] } : { y: [0, -12, 0] }}
            transition={catching ? { duration: 0.4 } : { duration: 3, repeat: Infinity }}
            src={
              isShiny
                ? (pokemon.sprites.other?.['official-artwork']?.front_shiny || pokemon.sprites.front_shiny)
                : (pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default)
            }
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
              style={{ width: circleSize * 2, height: circleSize * 2,
                borderColor: circleSize < 40 ? '#4ade80' : circleSize < 70 ? '#facc15' : '#ffffff80' }} />
          )}
          <AnimatePresence>
            {ballVisible && (
              <motion.img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${
                  ballType === 'megaball' ? 'great-ball' : ballType === 'ultraball' ? 'ultra-ball'
                  : ballType === 'masterball' ? 'master-ball' : 'poke-ball'}.png`}
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

      {/* Controls */}
      <div className="relative z-20 p-6 bg-black/30 backdrop-blur-md">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              {result === 'success' ? (
                <>
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-2xl font-black mb-1">CATTURATO!</h3>
                  {dropMessage && <p className="text-yellow-400 text-xs font-bold mb-2">🎁 {dropMessage}</p>}
                  <p className="text-white/60 text-sm mb-4">Forma Regionale aggiunta!</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">💨</div>
                  <h3 className="text-2xl font-black mb-1">FUGGITO!</h3>
                  <p className="text-white/60 text-sm mb-4">La forma regionale è scomparsa...</p>
                </>
              )}
              <button onClick={() => setScreen('HUB_SCREEN')} className="bg-white text-black px-8 py-3 rounded-2xl font-black">
                TORNA ALL'HUB
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {[{id:'pokeball',sprite:'poke-ball'},{id:'megaball',sprite:'great-ball'},
                  {id:'ultraball',sprite:'ultra-ball'},{id:'masterball',sprite:'master-ball'}].map(ball => {
                  const qty = inventory[ball.id] || 0;
                  return (
                    <button key={ball.id} onClick={() => qty > 0 && setBallType(ball.id)} disabled={qty === 0}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                        ${ballType === ball.id ? 'border-[#e63946] bg-[#e63946]/20' : qty === 0 ? 'border-white/5 opacity-30 cursor-not-allowed' : 'border-white/10'}`}>
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