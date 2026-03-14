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
  const [statChanges, setStatChanges] = useState<{ label: string; positive: boolean } | null>(null);

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

  const executeEnemyTurn = async (currentPlayerPkmn: any) => {
    if (!enemy || enemy.currentHp <= 0) return;
    await new Promise(r => setTimeout(r, 800));

    const validMoves = enemy.moves.filter((m: any) => m.pp > 0 && m.category !== 'status');
    const enemyMove = validMoves.length > 0 
      ? validMoves[Math.floor(Math.random() * validMoves.length)] 
      : { name: 'Lotta', type: 'normal', power: 40, category: 'physical', pp: 1, maxPp: 1, id: '0', accuracy: 100, priority: 0, description: '' };

    // PAR: 25% skip 
    if (currentPlayerPkmn.status === 'PAR' && Math.random() < 0.25) {
      addLog(`${currentPlayerPkmn.name} è paralizzato e non riesce a muoversi!`);
      setTurn('player');
      setIsAnimating(false);
      return;
    }
    // SLP: skip 
    if (currentPlayerPkmn.status === 'SLP') {
      addLog(`${currentPlayerPkmn.name} sta dormendo...`);
      setTurn('player');
      setIsAnimating(false);
      return;
    }
    // FRZ: 20% unfreeze else skip 
    if (currentPlayerPkmn.status === 'FRZ') {
      if (Math.random() < 0.2) {
        updatePokemon(currentPlayerPkmn.id, { status: null });
        addLog(`${currentPlayerPkmn.name} si è scongelato!`);
      } else {
        addLog(`${currentPlayerPkmn.name} è congelato!`);
        setTurn('player');
        setIsAnimating(false);
        return;
      }
    }

    addLog(`${enemy.name} usa ${enemyMove.name}!`);
    const enemyDamage = BattleEngine.calculateDamage(enemy, currentPlayerPkmn, enemyMove, false);
    const typeMultiplier = BattleEngine.getTypeEffectiveness(enemyMove.type, currentPlayerPkmn.types);
    const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
    if (effLabel) addLog(effLabel);

    // Applica effetto di stato nemico 
    if (enemyMove.statusEffect && !currentPlayerPkmn.status && Math.random() * 100 < (enemyMove.effectChance || 0)) {
      updatePokemon(currentPlayerPkmn.id, { status: enemyMove.statusEffect });
      addLog(`${currentPlayerPkmn.name} è ora ${enemyMove.statusEffect}!`);
    }

    const newPlayerHp = Math.max(0, currentPlayerPkmn.currentHp - enemyDamage);
    updatePokemon(currentPlayerPkmn.id, { currentHp: newPlayerHp });

    // BRN danno fine turno 
    if (currentPlayerPkmn.status === 'BRN') {
      const brnDmg = Math.floor(currentPlayerPkmn.stats.hp / 8);
      const brnHp = Math.max(0, newPlayerHp - brnDmg);
      updatePokemon(currentPlayerPkmn.id, { currentHp: brnHp });
      addLog(`${currentPlayerPkmn.name} è danneggiato dalla scottatura!`);
    }
    // PSN danno fine turno 
    if (currentPlayerPkmn.status === 'PSN') {
      const psnDmg = Math.floor(currentPlayerPkmn.stats.hp / 8);
      const psnHp = Math.max(0, newPlayerHp - psnDmg);
      updatePokemon(currentPlayerPkmn.id, { currentHp: psnHp });
      addLog(`${currentPlayerPkmn.name} è danneggiato dal veleno!`);
    }

    await new Promise(r => setTimeout(r, 800));

    if (newPlayerHp <= 0) {
      addLog(`${currentPlayerPkmn.name} è esausto!`);
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

  const handleSwitchPokemon = async (idx: number) => {
    if (idx === activeIdx || !team[idx] || team[idx].currentHp <= 0) return;
    setShowTeamOverlay(false);
    setIsAnimating(true);
    addLog(`Vai ${team[idx].name}!`);
    setActiveIdx(idx);
    // Dopo il cambio il nemico attacca 
    await new Promise(r => setTimeout(r, 600));
    await executeEnemyTurn(team[idx]);
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
    if (turn !== 'player' || isFinished || isAnimating || move.pp <= 0) return;
    setIsAnimating(true);
    setAttackAnim(true);
    setTimeout(() => setAttackAnim(false), 400);

    // Scala i PP della mossa nel team 
    const updatedMoves = playerPkmn.moves.map((m: any) =>
      m.id === move.id ? { ...m, pp: Math.max(0, m.pp - 1) } : m
    );
    updatePokemon(playerPkmn.id, { moves: updatedMoves });

    // Player Turn — order by speed 
    const playerFirst = playerPkmn.stats.speed >= (enemy?.stats?.speed ?? 0) || move.priority > 0;

    if (playerFirst) {
      const isCrit = Math.random() < 0.06;
      const damage = BattleEngine.calculateDamage(playerPkmn, enemy, move, isCrit);
      const typeMultiplier = BattleEngine.getTypeEffectiveness(move.type, enemy.types);
      const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
      const newEnemyHp = Math.max(0, enemy.currentHp - damage);

      addLog(`${playerPkmn.name} usa ${move.name}!`);
      if (move.category === 'status') {
        // Mosse di boost/debuff 
        if (['swordsdance', 'growl', 'tailwhip', 'leer', 'screech', 'agility', 'amnesia'].includes(move.id)) {
          const isBoost = ['swordsdance', 'agility', 'amnesia'].includes(move.id);
          setStatChanges({ label: isBoost ? '↑ STAT +' : '↓ STAT −', positive: isBoost });
          setTimeout(() => setStatChanges(null), 2500);
        }
        // Applica effetti di stato al nemico 
        if (move.statusEffect && enemy) {
          setEnemy((prev: any) => ({ ...prev, status: move.statusEffect }));
          addLog(`${enemy.name} è ora ${move.statusEffect}!`);
        }
      }
      if (isCrit) addLog('Brutto colpo!');
      if (effLabel) addLog(effLabel);

      // Applica stato al nemico 
      if (move.statusEffect && !enemy.status && Math.random() * 100 < (move.effectChance || 0)) {
        setEnemy((prev: any) => ({ ...prev, status: move.statusEffect }));
        addLog(`${enemy.name} è ora ${move.statusEffect}!`);
      }

      setEnemy((prev: any) => ({ ...prev, currentHp: newEnemyHp }));
      await new Promise(r => setTimeout(r, 800));

      if (newEnemyHp <= 0) {
        addLog(`${enemy.name} è esausto!`);
        const exp = BattleEngine.calculateExp(100, enemy.level);
        addLog(`${playerPkmn.name} guadagna ${exp} ESP!`);
        addCoins(50);
        incrementStat('totalBattles');
        team.forEach(p => {
          const recoveredHp = Math.min(p.stats.hp, p.currentHp + Math.floor(p.stats.hp * 0.3));
          const recoveredMoves = p.moves.map((m: any) => ({ ...m, pp: m.maxPp }));
          updatePokemon(p.id, { currentHp: recoveredHp, moves: recoveredMoves });
        });
        setIsFinished(true);
        setIsAnimating(false);
        return;
      }

      setTurn('enemy');
      await executeEnemyTurn(playerPkmn);
    } else {
      // Nemico più veloce: attacca prima 
      setTurn('enemy');
      await executeEnemyTurn(playerPkmn);
      if (playerPkmn.currentHp <= 0) {
        setIsAnimating(false);
        return;
      }

      const isCrit = Math.random() < 0.06;
      const damage = BattleEngine.calculateDamage(playerPkmn, enemy, move, isCrit);
      const typeMultiplier = BattleEngine.getTypeEffectiveness(move.type, enemy.types);
      const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
      const newEnemyHp = Math.max(0, enemy.currentHp - damage);

      addLog(`${playerPkmn.name} usa ${move.name}!`);
      if (isCrit) addLog('Brutto colpo!');
      if (effLabel) addLog(effLabel);

      setEnemy((prev: any) => ({ ...prev, currentHp: newEnemyHp }));
      await new Promise(r => setTimeout(r, 800));

      if (newEnemyHp <= 0) {
        addLog(`${enemy.name} è esausto!`);
        addCoins(50);
        incrementStat('totalBattles');
        team.forEach(p => {
          const recoveredHp = Math.min(p.stats.hp, p.currentHp + Math.floor(p.stats.hp * 0.3));
          const recoveredMoves = p.moves.map((m: any) => ({ ...m, pp: m.maxPp }));
          updatePokemon(p.id, { currentHp: recoveredHp, moves: recoveredMoves });
        });
        setIsFinished(true);
        setIsAnimating(false);
        return;
      }
    }

    // BRN danno fine turno giocatore 
    if (playerPkmn.status === 'BRN') {
      const brnDmg = Math.floor(playerPkmn.stats.hp / 8);
      updatePokemon(playerPkmn.id, { currentHp: Math.max(0, playerPkmn.currentHp - brnDmg) });
      addLog(`${playerPkmn.name} è danneggiato dalla scottatura!`);
    }
    if (playerPkmn.status === 'PSN') {
      const psnDmg = Math.floor(playerPkmn.stats.hp / 8);
      updatePokemon(playerPkmn.id, { currentHp: Math.max(0, playerPkmn.currentHp - psnDmg) });
      addLog(`${playerPkmn.name} è avvelenato!`);
    }

    // PAR: 25% skip turno 
    if (playerPkmn.status === 'PAR' && Math.random() < 0.25) {
      addLog(`${playerPkmn.name} è paralizzato!`);
      setIsAnimating(false);
      setTurn('player');
      return;
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
          <div className="bg-black/40 backdrop-blur rounded-2xl p-3 mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase">{enemy?.name}</span>
                <div className="flex gap-1">
                  {enemy?.types?.map((t: string) => (
                    <TypeBadge key={t} type={t} small />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {enemy?.status && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    enemy.status === 'PSN' ? 'bg-purple-500' :
                    enemy.status === 'BRN' ? 'bg-orange-500' :
                    enemy.status === 'PAR' ? 'bg-yellow-400 text-black' :
                    enemy.status === 'SLP' ? 'bg-blue-400' :
                    enemy.status === 'FRZ' ? 'bg-cyan-300 text-black' : ''
                  }`}>{enemy.status}</span>
                )}
                <span className="text-[10px] text-white/50 font-bold">Lv. {enemy?.level}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${((enemy?.currentHp ?? 0) / (enemy?.maxHp ?? 1)) * 100}%`,
                    backgroundColor: (enemy?.currentHp / enemy?.maxHp) > 0.5 ? '#4ade80' : (enemy?.currentHp / enemy?.maxHp) > 0.2 ? '#facc15' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-white/70 w-16 text-right">{enemy?.currentHp}/{enemy?.maxHp}</span>
            </div>
          </div>

          <motion.img
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            src={enemy?.sprites?.front_default}
            className="w-44 h-44 object-contain mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Player Pokemon */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          <motion.img
            animate={attackAnim ? { x: [0, 15, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerPkmn?.isShiny ? 'shiny/' : ''}${playerPkmn?.pokemonId}.png`}
            className="w-36 h-36 object-contain drop-shadow-2xl"
          />
          <div className="flex-1 bg-black/40 backdrop-blur rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-sm uppercase">{playerPkmn?.name}</span>
                {playerPkmn?.types?.map((t: string) => (
                  <TypeBadge key={t} type={t} small />
                ))}
                {playerPkmn?.status && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    playerPkmn.status === 'PSN' ? 'bg-purple-500' :
                    playerPkmn.status === 'BRN' ? 'bg-orange-500' :
                    playerPkmn.status === 'PAR' ? 'bg-yellow-400 text-black' :
                    playerPkmn.status === 'SLP' ? 'bg-blue-400' :
                    playerPkmn.status === 'FRZ' ? 'bg-cyan-300 text-black' : 'bg-white/20'
                  }`}>{playerPkmn.status}</span>
                )}
              </div>
              <span className="text-[10px] bg-[#e63946] px-2 py-0.5 rounded-full font-bold">Lv.{playerPkmn?.level}</span>
            </div>
            {statChanges && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-[10px] font-black px-2 py-0.5 rounded-full w-fit mb-1 ${statChanges.positive ? 'bg-blue-500/30 text-blue-300' : 'bg-red-500/30 text-red-300'}`}
              >
                {statChanges.label}
              </motion.div>
            )}
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
