import React from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { Play, ShoppingBag, User, ArrowLeftRight, Settings, Sword, Trophy } from 'lucide-react';

export default function StartScreen() {
  const { setScreen, isFirstRun, leagueProgress } = useStore();
  const towerUnlocked = leagueProgress.completedRuns >= 1;
  const tradeEventUnlocked = leagueProgress.completedRuns >= 1;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 text-center"
      >
        <h1 className="text-5xl font-black tracking-tighter text-[#e63946] drop-shadow-[0_0_12px_rgba(230,57,70,0.45)]">
          POKEDESK
        </h1>
        <p className="text-xs uppercase tracking-widest opacity-50 mt-1">Gotta Catch 'Em All</p>
      </motion.div>

      <div className="w-full max-w-xs space-y-4">
        <MenuButton 
          icon={<Play size={20} />} 
          label={isFirstRun ? "INIZIA AVVENTURA" : "CONTINUA"} 
          onClick={() => setScreen(isFirstRun ? 'STARTER_DRAFT' : 'HUB_SCREEN')}
          primary
        />
        <div className="relative"> 
          <MenuButton 
            icon={<span className="text-lg">🗼</span>} 
            label="TORRE LOTTA" 
            onClick={() => setScreen('BATTLE_TOWER_SCREEN')} 
            primary={false} 
            disabled={!towerUnlocked} 
          /> 
          {!towerUnlocked && ( 
            <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none"> 
              <span className="text-[10px] text-white/30 font-bold"> 
                🔒 Completa la Lega 
              </span> 
            </div> 
          )} 
        </div>
        <MenuButton 
          icon={<ShoppingBag size={20} />} 
          label="NEGOZIO" 
          onClick={() => setScreen('SHOP_SCREEN')}
        />
        <MenuButton 
          icon={<Trophy size={20} />} 
          label="ACHIEVEMENT" 
          onClick={() => setScreen('ACHIEVEMENT_SCREEN')}
        />
        <MenuButton 
          icon={<User size={20} />} 
          label="PROFILO / MEDAGLIE" 
          onClick={() => setScreen('PROFILE_SCREEN')}
        />
        <MenuButton 
          icon={<ArrowLeftRight size={20} />} 
          label="SCAMBIA" 
          onClick={() => setScreen('TRADE_SCREEN')}
        />
        <div className="relative">
          <MenuButton 
            icon={<span className="text-lg">🎯</span>} 
            label="TRADE EVENT" 
            onClick={() => setScreen('TRADE_EVENT_SCREEN')}
            primary={false}
            disabled={!tradeEventUnlocked}
          />
          {!tradeEventUnlocked && (
            <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
              <span className="text-[10px] text-white/30 font-bold">
                🔒 Completa la Lega
              </span>
            </div>
          )}
        </div>
        <MenuButton 
          icon={<Sword size={20} />} 
          label="SFIDA AMICI" 
          onClick={() => setScreen('FRIEND_BATTLE_SCREEN')}
        />
        <MenuButton 
          icon={<Settings size={20} />} 
          label="OPZIONI" 
          onClick={() => setScreen('OPTIONS_SCREEN')}
        />
      </div>
    </div>
  );
}

function MenuButton({ icon, label, onClick, primary = false, disabled = false }: { icon: React.ReactNode, label: string, onClick: () => void, primary?: boolean, disabled?: boolean }) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
        disabled 
          ? 'bg-[#1a1a2e]/50 text-white/20 border border-white/5 cursor-not-allowed'
          : primary 
          ? 'bg-[#e63946] text-white shadow-lg shadow-[#e63946]/20' 
          : 'bg-[#1a1a2e] text-[#f0f0f0] border border-white/5 hover:bg-[#252545]'
      }`}
    >
      <span className="opacity-70">{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}
