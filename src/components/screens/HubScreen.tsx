import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { BattleEngine } from '../../BattleEngine';
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
    eggs,
    startIncubation,
    hatchEgg,
    box,
    favorites,
  } = useStore();

  const [showMissions, setShowMissions] = useState(false);
  const [showIncubator, setShowIncubator] = useState(false);
  const [incubStep, setIncubStep] = useState<'list' | 'pick1' | 'pick2'>('list');
  const [incubPick1, setIncubPick1] = useState<any>(null);
  const [incubPreview, setIncubPreview] = useState<any>(null);
  const [incubPreviewLoading, setIncubPreviewLoading] = useState(false);
  const [incubSearch, setIncubSearch] = useState('');
  const [incubFilterType, setIncubFilterType] = useState<string | null>(null);
  const [incubFavOnly, setIncubFavOnly] = useState(false);
  const [incubSortIv, setIncubSortIv] = useState(false);
  const [incubSortNumber, setIncubSortNumber] = useState(false);
  const [incubPokedexFrom, setIncubPokedexFrom] = useState('');
  const [incubPokedexTo, setIncubPokedexTo] = useState('');

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
    eggs.filter(e => Date.now() >= e.hatchAt).forEach(e => hatchEgg(e.id));
    const fixMoves = async () => {
      for (const pokemon of [...team, ...box]) {
        if (pokemon.moves.length === 0 || pokemon.name.startsWith('#')) {
          try {
            const data = await api.getPokemon(pokemon.pokemonId);
            const species = await api.getSpecies(pokemon.pokemonId);
            const moves = await api.getPokemonMoves(data, pokemon.level);
            const baseStats = {
              hp: data.stats[0].base_stat, attack: data.stats[1].base_stat,
              defense: data.stats[2].base_stat, spAtk: data.stats[3].base_stat,
              spDef: data.stats[4].base_stat, speed: data.stats[5].base_stat,
            };
            const stats = BattleEngine.calculateStats(pokemon.level, baseStats, pokemon.ivs, pokemon.evs, pokemon.nature);
            updatePokemon(pokemon.id, {
              moves,
              name: api.getItalianName(species.names),
              baseStats,
              stats,
              currentHp: Math.min(stats.hp, pokemon.currentHp > 0 ? stats.hp : 0),
              types: data.types.map((t: any) => t.type.name),
              growthRate: species.growth_rate.name,
            });
          } catch (e) {
            console.error("Failed to fix moves for", pokemon.name, e);
          }
        }
      }
    };
    fixMoves();
  }, [team, box, updatePokemon, eggs, hatchEgg]);
  
  const nextTick = getTimeToNextTick();
  const minutes = Math.floor(nextTick / 60000);
  const seconds = Math.floor((nextTick % 60000) / 1000);

  const safariUnlocked = medals.filter(m => m.isUnlocked).length >= 20;
  const medalsCount = medals.filter(m => m.isUnlocked).length;
  const nextSafariTick = getTimeToNextSafariTick();
  const safariMinutes = Math.floor(nextSafariTick / 60000);
  const safariSeconds = Math.floor((nextSafariTick % 60000) / 1000);

  return (
    <div className="h-full relative overflow-hidden overflow-x-hidden flex flex-col items-center justify-evenly py-3 px-6">
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

      <div className="relative z-10 flex flex-col items-center gap-2 w-full max-w-sm overflow-y-auto">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl font-black text-white flex items-center justify-center gap-2"
          >
            {charges}<span className="text-[#e63946]">/6</span>
            <Zap className="text-yellow-400 fill-yellow-400" size={14} />
          </motion.div>
          <p className="text-white/50 font-mono mt-0.5 text-[10px]">
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
            className="bg-yellow-500/10 border border-yellow-500/40 rounded-2xl px-2 py-3 text-center max-w-[95%] mx-auto" 
          > 
              <p className="text-yellow-400 font-black text-sm uppercase tracking-widest"> 
                ⚔️ CAPOPALESTRA DISPONIBILE! 
              </p> 
              <p className="text-yellow-300/60 text-[10px] mt-1">La prossima lotta è contro il Capopalestra</p> 
            </motion.div> 
          ) : ( 
            <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl px-3 py-2"> 
              <div className="flex justify-between items-center mb-1"> 
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Progresso Palestra</span> 
                <span className="text-[9px] font-bold text-white/60"> 
                  {currentBattlePath.battlesWon % 15}/15 
                </span> 
              </div> 
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden"> 
                <motion.div 
                  className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                  animate={{ width: `${((currentBattlePath.battlesWon % 15) / 15) * 100}%` }} 
                  transition={{ duration: 0.5 }} 
                /> 
              </div> 
              <p className="text-[9px] text-white/30 mt-1 text-center"> 
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
                      className="w-12 h-12 object-contain"
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
          className="w-full max-w-sm bg-[#1a1a2e]/60 border border-white/5 rounded-2xl px-4 py-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span className="text-base font-bold">Missioni giornaliere</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">
              {dailyMissions?.missions.filter(m => m.claimed).length ?? 0}/3
            </span>
            <span className="text-white/30 text-xs">→</span>
          </div>
        </button>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          {/* CATTURA */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={charges === 0}
            onClick={() => {
              consumeCharge();
              setScreen('CATCH_SCREEN');
            }}
            className="w-full bg-[#e63946] disabled:opacity-50 disabled:grayscale py-5 rounded-3xl flex items-center justify-center gap-3 shadow-2xl shadow-[#e63946]/30"
          >
            <Target size={26} />
            <span className="text-2xl font-black">CATTURA</span>
          </motion.button>

          {/* SAFARI */}
          <div className="text-center text-[11px] text-white/50">
            🌿 {safariCharges}/8{safariUnlocked && safariCharges < 8 ? ` • Prossima carica: ${safariMinutes}:${safariSeconds.toString().padStart(2, '0')}` : safariUnlocked && safariCharges >= 8 ? ' • MAX' : ''}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={safariCharges === 0 || !safariUnlocked}
            onClick={() => {
              consumeSafariCharge();
              setScreen('SAFARI_SCREEN');
            }}
            className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl ${
              safariUnlocked
                ? 'bg-[#1a3a1a] border border-green-800/40 text-white'
                : 'bg-gray-800/60 border border-white/10 text-white/40'
            }`}
          >
            {safariUnlocked ? <TreePine size={20} /> : <span className="text-lg">🔒</span>}
            <span className="text-2xl font-black">
              {safariUnlocked ? 'ZONA SAFARI' : 'SAFARI'}
            </span>
            {!safariUnlocked && (
              <span className="text-[10px] font-bold text-white/40 ml-1">
                (20 medaglie)
              </span>
            )}
          </motion.button>

          {/* INCUBATRICE */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowIncubator(true); setIncubStep('list'); setIncubPick1(null); }}
            className="w-full bg-[#1a1a2e] border border-white/10 py-4 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥚</span>
              <div className="text-left">
                <p className="text-sm font-black">INCUBATRICE</p>
                <p className="text-[10px] text-white/40">{eggs.length}/4 uova</p>
              </div>
            </div>
            {eggs.some(e => Date.now() >= e.hatchAt) && (
              <span className="text-[10px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full animate-pulse">🐣 PRONTE!</span>
            )}
          </motion.button>

          {/* LOTTA + LEGA affiancati */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('BATTLE_SCREEN')}
              className="bg-[#1a1a2e] border border-white/10 py-6 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xl"
            >
              <Sword size={24} />
              <span className="text-base font-black">LOTTA</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={medalsCount < 40}
              onClick={() => medalsCount >= 40 && setScreen('LEAGUE_SELECT_SCREEN')}
              className={`relative py-6 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xl transition-all ${
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
              <span className="text-base font-black">LEGA</span>
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

      {/* Bottom-sheet Incubatrice */}
      <AnimatePresence>
        {showIncubator && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
            onClick={() => { setShowIncubator(false); setIncubStep('list'); setIncubPick1(null); }}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-[#1a1a2e] rounded-t-3xl p-6 space-y-4 max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg">
                  {incubStep === 'list' ? '🥚 INCUBATRICE' : incubStep === 'pick1' ? '1° Pokémon genitore' : `2° compatibile con ${incubPick1?.name}`}
                </h3>
                <button onClick={() => { setShowIncubator(false); setIncubStep('list'); setIncubPick1(null); }} className="p-2 bg-white/10 rounded-xl">
                  <X size={18} />
                </button>
              </div>

              {incubStep === 'list' && (
                <>
                  {eggs.length === 0 && (
                    <p className="text-white/30 text-sm italic text-center py-4">
                      Nessuna uova in incubazione.{'\n'}Usa due Pokémon della stessa specie, o uno + Ditto.
                    </p>
                  )}
                  <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                    {eggs.map(egg => {
                      const remaining = Math.max(0, egg.hatchAt - Date.now());
                      const progress = Math.min(100, ((72 * 3600000 - remaining) / (72 * 3600000)) * 100);
                      const hours = Math.floor(remaining / 3600000);
                      const mins = Math.floor((remaining % 3600000) / 60000);
                      const ready = remaining === 0;
                      return (
                        <div key={egg.id} className={`bg-[#0f0f1a] rounded-2xl p-4 border ${ready ? 'border-yellow-500/50' : 'border-white/5'}`}>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{ready ? '🐣' : '🥚'}</span>
                            <div className="flex-1">
                              <p className="font-black text-sm">Pokémon #{egg.basePokemonId}</p>
                              <p className="text-[10px] text-white/40">
                                IV {Object.values(egg.ivs).reduce((a, b) => a + b, 0)}/186{egg.isShiny ? ' · ✨ Shiny!' : ''}
                              </p>
                            </div>
                            {ready && (
                              <button onClick={() => hatchEgg(egg.id)} className="px-3 py-1.5 bg-yellow-500 text-black text-xs font-black rounded-xl">
                                SCHIUDI
                              </button>
                            )}
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div className="h-2 rounded-full bg-yellow-400 transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          {!ready && <p className="text-[10px] text-white/30 mt-1 text-right">{hours}h {mins}m rimanenti</p>}
                        </div>
                      );
                    })}
                  </div>
                  {eggs.length < 4 && (
                    <button onClick={() => {
                      setIncubStep('pick1');
                      setIncubSearch('');
                      setIncubFilterType(null);
                      setIncubFavOnly(false);
                      setIncubSortIv(false);
                      setIncubPokedexFrom('');
                      setIncubPokedexTo('');
                    }} className="w-full bg-[#e63946] py-3 rounded-2xl font-black">
                      + NUOVA INCUBAZIONE
                    </button>
                  )}
                </>
              )}

              {(incubStep === 'pick1' || incubStep === 'pick2') && (() => {
                const TYPES_IT: Record<string,string> = {
                  fire:'🔥',water:'💧',grass:'🌿',electric:'⚡',ice:'❄️',
                  fighting:'🥊',poison:'☠️',ground:'🌍',flying:'🕊️',psychic:'🔮',
                  bug:'🐛',rock:'🪨',ghost:'👻',dragon:'🐉',steel:'⚙️',dark:'🌑',fairy:'✨',normal:'⬜'
                };
                const allPkmn = [...team, ...box]
                  .filter(p => incubStep === 'pick2' ? p.id !== incubPick1?.id : true)
                  .filter(p => !incubSearch || p.name.toLowerCase().includes(incubSearch.toLowerCase()))
                  .filter(p => !incubFilterType || p.types.includes(incubFilterType as any))
                  .filter(p => !incubFavOnly || favorites.includes(p.id))
                  .filter(p => !incubPokedexFrom || p.pokemonId >= Number(incubPokedexFrom))
                  .filter(p => !incubPokedexTo || p.pokemonId <= Number(incubPokedexTo))
                  .filter(p => {
                    if (incubStep !== 'pick2' || !incubPick1) return true;
                    return p.pokemonId === 132 || incubPick1.pokemonId === 132 || p.baseSpeciesId === incubPick1.baseSpeciesId;
                  })
                  .sort((a, b) => {
                    if (incubSortIv) {
                      const ivA = a.ivs.hp + a.ivs.attack + a.ivs.defense + a.ivs.spAtk + a.ivs.spDef + a.ivs.speed;
                      const ivB = b.ivs.hp + b.ivs.attack + b.ivs.defense + b.ivs.spAtk + b.ivs.spDef + b.ivs.speed;
                      return ivB - ivA;
                    }
                    if (incubSortNumber) {
                      return a.pokemonId - b.pokemonId;
                    }
                    return 0;
                  });
                return (
                <>
                {/* Barra filtri */}
                <div className="flex-shrink-0 space-y-2">
                  <input
                    type="text"
                    placeholder="Cerca per nome..."
                    value={incubSearch}
                    onChange={e => setIncubSearch(e.target.value)}
                    className="w-full bg-[#0f0f1a] border border-white/5 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#e63946]/50"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="# da"
                      value={incubPokedexFrom}
                      onChange={e => setIncubPokedexFrom(e.target.value)}
                      className="w-full bg-[#0f0f1a] border border-white/5 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#e63946]/50"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="# a"
                      value={incubPokedexTo}
                      onChange={e => setIncubPokedexTo(e.target.value)}
                      className="w-full bg-[#0f0f1a] border border-white/5 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#e63946]/50"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setIncubFavOnly(f => !f)}
                      className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-black transition-all border ${incubFavOnly ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-[#0f0f1a] border-white/10 text-white/40'}`}
                    >★ FAV</button>
                    <button
                      onClick={() => {
                        setIncubSortIv(s => !s);
                        if (!incubSortIv) setIncubSortNumber(false);
                      }}
                      className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-black transition-all border ${incubSortIv ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#0f0f1a] border-white/10 text-white/40'}`}
                    >IV ↓</button>
                    <button
                      onClick={() => {
                        setIncubSortNumber(s => !s);
                        if (!incubSortNumber) setIncubSortIv(false);
                      }}
                      className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-black transition-all border ${incubSortNumber ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#0f0f1a] border-white/10 text-white/40'}`}
                    >NUM</button>
                    <button
                      onClick={() => setIncubFilterType(null)}
                      className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-black transition-all border ${!incubFilterType ? 'bg-[#e63946] border-[#e63946]' : 'bg-[#0f0f1a] border-white/10 text-white/40'}`}
                    >TUTTI</button>
                    {Object.entries(TYPES_IT).map(([t, icon]) => (
                      <button key={t} onClick={() => setIncubFilterType(incubFilterType === t ? null : t)}
                        className={`flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-black transition-all border ${incubFilterType === t ? 'bg-white/20 border-white/40' : 'bg-[#0f0f1a] border-white/5 text-white/40'}`}
                      >{icon}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                  {allPkmn.map(p => {
                      const compatible = incubStep === 'pick2' && incubPick1
                        ? p.pokemonId === 132 || incubPick1.pokemonId === 132 || p.baseSpeciesId === incubPick1.baseSpeciesId
                        : true;
                      return (
                        <button
                          key={p.id}
                          disabled={incubStep === 'pick2' && !compatible}
                          onClick={async () => {
                            if (incubStep === 'pick1') {
                              setIncubPick1(p);
                              setIncubStep('pick2');
                              setIncubPreview(null);
                              setIncubSearch('');
                              setIncubFilterType(null);
                              setIncubFavOnly(false);
                              setIncubSortIv(false);
                              setIncubPokedexFrom('');
                              setIncubPokedexTo('');
                            } else if (incubPick1) {
                              // carica anteprima
                              const nonDitto = p.pokemonId === 132 ? incubPick1 : p;
                              setIncubPreviewLoading(true);
                              setIncubPreview(null);
                              try {
                                const data = await api.getPokemon(nonDitto.baseSpeciesId);
                                const species = await api.getSpecies(nonDitto.baseSpeciesId);
                                const bestIvs = {
                                  hp: Math.max(p.ivs.hp, incubPick1.ivs.hp),
                                  attack: Math.max(p.ivs.attack, incubPick1.ivs.attack),
                                  defense: Math.max(p.ivs.defense, incubPick1.ivs.defense),
                                  spAtk: Math.max(p.ivs.spAtk, incubPick1.ivs.spAtk),
                                  spDef: Math.max(p.ivs.spDef, incubPick1.ivs.spDef),
                                  speed: Math.max(p.ivs.speed, incubPick1.ivs.speed),
                                };
                                const baseStats = {
                                  hp: data.stats[0].base_stat, attack: data.stats[1].base_stat,
                                  defense: data.stats[2].base_stat, spAtk: data.stats[3].base_stat,
                                  spDef: data.stats[4].base_stat, speed: data.stats[5].base_stat,
                                };
                                const stats = BattleEngine.calculateStats(5, baseStats, bestIvs,
                                  { hp:0, attack:0, defense:0, spAtk:0, spDef:0, speed:0 }, 'Hardy');
                                setIncubPreview({
                                  name: api.getItalianName(species.names),
                                  pokemonId: data.id,
                                  ivs: bestIvs,
                                  stats,
                                  p1: incubPick1,
                                  p2: p,
                                });
                              } catch {}
                              setIncubPreviewLoading(false);
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            compatible ? 'border-white/10 bg-white/5' : 'border-white/5 opacity-30 cursor-not-allowed'
                          }`}
                        >
                          <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`} className="w-10 h-10 object-contain" />
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-sm uppercase truncate">{p.name}</p>
                              {Object.values(p.ivs).some((v: any) => v === 31) && (
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_4px_#4ade80]" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-[#e63946] font-bold">Lv.{p.level}</p>
                              <div className="flex gap-1">
                                {Object.entries(p.ivs).map(([stat, val]) => (
                                  <span key={stat} className={`text-[9px] font-bold ${(val as number) === 31 ? 'text-green-400' : 'text-white/20'}`}>
                                    {val as number}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10px] text-white/30 truncate">
                                ({(Object.values(p.ivs) as number[]).reduce((a,b)=>a+b,0)}/186) {p.pokemonId === 132 ? 'DITTO ⭐' : ''}
                              </p>
                            </div>
                          </div>
                          {incubStep === 'pick2' && compatible && <span className="text-[9px] text-green-400 font-black shrink-0">✓</span>}
                        </button>
                      );
                  })}
                </div>
                </>
                );
              })()}

              {/* Anteprima uovo */}
              {incubStep === 'pick2' && (incubPreviewLoading || incubPreview) && (
                <div className="bg-[#0f0f1a] rounded-2xl p-4 border border-yellow-500/30 space-y-3">
                  {incubPreviewLoading && (
                    <p className="text-white/40 text-xs text-center animate-pulse">Calcolo statistiche...</p>
                  )}
                  {incubPreview && (
                    <>
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${incubPreview.pokemonId}.png`}
                          className="w-14 h-14 object-contain"
                        />
                        <div>
                          <p className="font-black text-sm uppercase">{incubPreview.name} <span className="text-yellow-400">Lv.5</span></p>
                          <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5">
                            {Object.entries(incubPreview.ivs).map(([stat, val]) => (
                              <span key={stat} className="text-[9px] uppercase font-bold">
                                <span className={(val as number) === 31 ? 'text-green-400' : 'text-white/40'}>{val as number}</span>
                              </span>
                            ))}
                            <span className="text-[9px] text-white/20 font-black ml-1">TOT: {(Object.values(incubPreview.ivs) as number[]).reduce((a: number, b: number) => a + b, 0)}/186</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {Object.entries(incubPreview.stats).map(([k, v]: any) => (
                          <div key={k} className="bg-white/5 rounded-xl px-2 py-1.5 text-center">
                            <p className="text-[8px] text-white/30 uppercase font-bold">{k === 'spAtk' ? 'Att.Sp' : k === 'spDef' ? 'Dif.Sp' : k.toUpperCase()}</p>
                            <p className="text-sm font-black text-white/90">{v}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-white/30 italic text-center">
                        * stat calcolate con natura Hardy — la natura reale sarà random
                      </p>
                      <button
                        onClick={() => {
                          startIncubation(incubPreview.p1, incubPreview.p2);
                          setIncubStep('list');
                          setIncubPick1(null);
                          setIncubPreview(null);
                        }}
                        className="w-full bg-yellow-500 text-black py-3 rounded-2xl font-black text-sm"
                      >
                        🥚 CONFERMA INCUBAZIONE
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
