import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { CatchEngine } from '../../CatchEngine';
import { BattleEngine } from '../../BattleEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Sparkles } from 'lucide-react';
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
    setCatching(true);
    consumeCharge();

    // Bonus based on circle size
    let bonus = 1.0;
    if (circleSize < 40) bonus = 2.0;
    else if (circleSize < 70) bonus = 1.5;

    const success = CatchEngine.calculateCatchRate(pokemon.species, ballType, bonus, isShiny);
    
    await new Promise(r => setTimeout(r, 2000)); // Ball animation time

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
      setResult('fail');
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

        <div className="relative">
          <motion.img
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            src={isShiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default}
            className="w-64 h-64 object-contain drop-shadow-2xl"
          />
          {isShiny && (
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 flex items-center justify-center text-yellow-300"
            >
              <Sparkles size={120} />
            </motion.div>
          )}
          
          {/* Catch Circle */}
          {!catching && !result && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/50 rounded-full pointer-events-none"
              style={{ width: circleSize * 2, height: circleSize * 2 }}
            />
          )}
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
              <h3 className="text-2xl font-bold mb-4">
                {result === 'success' ? 'CATTURATO!' : 'FUGGITO...'}
              </h3>
              <button 
                onClick={() => setScreen('HUB_SCREEN')}
                className="bg-white text-black px-8 py-3 rounded-full font-bold"
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
                    <img src={`/balls/${ball}.png`} alt={ball} className="w-12 h-12" onError={(e) => (e.currentTarget.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png')} />
                  </button>
                ))}
              </div>
              <button
                disabled={catching}
                onClick={handleCatch}
                className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
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
