import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { BattleEngine } from '../../BattleEngine';
import { CatchEngine } from '../../CatchEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Backpack, ArrowLeftRight, Shield, ArrowLeft, X, Heart } from 'lucide-react';
import HPBar from '../ui/HPBar';
import TypeBadge from '../ui/TypeBadge';

export default function BattleScreen() {
  const { team, setScreen, incrementStat, addCoins, updatePokemon, inventory, useItem } = useStore();
  const [activeIdx, setActiveIdx] = useState(0);
  const [enemy, setEnemy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [logs, setLogs] = useState<string[]>(['Inizia la battaglia!']);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTeamOverlay, setShowTeamOverlay] = useState(false);
  const [showBagOverlay, setShowBagOverlay] = useState(false);
  const [attackAnim, setAttackAnim] = useState(false);

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

  const handleSwitchPokemon = (idx: number) => {
    if (idx === activeIdx || !team[idx] || team[idx].currentHp <= 0) return;
    setActiveIdx(idx);
    addLog(`Vai ${team[idx].name}!`);
    setShowTeamOverlay(false);
    setTurn('enemy');
  };

  const handleUseItem = (itemId: string, itemName: string) => {
    const pkm = team[activeIdx];
    if (!pkm) return;
    let healed = 0;
    if (itemId === 'potion') healed = 20;
    if (itemId === 'superpotion') healed = 50;
    if (itemId === 'hyperpotion') healed = 200;
    const newHp = Math.min(pkm.stats.hp, pkm.currentHp + healed);
    updatePokemon(pkm.id, { currentHp: newHp });
    useItem(itemId);
    addLog(`Hai usato ${itemName} su ${pkm.name}!`);
    setShowBagOverlay(false);
    setTurn('enemy');
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const handleMove = async (move: any) => {
    if (turn !== 'player' || isFinished || isAnimating) return;
    setIsAnimating(true);
    setAttackAnim(true);
    setTimeout(() => setAttackAnim(false), 400);

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

  if (loading || !enemy) return (
    <div className="h-full flex items-center justify-center bg-[#0f0f1a]">
      <div className="text-white/50 animate-pulse font-bold">Caricamento battaglia...</div>
    </div>
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[#1a1a2e]">

      {/* ARENA */}
      <div className="flex-1 relative bg-gradient-to-b from-[#1a3a5c] to-[#2d5a3d] overflow-hidden">

        {/* Enemy Pokemon */}
        <div className="absolute top-6 right-6 left-6">
          <div className="bg-black/40 backdrop-blur rounded-2xl p-3 mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase">{enemy?.name}</span>
                <div className="flex gap-1">
                  {enemy?.types?.map((t: string) => (
                    <TypeBadge key={t} type={t} small />
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-white/50 font-bold mt-0.5">Lv. {enemy?.level}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${((enemy?.currentHp ?? 0) / (enemy?.maxHp ?? 1)) * 100}%`,
                      backgroundColor: (enemy?.currentHp / enemy?.maxHp) > 0.5 ? '#4ade80' : (enemy?.currentHp / enemy?.maxHp) > 0.2 ? '#facc15' : '#ef4444'
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-white/70">{enemy?.currentHp}/{enemy?.maxHp}</span>
              </div>
            </div>
          </div>

          <motion.img
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            src={enemy?.sprites?.front_default}
            className="w-32 h-32 object-contain mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Player Pokemon */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          <motion.img
            animate={attackAnim ? { x: [0, 15, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerPkmn?.isShiny ? 'shiny/' : ''}${playerPkmn?.pokemonId}.png`}
            className="w-28 h-28 object-contain drop-shadow-2xl"
          />
          <div className="flex-1 bg-black/40 backdrop-blur rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm uppercase">{playerPkmn?.name}</span>
              <span className="text-[10px] bg-[#e63946] px-2 py-0.5 rounded-full font-bold">Lv.{playerPkmn?.level}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${((playerPkmn?.currentHp ?? 0) / (playerPkmn?.stats?.hp ?? 1)) * 100}%`,
                    backgroundColor: (playerPkmn?.currentHp / playerPkmn?.stats?.hp) > 0.5 ? '#4ade80' : (playerPkmn?.currentHp / playerPkmn?.stats?.hp) > 0.2 ? '#facc15' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-white/70">{playerPkmn?.currentHp}/{playerPkmn?.stats?.hp} HP</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOG + CONTROLLI */}
      <div className="bg-[#0f0f1a] border-t border-white/5 p-4 space-y-3">

        {/* Log */}
        <div className="bg-[#1a1a2e] rounded-xl px-4 py-2 min-h-[36px] flex items-center">
          <p className="text-sm font-bold text-white/80">{logs[0]}</p>
        </div>

        {isFinished ? (
          <button
            onClick={() => setScreen('HUB_SCREEN')}
            className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-lg"
          >
            TORNA ALL'HUB
          </button>
        ) : (
          <>
            {/* Mosse */}
            <div className="grid grid-cols-2 gap-2">
              {playerPkmn?.moves?.map((move: any) => (
                <button
                  key={move.id}
                  onClick={() => handleMove(move)}
                  disabled={turn !== 'player' || isAnimating || move.pp <= 0}
                  className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 flex flex-col items-start justify-between active:bg-[#e63946]/20 disabled:opacity-40 transition-colors"
                >
                  <div className="flex justify-between w-full items-center">
                    <span className="font-black text-xs uppercase truncate">{move.name}</span>
                    <TypeBadge type={move.type} small />
                  </div>
                  <div className="flex justify-between w-full items-center mt-1">
                    <span className="text-[10px] opacity-50 uppercase font-bold">{move.category}</span>
                    <span className="text-[10px] font-bold">PP {move.pp}/{move.maxPp}</span>
                  </div>
                </button>
              ))}
              {Array.from({ length: 4 - (playerPkmn?.moves?.length ?? 0) }).map((_, i) => (
                <div key={i} className="bg-[#1a1a2e]/30 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-[10px] opacity-20 italic h-16">
                  Slot Vuoto
                </div>
              ))}
            </div>

            {/* Bottoni azione */}
            <div className="flex gap-2">
              <button
                disabled={isAnimating}
                onClick={() => setScreen('HUB_SCREEN')}
                className="flex-1 bg-red-600/20 border border-red-500/30 py-3 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black uppercase text-red-400"
              >
                <ArrowLeft size={14} /> Fuga
              </button>
              <button
                disabled={isAnimating}
                onClick={() => setShowTeamOverlay(true)}
                className="flex-1 bg-indigo-600/20 border border-indigo-500/30 py-3 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black uppercase"
              >
                <ArrowLeftRight size={14} /> Squadra
              </button>
              <button
                disabled={isAnimating}
                onClick={() => setShowBagOverlay(true)}
                className="flex-1 bg-emerald-600/20 border border-emerald-500/30 py-3 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black uppercase"
              >
                <Backpack size={14} /> Zaino
              </button>
            </div>
          </>
        )}
      </div>

      {/* OVERLAY SQUADRA */}
      <AnimatePresence>
        {showTeamOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#1a1a2e] rounded-t-3xl p-6 space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-lg">CAMBIA POKÉMON</h3>
                <button onClick={() => setShowTeamOverlay(false)} className="p-2 bg-white/10 rounded-xl">
                  <X size={18} />
                </button>
              </div>
              {team.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => handleSwitchPokemon(idx)}
                  disabled={idx === activeIdx || p.currentHp <= 0}
                  className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all disabled:opacity-40 ${
                    idx === activeIdx ? 'border-[#e63946] bg-[#e63946]/10' : 'border-white/10 bg-white/5 active:bg-white/10'
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
                  </div>
                  {idx === activeIdx && <span className="text-[10px] text-[#e63946] font-bold">IN CAMPO</span>}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY ZAINO */}
      <AnimatePresence>
        {showBagOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#1a1a2e] rounded-t-3xl p-6 space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-lg">ZAINO</h3>
                <button onClick={() => setShowBagOverlay(false)} className="p-2 bg-white/10 rounded-xl">
                  <X size={18} />
                </button>
              </div>
              {[
                { id: 'potion', name: 'Pozione', heal: 20, icon: '🧪' },
                { id: 'superpotion', name: 'Superpozione', heal: 50, icon: '🧪' },
                { id: 'hyperpotion', name: 'Iperpozione', heal: 200, icon: '💊' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleUseItem(item.id, item.name)}
                  disabled={!inventory[item.id] || inventory[item.id] <= 0}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl border border-white/10 bg-white/5 active:bg-white/10 disabled:opacity-30 transition-all"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-black text-sm">{item.name}</div>
                    <div className="text-[10px] text-white/50">Ripristina {item.heal} HP</div>
                  </div>
                  <span className="text-sm font-bold text-white/60">x{inventory[item.id] ?? 0}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
