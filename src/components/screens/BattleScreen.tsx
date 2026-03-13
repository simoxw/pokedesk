import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { BattleEngine } from '../../BattleEngine';
import { CatchEngine } from '../../CatchEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Backpack, ArrowLeftRight, Shield, ArrowLeft } from 'lucide-react';
import HPBar from '../ui/HPBar';
import TypeBadge from '../ui/TypeBadge';

export default function BattleScreen() {
  const { team, setScreen, incrementStat, addCoins, updatePokemon } = useStore();
  const [activeIdx, setActiveIdx] = useState(0);
  const [enemy, setEnemy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [logs, setLogs] = useState<string[]>(['Inizia la battaglia!']);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const playerPkmn = team[activeIdx];

  useEffect(() => {
    const initBattle = async () => {
      setLoading(true);
      // Generate random enemy trainer pkmn
      const id = Math.floor(Math.random() * 151) + 1;
      const data = await api.getPokemon(id);
      const species = await api.getSpecies(id);
      
      const level = Math.max(5, playerPkmn.level + Math.floor(Math.random() * 3 - 1));
      const baseStats = {
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        spAtk: data.stats[3].base_stat,
        spDef: data.stats[4].base_stat,
        speed: data.stats[5].base_stat,
      };

      const ivs = CatchEngine.generateIVs();
      const stats = BattleEngine.calculateStats(level, baseStats, ivs, { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, 'Quirky');
      const moves = await api.getPokemonMoves(data, level);

      setEnemy({
        ...data,
        name: api.getItalianName(species.names),
        level,
        currentHp: stats.hp,
        maxHp: stats.hp,
        stats,
        moves,
        types: data.types.map((t: any) => t.type.name),
      });
      setLoading(false);
    };
    initBattle();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const handleMove = async (move: any) => {
    if (turn !== 'player' || isFinished || isAnimating) return;
    setIsAnimating(true);

    // Player Turn
    const isCrit = Math.random() < 0.06;
    const damage = BattleEngine.calculateDamage(playerPkmn, enemy, move, isCrit);
    const newEnemyHp = Math.max(0, enemy.currentHp - damage);
    
    addLog(`${playerPkmn.name} usa ${move.name}!`);
    if (isCrit) addLog("Brutto colpo!");
    
    setEnemy({ ...enemy, currentHp: newEnemyHp });
    await new Promise(r => setTimeout(r, 1000));

    if (newEnemyHp === 0) {
      addLog(`${enemy.name} è esausto!`);
      setIsFinished(true);
      const exp = BattleEngine.calculateExp(100, enemy.level);
      addLog(`${playerPkmn.name} guadagna ${exp} Punti ESP!`);
      addCoins(50);
      incrementStat('totalBattles');
      setIsAnimating(false);
      return;
    }

    setTurn('enemy');
    await new Promise(r => setTimeout(r, 1000));

    // Enemy Turn
    const enemyMove = enemy.moves[Math.floor(Math.random() * enemy.moves.length)] || { name: 'Azione', type: 'normal', power: 40, category: 'physical' };
    addLog(`${enemy.name} usa ${enemyMove.name}!`);
    
    const enemyDamage = BattleEngine.calculateDamage(enemy, playerPkmn, enemyMove, false);
    const newPlayerHp = Math.max(0, playerPkmn.currentHp - enemyDamage);
    
    updatePokemon(playerPkmn.id, { currentHp: newPlayerHp });
    await new Promise(r => setTimeout(r, 1000));

    if (newPlayerHp === 0) {
      addLog(`${playerPkmn.name} è esausto!`);
      const nextAvailable = team.findIndex((p, i) => p.currentHp > 0 && i !== activeIdx);
      if (nextAvailable === -1) {
        addLog('Hai perso la sfida...');
        setIsFinished(true);
      } else {
        setActiveIdx(nextAvailable);
        addLog(`Vai ${team[nextAvailable].name}!`);
      }
    }
    
    setTurn('player');
    setIsAnimating(false);
  };

  if (loading || !enemy) return <div className="h-full flex items-center justify-center bg-[#0f0f1a]">Inizializzazione lotta...</div>;

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a]">
      {/* Battle Scene */}
      <div className="relative h-2/3 overflow-hidden bg-gradient-to-b from-sky-900 to-sky-600">
        {/* Background Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-green-800/40 skew-y-2 origin-bottom-left" />
        
        {/* Enemy Info */}
        <div className="absolute top-8 right-4 z-10 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 w-48 shadow-2xl">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-sm uppercase truncate">{enemy.name}</span>
            <span className="text-xs font-bold">Lv.{enemy.level}</span>
          </div>
          <HPBar current={enemy.currentHp} max={enemy.maxHp} />
          <div className="text-[10px] text-right mt-1 opacity-50 font-bold">{enemy.currentHp} / {enemy.maxHp}</div>
        </div>

        {/* Enemy Sprite */}
        <motion.img
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1, y: [0, -5, 0] }}
          transition={{ duration: 0.5, y: { duration: 2, repeat: Infinity } }}
          src={enemy.sprites.front_default}
          className="absolute top-16 right-12 w-44 h-44 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        />

        {/* Player Info */}
        <div className="absolute bottom-16 left-4 z-10 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 w-48 shadow-2xl">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-sm uppercase truncate">{playerPkmn.name}</span>
            <span className="text-xs font-bold">Lv.{playerPkmn.level}</span>
          </div>
          <HPBar current={playerPkmn.currentHp} max={playerPkmn.stats.hp} />
          <div className="text-[10px] text-right mt-1 opacity-50 font-bold">
            {playerPkmn.currentHp} / {playerPkmn.stats.hp}
          </div>
        </div>

        {/* Player Sprite */}
        <motion.img
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerPkmn.pokemonId}.png`}
          className="absolute bottom-4 left-8 w-56 h-56 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Controls */}
      <div className="flex-1 bg-[#1a1a2e] p-4 flex flex-col gap-4 border-t-4 border-[#e63946]">
        {isFinished ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="bg-black/20 p-4 rounded-2xl text-center w-full mb-4">
              <p className="text-lg font-bold italic opacity-70">"{logs[0]}"</p>
            </div>
            <button 
              onClick={() => setScreen('HUB_SCREEN')}
              className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
            >
              CONTINUA
            </button>
          </div>
        ) : (
          <>
            <div className="bg-black/40 rounded-xl p-3 h-16 flex items-center mb-2">
              <p className="text-sm font-bold leading-tight italic">{logs[0]}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {playerPkmn.moves.map((move, i) => (
                <button
                  key={i}
                  disabled={turn !== 'player' || isAnimating}
                  onClick={() => handleMove(move)}
                  className="bg-[#252545] border border-white/5 rounded-xl p-3 flex flex-col items-start justify-between active:bg-[#e63946]/20 disabled:opacity-50 transition-colors"
                >
                  <div className="flex justify-between w-full items-center">
                    <span className="font-black text-xs uppercase truncate">{move.name}</span>
                    <TypeBadge type={move.type} small />
                  </div>
                  <div className="flex justify-between w-full items-center mt-2">
                    <span className="text-[10px] opacity-50 uppercase font-bold">{move.category}</span>
                    <span className="text-[10px] font-bold">PP {move.pp}/{move.maxPp}</span>
                  </div>
                </button>
              ))}
              {Array.from({ length: 4 - playerPkmn.moves.length }).map((_, i) => (
                <div key={i} className="bg-[#252545]/30 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-[10px] opacity-20 italic">
                  Slot Vuoto
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button 
                disabled={isAnimating}
                onClick={() => setScreen('HUB_SCREEN')}
                className="flex-1 bg-red-600/20 border border-red-500/30 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-red-400"
              >
                <ArrowLeft size={14} /> Fuga
              </button>
              <button 
                disabled={isAnimating}
                className="flex-1 bg-indigo-600/20 border border-indigo-500/30 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider"
              >
                <ArrowLeftRight size={14} /> Squadra
              </button>
              <button 
                disabled={isAnimating}
                className="flex-1 bg-emerald-600/20 border border-emerald-500/30 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider"
              >
                <Backpack size={14} /> Zaino
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
