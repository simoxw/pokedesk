import React from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Star } from 'lucide-react';
import { LEAGUE_REGIONS, MASTER_TRAINERS, scaleLeagueLevel } from '../../data/leagueData';

const REGION_FLAGS: Record<string, string> = {
  kanto:  '🗾',
  johto:  '🌸',
  hoenn:  '🌊',
  sinnoh: '❄️',
  unova:  '🗽',
  kalos:  '🗼',
  alola:  '🌺',
  galar:  '⚔️',
};

const REGION_COLORS: Record<string, string> = {
  kanto:  'from-red-900/40 to-red-950/60 border-red-500/30',
  johto:  'from-pink-900/40 to-pink-950/60 border-pink-500/30',
  hoenn:  'from-blue-900/40 to-blue-950/60 border-blue-500/30',
  sinnoh: 'from-indigo-900/40 to-indigo-950/60 border-indigo-500/30',
  unova:  'from-slate-700/40 to-slate-900/60 border-slate-400/30',
  kalos:  'from-violet-900/40 to-violet-950/60 border-violet-500/30',
  alola:  'from-yellow-900/40 to-yellow-950/60 border-yellow-500/30',
  galar:  'from-emerald-900/40 to-emerald-950/60 border-emerald-500/30',
};

export default function LeagueSelectScreen() {
  const { setScreen, leagueProgress, medals, masterProgress } = useStore();
  const medalsCount = medals.filter(m => m.isUnlocked).length;

  const isRegionUnlocked = (regionId: string) => medalsCount >= 40;

  const getRegionStatus = (regionId: string) => { 
    if (leagueProgress.completedRegions.includes(regionId)) return 'completed'; 
    if (leagueProgress.currentRun?.regionId === regionId) return 'inprogress'; 
    // Regione completata in una run precedente (ha trofeo ma completedRegions resettato) 
    const regionDef = LEAGUE_REGIONS.find(r => r.id === regionId); 
    if (regionDef && leagueProgress.trophies.includes(regionDef.completionReward.trophyLabel)) return 'completed'; 
    return 'available'; 
  }; 

  const handleSelectRegion = (regionId: string) => {
    if (!isRegionUnlocked(regionId)) return;
    if (
      leagueProgress.currentRun &&
      leagueProgress.currentRun.regionId !== regionId &&
      leagueProgress.currentRun.trainerIndex > 0
    ) {
      const confirm = window.confirm(
        `Hai una run in corso su ${leagueProgress.currentRun.regionId.toUpperCase()}. Abbandonarla e iniziare ${regionId.toUpperCase()}?`
      );
      if (!confirm) return;
    }
    if (leagueProgress.currentRun?.regionId !== regionId) {
      useStore.getState().startLeagueRun(regionId);
    }
    setScreen('LEAGUE_BATTLE_SCREEN');
  };

  const completedAll = LEAGUE_REGIONS.every(r =>
    leagueProgress.completedRegions.includes(r.id)
  );

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setScreen('HUB_SCREEN')}
            className="p-2 bg-[#1a1a2e] rounded-xl"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-black uppercase">🏆 LEGA POKÉMON</h2>
            <p className="text-[11px] text-white/40">
              {leagueProgress.completedRegions.length}/8 regioni completate
              {leagueProgress.completedRuns > 0 && (() => {
                const allPkmn = LEAGUE_REGIONS.flatMap(r => [...r.elite4.flatMap(t => t.pokemon), ...r.champion.pokemon]);
                const globalMax = scaleLeagueLevel(Math.max(...allPkmn.map(p => p.level)), leagueProgress.completedRuns);
                const globalMin = scaleLeagueLevel(Math.min(...allPkmn.map(p => p.level)), leagueProgress.completedRuns);
                return (
                  <span className="ml-2 text-yellow-400 font-bold">
                    • Run {leagueProgress.completedRuns + 1} (Lv.{globalMin}–{globalMax})
                  </span>
                );
              })()}
            </p>
          </div>
        </div>

        {/* Trofei */}
        {leagueProgress.trophies.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            {[...new Set(leagueProgress.trophies)].map(t => ( 
              <span
                key={t}
                className="text-[9px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Banner completato tutto */}
        {completedAll && (
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 text-center mb-2"
          >
            <p className="text-yellow-400 font-black text-xs uppercase tracking-widest">
              🌟 GRAN MAESTRO POKÉMON — Tutte le leghe conquistate!
            </p>
          </motion.div>
        )}
      </div>

      {/* Griglia regioni + pulsante MASTER */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar">

        {/* ── PULSANTE MASTER ── */}
        {(() => {
          const masterUnlocked = leagueProgress.completedRuns >= 1;
          const masterDefeatedCount = masterProgress?.defeatedIds?.length ?? 0;
          const MASTER_TOTAL = MASTER_TRAINERS.length;
          return (
            <motion.button
              whileTap={{ scale: masterUnlocked ? 0.97 : 1 }}
              disabled={!masterUnlocked}
              onClick={() => masterUnlocked && setScreen('MASTER_BATTLE_SCREEN')}
              className={`w-full mb-4 relative rounded-2xl border p-4 flex items-center gap-4 transition-all ${
                masterUnlocked
                  ? 'bg-gradient-to-r from-purple-900/50 via-yellow-900/30 to-purple-900/50 border-yellow-500/50'
                  : 'bg-gray-900/40 border-white/10 opacity-40'
              }`}
            >
              {masterUnlocked && (
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl bg-yellow-400/5 pointer-events-none"
                />
              )}
              {!masterUnlocked ? (
                <Lock size={28} className="text-white/30 shrink-0" />
              ) : (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-4xl shrink-0"
                >
                  ⭐
                </motion.div>
              )}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className={`font-black text-lg uppercase tracking-wide ${masterUnlocked ? 'text-yellow-300' : 'text-white/30'}`}>
                    MASTER
                  </p>
                  {masterUnlocked && masterDefeatedCount > 0 && (
                    <span className="text-[9px] font-black bg-yellow-400/20 text-yellow-400 border border-yellow-500/40 px-2 py-0.5 rounded-full">
                      {masterDefeatedCount}/{MASTER_TOTAL} ✓
                    </span>
                  )}
                </div>
                <p className={`text-[10px] font-bold ${masterUnlocked ? 'text-white/50' : 'text-white/20'}`}>
                  {masterUnlocked
                    ? `${MASTER_TOTAL} allenatori leggendari · Lv. 86–100`
                    : 'Completa tutte le 8 Leghe per sbloccare'}
                </p>
              </div>
              {masterUnlocked && (
                <div className="text-yellow-400/60 text-xl shrink-0">→</div>
              )}
            </motion.button>
          );
        })()}

        <div className="grid grid-cols-2 gap-3">
          {LEAGUE_REGIONS.map((region, idx) => {
            const unlocked = isRegionUnlocked(region.id);
            const status = getRegionStatus(region.id);
            const isActive = leagueProgress.currentRun?.regionId === region.id;
            const currentTrainerIdx = isActive
              ? leagueProgress.currentRun!.trainerIndex
              : 0;
            const totalTrainers = region.elite4.length + 1;

            return (
              <motion.button
                key={region.id}
                whileTap={{ scale: unlocked ? 0.97 : 1 }}
                onClick={() => handleSelectRegion(region.id)}
                disabled={!unlocked}
                className={`relative bg-gradient-to-b ${
                  unlocked
                    ? REGION_COLORS[region.id]
                    : 'from-gray-900/40 to-gray-950/60 border-white/10'
                } border rounded-2xl p-4 flex flex-col gap-2 transition-all ${
                  !unlocked ? 'opacity-40' : ''
                }`}
              >
                {/* Badge stato */}
                {status === 'completed' && (
                  <span className="absolute top-2 right-2 text-[8px] font-black bg-yellow-400 text-black px-1.5 py-0.5 rounded-full">
                    ✓
                  </span>
                )}
                {status === 'inprogress' && (
                  <span className="absolute top-2 right-2 text-[8px] font-black bg-blue-400 text-black px-1.5 py-0.5 rounded-full">
                    ▶
                  </span>
                )}
                {!unlocked && (
                  <Lock size={12} className="absolute top-2 right-2 text-white/30" />
                )}

                {/* Flag + nome */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{REGION_FLAGS[region.id]}</span>
                  <div className="text-left">
                    <p className="font-black text-sm uppercase">{region.name}</p>
                    <p className="text-[9px] text-white/40">Gen {region.generation}</p>
                  </div>
                </div>

                {/* Progresso se in corso */}
                {isActive && (
                  <div>
                    <div className="flex justify-between text-[9px] text-white/50 mb-1">
                      <span>
                        {currentTrainerIdx < 4
                          ? `Superquattro ${currentTrainerIdx + 1}/4`
                          : 'Campione'}
                      </span>
                      <span>{currentTrainerIdx}/{totalTrainers}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-blue-400 transition-all"
                        style={{
                          width: `${(currentTrainerIdx / totalTrainers) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Campione */}
                <p className="text-[9px] text-white/40 text-left">
                  Campione: {region.champion.name}
                </p>

                {/* Livelli */}
                {(() => {
                  const allPkmn = [...region.elite4.flatMap(t => t.pokemon), ...region.champion.pokemon];
                  const minLv = scaleLeagueLevel(Math.min(...allPkmn.map(p => p.level)), leagueProgress.completedRuns);
                  const maxLv = scaleLeagueLevel(Math.max(...allPkmn.map(p => p.level)), leagueProgress.completedRuns);
                  return (
                    <p className="text-[9px] font-bold text-left" style={{
                      color: leagueProgress.completedRuns > 0 ? '#facc15' : '#86efac'
                    }}>
                      Lv. {minLv}–{maxLv}
                    </p>
                  );
                })()}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}