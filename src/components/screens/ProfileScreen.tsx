import React from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Target, Sparkles, Trash2, Sword, Edit2, Check, Star } from 'lucide-react';

export default function ProfileScreen() {
  const { player, stats, medals, achievements, leagueProgress, masterProgress, setScreen, updatePlayer } = useStore();
  const medalsWon = medals.filter(m => m.isUnlocked).length;
  const achievementsWon = achievements.filter(a => a.unlocked).length;
  const playerScore =
    stats.totalBattles * 1 +
    stats.totalCaught * 2 +
    stats.shiniesFound * 50 +
    medalsWon * 25 +
    achievementsWon * 100 +
    leagueProgress.completedRegions.length * 200 +
    leagueProgress.completedRuns * 500 +
    (masterProgress?.defeatedIds?.length ?? 0) * 150;
  const playerLevel = Math.floor(playerScore / 100);
  const playerProgress = playerScore % 100;
  const getPlayerRank = (lvl: number) => {
    if (lvl >= 200) return { label: '👑 Leggenda', color: 'text-yellow-300' };
    if (lvl >= 101) return { label: '⭐ Maestro', color: 'text-purple-400' };
    if (lvl >= 51)  return { label: '🏆 Campione', color: 'text-blue-400' };
    if (lvl >= 26)  return { label: '🔥 Esperto', color: 'text-orange-400' };
    if (lvl >= 11)  return { label: '⚔️ Allenatore', color: 'text-green-400' };
    return { label: '🌱 Novizio', color: 'text-white/50' };
  };
  const rank = getPlayerRank(playerLevel);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(player.name);

  const handleSaveName = () => {
    if (tempName.trim()) {
      updatePlayer({ name: tempName.trim() });
      setIsEditingName(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0f0f1a] overflow-y-auto no-scrollbar pb-24">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => setScreen('HUB_SCREEN')} className="p-2 bg-[#1a1a2e] rounded-xl">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-black">PROFILO</h2>
      </header>

      <div className="flex gap-3 mb-8">
        {/* Profilo - metà sinistra */}
        <div className="bg-[#1a1a2e] rounded-[28px] p-4 border border-white/5 flex flex-col items-center flex-1">
          <div className="relative inline-block mb-2">
            <div className="w-24 h-24 bg-[#e63946] rounded-full flex items-center justify-center overflow-hidden shadow-xl shadow-[#e63946]/20">
              <img
                src={`https://play.pokemonshowdown.com/sprites/trainers/${player.gender === 'M' ? 'brendan-gen3' : 'may-gen3'}.png`}
                alt="Trainer"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => updatePlayer({ gender: player.gender === 'M' ? 'F' : 'M' })}
              className="absolute -top-1 -right-1 p-2 bg-[#1a1a2e] rounded-full border border-white/10 text-white/50 shadow-lg"
            >
              <ArrowLeft size={12} className="rotate-180" />
            </button>
          </div>
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-base font-black uppercase text-center w-28 focus:outline-none focus:border-[#e63946]"
              />
              <button onClick={handleSaveName} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg">
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <h3 className="text-2xl font-black uppercase tracking-tighter">{player.name}</h3>
              <button onClick={() => { setIsEditingName(true); setTempName(player.name); }} className="p-1.5 bg-white/5 rounded-lg text-white/30">
                <Edit2 size={14} />
              </button>
            </div>
          )}
          <p className="text-white/30 text-sm mt-1">dal {new Date(player.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Stats destra */}
        <div className="flex flex-col gap-3 flex-1">
          <div className="bg-[#1a1a2e] rounded-2xl p-3 border border-white/5 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-white/40 mb-1">
              <Trophy size={14} className="text-yellow-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Achievement</span>
            </div>
            <div className="text-2xl font-black">{achievementsWon}</div>
            <div className="text-[9px] text-white/30">{achievements.length} totali</div>
          </div>
          <div className="bg-[#1a1a2e] rounded-2xl p-3 border border-yellow-500/20 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-white/40 mb-1">
              <Star size={14} className="text-yellow-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Livello</span>
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-black text-yellow-400">{playerLevel}</div>
              <span className={`text-[10px] font-black ${rank.color}`}>{rank.label}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 my-1">
              <div
                className="h-1.5 rounded-full bg-yellow-400 transition-all"
                style={{ width: `${playerProgress}%` }}
              />
            </div>
            <div className="text-[9px] text-white/30">{playerProgress}/100 al prossimo lv.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard icon={<Sword size={16} />} label="LOTTE VINTE" value={stats.totalBattles} />
        <StatCard icon={<Target size={16} />} label="CATTURATI" value={stats.totalCaught} />
        <StatCard icon={<Trophy size={18} />} label="MEDAGLIE" value={medalsWon} />
        <StatCard icon={<Sparkles size={18} />} label="SHINY" value={stats.shiniesFound} />
      </div>

      <h4 className="text-lg font-black mb-4 flex items-center gap-2">
        <Trophy size={20} className="text-yellow-500" /> BACHECA MEDAGLIE
      </h4>
      <div className="grid grid-cols-8 gap-2 mb-8">
        {medals.map(medal => (
          <div 
            key={medal.id}
            className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
              medal.isUnlocked ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-white/5 opacity-20'
            }`}
          >
            <Trophy size={16} className={medal.isUnlocked ? 'text-yellow-500' : 'text-white'} />
          </div>
        ))}
      </div>

      <h4 className="text-lg font-black mb-4 flex items-center gap-2">
        <Star size={20} className="text-purple-400" /> TROFEI LEGA
      </h4>
      {leagueProgress.completedRuns > 0 && (
        <div className="mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 text-center">
          <p className="text-yellow-400 font-black text-xs uppercase tracking-widest">
            🌟 GRAN MAESTRO — {leagueProgress.completedRuns}× tutte le leghe completate
          </p>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: 'kanto',  label: 'Kanto',  flag: '🗾' },
          { id: 'johto',  label: 'Johto',  flag: '🌸' },
          { id: 'hoenn',  label: 'Hoenn',  flag: '🌊' },
          { id: 'sinnoh', label: 'Sinnoh', flag: '❄️' },
          { id: 'unova',  label: 'Unima',  flag: '🗽' },
          { id: 'kalos',  label: 'Kalos',  flag: '🗼' },
          { id: 'alola',  label: 'Alola',  flag: '🌺' },
          { id: 'galar',  label: 'Galar',  flag: '⚔️' },
        ].map(region => {
          const completed = leagueProgress.trophies.some(t => t.includes(region.label)) 
            || leagueProgress.completedRegions.includes(region.id); 
          return (
            <div
              key={region.id}
              className={`rounded-xl p-2 flex flex-col items-center gap-1 border transition-all ${
                completed
                  ? 'bg-purple-500/20 border-purple-500/50'
                  : 'bg-white/5 border-white/5 opacity-30'
              }`}
            >
              <span className="text-xl">{completed ? region.flag : '🔒'}</span>
              <span className={`text-[9px] font-black uppercase ${completed ? 'text-purple-300' : 'text-white/40'}`}>
                {region.label}
              </span>
              {completed && (
                <Trophy size={10} className="text-yellow-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) {
  return (
    <div className="bg-[#1a1a2e] p-3 rounded-2xl border border-white/5">
      <div className="flex items-center gap-2 text-white/40 mb-1">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}
