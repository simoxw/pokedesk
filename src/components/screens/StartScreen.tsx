import React from 'react';
import { useStore } from '../../store';
import { motion } from 'motion/react';
import { Play, ShoppingBag, User, ArrowLeftRight, Settings } from 'lucide-react';

export default function StartScreen() {
  const { setScreen, isFirstRun } = useStore();

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-12 text-center"
      >
        <h1 className="text-6xl font-black tracking-tighter text-[#e63946] drop-shadow-[0_0_15px_rgba(230,57,70,0.5)]">
          POKEDESK
        </h1>
        <p className="text-sm uppercase tracking-widest opacity-50 mt-2">Gotta Catch 'Em All</p>
      </motion.div>

      <div className="w-full max-w-xs space-y-4">
        <MenuButton 
          icon={<Play size={20} />} 
          label={isFirstRun ? "INIZIA AVVENTURA" : "CONTINUA"} 
          onClick={() => setScreen(isFirstRun ? 'STARTER_DRAFT' : 'HUB_SCREEN')}
          primary
        />
        <MenuButton 
          icon={<ShoppingBag size={20} />} 
          label="NEGOZIO" 
          onClick={() => setScreen('SHOP_SCREEN')}
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
        <MenuButton 
          icon={<Settings size={20} />} 
          label="OPZIONI" 
          onClick={() => setScreen('OPTIONS_SCREEN')}
        />
      </div>
    </div>
  );
}

function MenuButton({ icon, label, onClick, primary = false }: { icon: React.ReactNode, label: string, onClick: () => void, primary?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
        primary 
          ? 'bg-[#e63946] text-white shadow-lg shadow-[#e63946]/20' 
          : 'bg-[#1a1a2e] text-[#f0f0f0] border border-white/5 hover:bg-[#252545]'
      }`}
    >
      <span className="opacity-70">{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}
