import React from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { LEAGUE_REGIONS } from '../../data/leagueData';

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
  const { setScreen, leagueProgress, medals } = useStore();
  const medalsCount = medals.filter(m => m.isUnlocked).length;

  const isRegionUnlocked = (regionId: string) => medalsCount >= 40;

  const getRegionStatus = (regionId: string) => {
    if (leagueProgress.completedRegions.includes(regionId)) return 'completed';
    if (leagueProgress.currentRun?.regionId === regionId) return 'inprogress';
    return 'available';
  };

  const handleSelectRegion = (regionId: string) => {
    if (!isRegionUnlocked(regionId)) return;
    // Avvia nuova run solo se non c'è già una run in corso per questa regione
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
              {leagueProgress.completedRuns > 0 && (
                <span className="ml-2 text-yellow-400 font-bold">
                  • Run {leagueProgress.completedRuns + 1} (Lv.75-88)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Trofei */}
        {leagueProgress.trophies.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            {leagueProgress.trophies.map(t => (
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

      {/* Griglia regioni */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar">
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
                <p className="text-[9px] font-bold text-left" style={{
                  color: leagueProgress.completedRuns > 0 ? '#facc15' : '#86efac'
                }}>
                  Lv. {leagueProgress.completedRuns > 0 ? '70-82' : '50-62'}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}