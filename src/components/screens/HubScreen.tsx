import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Target, Sword, TreePine, X } from 'lucide-react';

export default function HubScreen() {
  const { 
    charges, 
    safariCharges, 
    setScreen, 
    team, 
    updatePokemon, 
    consumeCharge, 
    consumeSafariCharge, 
    medals, 
    currentBattlePath,
    lastTickTimestamp, 
    lastSafariTickTimestamp,
    dailyMissions,
    checkDailyMissions,
    claimMission,
    leagueProgress,
  } = useStore();

  const [showMissions, setShowMissions] = useState(false);

  const getTimeToNextTick = () => {
    if (charges >= 6) return 0;
    const elapsed = Date.now() - lastTickTimestamp;
    return Math.max(0, 300000 - (elapsed % 300000));
  };

  const getTimeToNextSafariTick = () => {
    if (safariCharges >= 8) return 0;
    const elapsed = Date.now() - lastSafariTickTimestamp;
    return Math.max(0, 1800000 - (elapsed % 1800000));
  };

  useEffect(() => {
    checkDailyMissions();
    const fixMoves = async () => {
      for (const pokemon of team) {
        if (pokemon.moves.length === 0) {
          try {
            const data = await api.getPokemon(pokemon.pokemonId);
            const moves = await api.getPokemonMoves(data, pokemon.level);
            updatePokemon(pokemon.id, { moves });
          } catch (e) {
            console.error("Failed to fix moves for", pokemon.name, e);
          }
        }
      }
    };
    fixMoves();
  }, [team, updatePokemon]);
  
  const nextTick = getTimeToNextTick();
  const minutes = Math.floor(nextTick / 60000);
  const seconds = Math.floor((nextTick % 60000) / 1000);

  const safariUnlocked = medals.filter(m => m.isUnlocked).length >= 20;
  const medalsCount = medals.filter(m => m.isUnlocked).length;
  const nextSafariTick = getTimeToNextSafariTick();
  const safariMinutes = Math.floor(nextSafariTick / 60000);
  const safariSeconds = Math.floor((nextSafariTick % 60000) / 1000);

  return (
    <div className="h-full relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Cosmic Background */}
      {(() => {
        const hour = new Date().getHours();
        const timeOfDay =
          hour >= 6 && hour < 12 ? 'morning' :
          hour >= 12 && hour < 18 ? 'afternoon' :
          hour >= 18 && hour < 21 ? 'evening' :
          'night';

        const skyGradients = {
          morning:   'from-orange-950/80 via-indigo-900/60 to-[#0f0f1a]',
          afternoon: 'from-blue-950/60 via-indigo-900/40 to-[#0f0f1a]',
          evening:   'from-orange-900/70 via-purple-900/60 to-[#0f0f1a]',
          night:     'from-[#0f0f1a] via-indigo-950/80 to-[#0f0f1a]',
        };

        const starOpacity = {
          morning: 0.1, afternoon: 0.05, evening: 0.2, night: 0.5,
        };

        return (
          <div className="absolute inset-0 bg-[#0f0f1a]">
            <div className={`absolute inset-0 bg-gradient-to-tr ${skyGradients[timeOfDay]}`} />
            <div className="absolute inset-0" style={{ opacity: starOpacity[timeOfDay] }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -100, 0],
                    opacity: [0.2, 0.5, 0.2],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 5 + Math.random() * 5,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                  }}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })()}

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-3xl font-black text-white flex items-center justify-center gap-2"
          >
            {charges}<span className="text-[#e63946]">/6</span>
            <Zap className="text-yellow-400 fill-yellow-400" size={18} />
          </motion.div>
          <p className="text-white/50 font-mono mt-1 text-[11px]">
            {charges >= 6
              ? '⚡ CARICHE AL MASSIMO!'
              : `PROSSIMA CARICA IN ${minutes}:${seconds.toString().padStart(2, '0')}`}
          </p>
        </div>

        {/* Progresso verso Capopalestra */} 
        <div className="w-full max-w-sm"> 
          {currentBattlePath.nextIsBoss ? ( 
            <motion.div 
              animate={{ scale: [1, 1.03, 1] }} 
              transition={{ duration: 1.5, repeat: Infinity }} 
              className="bg-yellow-500/10 border border-yellow-500/40 rounded-2xl px-4 py-3 text-center" 
            > 
              <p className="text-yellow-400 font-black text-sm uppercase tracking-widest"> 
                ⚔️ CAPOPALESTRA DISPONIBILE! 
              </p> 
              <p className="text-yellow-300/60 text-[10px] mt-1">La prossima lotta è contro il Capopalestra</p> 
            </motion.div> 
          ) : ( 
            <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl px-4 py-3"> 
              <div className="flex justify-between items-center mb-2"> 
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Progresso Palestra</span> 
                <span className="text-[10px] font-bold text-white/60"> 
                  {currentBattlePath.battlesWon % 15}/15 
                </span> 
              </div> 
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden"> 
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                  animate={{ width: `${((currentBattlePath.battlesWon % 15) / 15) * 100}%` }} 
                  transition={{ duration: 0.5 }} 
                /> 
              </div> 
              <p className="text-[10px] text-white/30 mt-1.5 text-center"> 
                {15 - (currentBattlePath.battlesWon % 15)} battaglie al prossimo Capopalestra 
              </p> 
            </div> 
          )} 
        </div> 

        {/* Team Preview */}
        {team.length > 0 && (
          <div className="w-full max-w-sm bg-[#1a1a2e]/60 backdrop-blur-md rounded-2xl p-3 border border-white/5">
            <div className="flex justify-around gap-2">
              {team.map(pkmn => (
                <div key={pkmn.id} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div className="relative">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkmn.pokemonId}.png`} 
                      alt={pkmn.name}
                      className="w-10 h-10 object-contain"
                    />
                    {pkmn.status && (
                      <span className={`absolute -top-1 -right-1 text-[7px] font-black px-1 py-0.5 rounded shadow-sm ${
                        pkmn.status === 'SLP' ? 'bg-purple-500' :
                        pkmn.status === 'PSN' ? 'bg-purple-700' :
                        pkmn.status === 'BRN' ? 'bg-orange-500' :
                        pkmn.status === 'PAR' ? 'bg-yellow-400 text-black' :
                        pkmn.status === 'FRZ' ? 'bg-blue-400' : ''
                      }`}>{pkmn.status}</span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase truncate w-full text-center text-white/70">
                    {pkmn.name.slice(0, 8)}
                  </span>
                  <div className="w-full bg-white/10 rounded-full h-[3px] mt-0.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        (pkmn.currentHp / pkmn.stats.hp) > 0.5 ? 'bg-emerald-400' : 
                        (pkmn.currentHp / pkmn.stats.hp) > 0.2 ? 'bg-yellow-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${(pkmn.currentHp / pkmn.stats.hp) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowMissions(true)}
          className="w-full max-w-sm bg-[#1a1a2e]/60 border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span className="text-sm font-bold">Missioni giornaliere</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">
              {dailyMissions?.missions.filter(m => m.claimed).length ?? 0}/3
            </span>
            <span className="text-white/30 text-xs">→</span>
          </div>
        </button>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {/* CATTURA */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={charges === 0}
            onClick={() => {
              consumeCharge();
              setScreen('CATCH_SCREEN');
            }}
            className="w-full bg-[#e63946] disabled:opacity-50 disabled:grayscale p-4 rounded-3xl flex items-center justify-center gap-3 shadow-2xl shadow-[#e63946]/30"
          >
            <Target size={26} />
            <span className="text-xl font-black">CATTURA</span>
          </motion.button>

          {/* SAFARI */}
          <div className="text-center text-[11px] text-white/50">
            🌿 {safariCharges}/8{safariUnlocked && safariCharges < 8 ? ` • ${safariMinutes}:${safariSeconds.toString().padStart(2, '0')}` : safariUnlocked && safariCharges >= 8 ? ' • MAX' : ''}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={safariCharges === 0 || !safariUnlocked}
            onClick={() => {
              consumeSafariCharge();
              setScreen('SAFARI_SCREEN');
            }}
            className={`w-full p-3 rounded-2xl flex items-center justify-center gap-3 shadow-xl ${
              safariUnlocked
                ? 'bg-[#1a3a1a] border border-green-800/40 text-white'
                : 'bg-gray-800/60 border border-white/10 text-white/40'
            }`}
          >
            {safariUnlocked ? <TreePine size={20} /> : <span className="text-lg">🔒</span>}
            <span className="text-base font-black">
              {safariUnlocked ? 'ZONA SAFARI' : 'SAFARI'}
            </span>
            {!safariUnlocked && (
              <span className="text-[10px] font-bold text-white/40 ml-1">
                (20 medaglie)
              </span>
            )}
          </motion.button>

          {/* LOTTA + LEGA affiancati */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('BATTLE_SCREEN')}
              className="bg-[#1a1a2e] border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xl"
            >
              <Sword size={24} />
              <span className="text-sm font-black">LOTTA</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={medalsCount < 40}
              onClick={() => medalsCount >= 40 && setScreen('LEAGUE_SELECT_SCREEN')}
              className={`relative p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xl transition-all ${
                medalsCount >= 40
                  ? 'bg-gradient-to-b from-yellow-600/30 to-yellow-900/30 border border-yellow-500/40 text-yellow-300'
                  : 'bg-gray-800/60 border border-white/10 text-white/30'
              }`}
            >
              {medalsCount >= 40 && leagueProgress.completedRegions.length === 0 && !leagueProgress.currentRun && (
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full">
                  NUOVO
                </span>
              )}
              {medalsCount >= 40 ? <span className="text-xl">🏆</span> : <span className="text-xl">🔒</span>}
              <span className="text-sm font-black">LEGA</span>
              {medalsCount < 40 && (
                <span className="text-[9px] text-white/30">{medalsCount}/40 med.</span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Bottom-sheet Missioni */}
      <AnimatePresence>
        {showMissions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
            onClick={() => setShowMissions(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#1a1a2e] rounded-t-3xl p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-lg">MISSIONI GIORNALIERE</h3>
                <button onClick={() => setShowMissions(false)} className="p-2 bg-white/10 rounded-xl">
                  <X size={18} />
                </button>
              </div>

              {(dailyMissions?.missions ?? []).map(mission => (
                <div
                  key={mission.id}
                  className={`bg-[#0f0f1a] rounded-2xl p-4 border transition-all ${
                    mission.claimed
                      ? 'border-white/5 opacity-50'
                      : mission.completed
                      ? 'border-yellow-500/40 bg-yellow-500/5'
                      : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{mission.description}</span>
                    <span className="text-xs text-white/40">
                      {Math.min(mission.current, mission.target)}/{mission.target}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        mission.completed ? 'bg-yellow-400' : 'bg-[#e63946]'
                      }`}
                      style={{ width: `${Math.min(100, (mission.current / mission.target) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-yellow-400">
                      🎁 {mission.reward.coins ? `${mission.reward.coins}¢` : ''}
                      {mission.reward.items
                        ? ' + ' + Object.entries(mission.reward.items)
                            .map(([k, v]) => `${v}x ${k}`)
                            .join(', ')
                        : ''}
                    </p>
                    {mission.completed && !mission.claimed && (
                      <button
                        onClick={() => claimMission(mission.id)}
                        className="px-3 py-1 bg-yellow-500 text-black text-xs font-black rounded-xl"
                      >
                        RITIRA
                      </button>
                    )}
                    {mission.claimed && (
                      <span className="text-[10px] text-white/30 font-bold">✓ ritirato</span>
                    )}
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-white/30 text-center italic">
                Le missioni si rinnovano ogni giorno
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
