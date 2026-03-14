import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { CatchEngine } from '../../CatchEngine';
import { BattleEngine } from '../../BattleEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CatchScreen() {
  const { consumeCharge, addPokemon, setScreen, medals, team, incrementStat } = useStore();
  const [pokemon, setPokemon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isShiny, setIsShiny] = useState(false);
  const [ballType, setBallType] = useState('pokeball');
  const [catching, setCatching] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);
  const [circleSize, setCircleSize] = useState(100);
  const [attempts, setAttempts] = useState(0);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);
  const [ballVisible, setBallVisible] = useState(false);
  const maxAttempts = 3;

  useEffect(() => {
    const initEncounter = async () => {
      setLoading(true);
      const avgLevel = team.length > 0 ? team.reduce((acc, p) => acc + p.level, 0) / team.length : 5;
      const level = Math.max(5, Math.floor(avgLevel + (Math.random() * 10 - 5)));
      
      // Random pokemon based on medals (simplified pool)
      const id = Math.floor(Math.random() * 151) + 1; // Gen 1 for now
      const data = await api.getPokemon(id);
      const species = await api.getSpecies(id);
      
      setPokemon({ ...data, species, level });
      setIsShiny(CatchEngine.checkShiny());
      setLoading(false);
    };
    initEncounter();
  }, []);

  useEffect(() => {
    if (catching || result) return;
    const interval = setInterval(() => {
      setCircleSize(prev => (prev <= 20 ? 100 : prev - 2));
    }, 30);
    return () => clearInterval(interval);
  }, [catching, result]);

  const handleCatch = async () => {
    if (catching || result) return;
    if (attempts >= maxAttempts) return;
    setCatching(true);

    // Animazione palla: parte dal basso al centro 
    setBallVisible(true);
    setBallPos({ x: 0, y: 0 });

    // Bonus based on circle size
    let bonus = 1.0;
    if (circleSize < 40) bonus = 2.0;
    else if (circleSize < 70) bonus = 1.5;

    const success = CatchEngine.calculateCatchRate(pokemon.species, ballType, bonus, isShiny);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    await new Promise(r => setTimeout(r, 1200)); // animazione volo palla 
    setBallVisible(false);
    await new Promise(r => setTimeout(r, 300));

    if (success) {
      setResult('success');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      const ivs = CatchEngine.generateIVs();
      const nature = CatchEngine.getNature();
      const baseStats = {
        hp: pokemon.stats[0].base_stat,
        attack: pokemon.stats[1].base_stat,
        defense: pokemon.stats[2].base_stat,
        spAtk: pokemon.stats[3].base_stat,
        spDef: pokemon.stats[4].base_stat,
        speed: pokemon.stats[5].base_stat,
      };

      const stats = BattleEngine.calculateStats(pokemon.level, baseStats, ivs, { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, nature);
      const moves = await api.getPokemonMoves(pokemon, pokemon.level);

      addPokemon({
        id: Math.random().toString(36).substr(2, 9),
        pokemonId: pokemon.id,
        name: api.getItalianName(pokemon.species.names),
        level: pokemon.level,
        exp: 0,
        types: pokemon.types.map((t: any) => t.type.name),
        baseStats,
        ivs,
        evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
        stats,
        nature,
        moves,
        currentHp: stats.hp,
        status: null,
        isShiny,
        caughtAt: Date.now(),
        growthRate: pokemon.species.growth_rate.name,
      });
      incrementStat('totalCaught');
      if (isShiny) incrementStat('shiniesFound');
    } else {
      // Fallito: controlla se ha ancora tentativi 
      if (newAttempts >= maxAttempts) {
        setResult('fail'); // Scappato dopo 3 tentativi 
      } else {
        // Può riprovare 
        setCatching(false);
      }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-[#0f0f1a]">Caricamento...</div>;

  return (
    <div className="h-full relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-sky-400">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-green-500" style={{ transform: 'perspective(500px) rotateX(45deg)', transformOrigin: 'bottom' }} />
        <CloudAnimation />
      </div>

      {/* Pokemon */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black drop-shadow-lg">{api.getItalianName(pokemon.species.names)}</h2>
          <p className="font-bold opacity-70">Lv. {pokemon.level}</p>
        </div>

        <div className="relative flex items-center justify-center" style={{ height: 260 }}>
          {/* Pokémon */}
          <motion.img
            animate={catching ? { scale: [1, 0.8, 1] } : { y: [0, -10, 0] }}
            transition={catching ? { duration: 0.4 } : { duration: 3, repeat: Infinity }}
            src={isShiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default}
            className="w-52 h-52 object-contain drop-shadow-2xl"
          />
          {isShiny && !catching && (
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 flex items-center justify-center text-yellow-300 pointer-events-none"
            >
              <Sparkles size={100} />
            </motion.div>
          )}

          {/* Cerchio di mira */}
          {!catching && !result && (
            <div
              className="absolute border-2 border-white/50 rounded-full pointer-events-none transition-all"
              style={{
                width: circleSize * 2,
                height: circleSize * 2,
                borderColor: circleSize < 40 ? '#4ade80' : circleSize < 70 ? '#facc15' : '#ffffff80'
              }}
            />
          )}

          {/* Animazione pokéball che vola */}
          <AnimatePresence>
            {ballVisible && (
              <motion.img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${
                  ballType === 'megaball' ? 'great-ball' :
                  ballType === 'ultraball' ? 'ultra-ball' :
                  ballType === 'masterball' ? 'master-ball' : 'poke-ball'
                }.png`}
                initial={{ y: 160, x: 0, scale: 0.8, opacity: 1 }}
                animate={{ y: -20, x: [0, -15, 15, 0], scale: [0.8, 1.2, 1], rotate: [0, 360, 720] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                className="absolute w-14 h-14 object-contain drop-shadow-xl pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-20 p-6 bg-black/20 backdrop-blur-md">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              {result === 'success' ? (
                <>
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-2xl font-black mb-1">CATTURATO!</h3>
                  <p className="text-white/60 text-sm mb-4">{pokemon && (pokemon.species?.names ? api.getItalianName(pokemon.species.names) : pokemon.name)} aggiunto alla squadra!</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">💨</div>
                  <h3 className="text-2xl font-black mb-1">FUGGITO!</h3>
                  <p className="text-white/60 text-sm mb-4">Il Pokémon selvaggio è scappato dopo {maxAttempts} tentativi.</p>
                </>
              )}
              <button
                onClick={() => setScreen('HUB_SCREEN')}
                className="bg-white text-black px-8 py-3 rounded-2xl font-black"
              >
                TORNA ALL'HUB
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {['pokeball', 'megaball', 'ultraball'].map(ball => (
                  <button
                    key={ball}
                    onClick={() => setBallType(ball)}
                    className={`flex-shrink-0 p-2 rounded-xl border-2 transition-all ${ballType === ball ? 'border-[#e63946] bg-[#e63946]/20' : 'border-white/10'}`}
                  >
                    <img src={`/balls/${ball}.png`} alt={ball} className="w-12 h-12" onError={(e) => (e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${ball === 'megaball' ? 'great-ball' : ball === 'ultraball' ? 'ultra-ball' : ball === 'masterball' ? 'master-ball' : 'poke-ball'}.png`)} />
                  </button>
                ))}
              </div>

              {/* Indicatore tentativi */}
              <div className="flex justify-center gap-2 mb-2">
                {Array.from({ length: maxAttempts }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i < attempts ? 'bg-red-500' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-white/50 mb-3">
                {attempts < maxAttempts
                  ? `Tentativi rimasti: ${maxAttempts - attempts}`
                  : 'Nessun tentativo rimasto!'}
              </p>

              <button
                disabled={catching || attempts >= maxAttempts}
                onClick={handleCatch}
                className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform disabled:opacity-50"
              >
                {catching ? 'LANCIO...' : 'LANCIA POKÉBALL'}
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CloudAnimation() {
  return (
    <div className="absolute top-10 left-0 right-0 h-32 pointer-events-none">
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          initial={{ x: -200 }}
          animate={{ x: '100vw' }}
          transition={{ duration: 20 + i * 5, repeat: Infinity, ease: 'linear', delay: i * 4 }}
          className="absolute bg-white/40 rounded-full blur-xl"
          style={{ 
            width: 100 + i * 50, 
            height: 40 + i * 20, 
            top: i * 30,
            left: -200
          }}
        />
      ))}
    </div>
  );
}
