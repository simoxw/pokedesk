import React from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Target, Sparkles, Trash2, Sword, Edit2, Check, Star } from 'lucide-react';

export default function ProfileScreen() {
  const { player, stats, medals, setScreen, updatePlayer, leagueProgress } = useStore();
  const medalsWon = medals.filter(m => m.isUnlocked).length;
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

      <div className="bg-[#1a1a2e] rounded-[32px] p-8 mb-8 border border-white/5 flex flex-col items-center">
        <div className="w-24 h-24 bg-[#e63946] rounded-full flex items-center justify-center text-4xl mb-4 shadow-xl shadow-[#e63946]/20 relative group">
          {player.gender === 'M' ? '👦' : '👧'}
          <button 
            onClick={() => updatePlayer({ gender: player.gender === 'M' ? 'F' : 'M' })}
            className="absolute -bottom-1 -right-1 p-2 bg-[#1a1a2e] rounded-full border border-white/10 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} className="rotate-180" />
          </button>
        </div>
        
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-2xl font-black uppercase text-center w-48 focus:outline-none focus:border-[#e63946]"
            />
            <button onClick={handleSaveName} className="p-2 bg-green-500/20 text-green-400 rounded-xl">
              <Check size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black uppercase tracking-tighter">{player.name}</h3>
            <button onClick={() => { setIsEditingName(true); setTempName(player.name); }} className="p-1.5 bg-white/5 rounded-lg text-white/30 hover:text-white transition-colors">
              <Edit2 size={16} />
            </button>
          </div>
        )}
        
        <p className="text-white/30 text-xs mt-1">Allenatore dal {new Date(player.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard icon={<Sword size={18} />} label="LOTTE VINTE" value={stats.totalBattles} />
        <StatCard icon={<Target size={18} />} label="CATTURATI" value={stats.totalCaught} />
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
          const completed = leagueProgress.completedRegions.includes(region.id);
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
    <div className="bg-[#1a1a2e] p-4 rounded-2xl border border-white/5">
      <div className="flex items-center gap-2 text-white/40 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}
