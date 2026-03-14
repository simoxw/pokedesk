import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import StartScreen from './components/screens/StartScreen';
import StarterDraft from './components/screens/StarterDraft';
import HubScreen from './components/screens/HubScreen';
import CatchScreen from './components/screens/CatchScreen';
import BattleScreen from './components/screens/BattleScreen';
import TeamScreen from './components/screens/TeamScreen';
import BoxScreen from './components/screens/BoxScreen';
import BagScreen from './components/screens/BagScreen';
import PokedexScreen from './components/screens/PokedexScreen';
import ShopScreen from './components/screens/ShopScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import TradeScreen from './components/screens/TradeScreen';
import OptionsScreen from './components/screens/OptionsScreen';
import BottomNav from './components/ui/BottomNav';
import { useTickSystem } from './TickSystem';
import { NotificationService } from './NotificationService';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const { currentScreen, isFirstRun, settings } = useStore();
  const { getTimeToNextTick } = useTickSystem();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (settings.notifications) {
      NotificationService.requestPermission();
    }
  }, [settings.notifications]);

  useEffect(() => {
    const onUpdate = () => setUpdateAvailable(true);
    window.addEventListener('swUpdate', onUpdate);
    return () => window.removeEventListener('swUpdate', onUpdate);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'START_SCREEN': return <StartScreen />;
      case 'STARTER_DRAFT': return <StarterDraft />;
      case 'HUB_SCREEN': return <HubScreen />;
      case 'CATCH_SCREEN': return <CatchScreen />;
      case 'BATTLE_SCREEN': return <BattleScreen />;
      case 'TEAM_SCREEN': return <TeamScreen />;
      case 'BOX_SCREEN': return <BoxScreen />;
      case 'BAG_SCREEN': return <BagScreen />;
      case 'POKEDEX_SCREEN': return <PokedexScreen />;
      case 'SHOP_SCREEN': return <ShopScreen />;
      case 'PROFILE_SCREEN': return <ProfileScreen />;
      case 'TRADE_SCREEN': return <TradeScreen />;
      case 'OPTIONS_SCREEN': return <OptionsScreen />;
      default: return <StartScreen />;
    }
  };

  const showNav = ![
    'START_SCREEN', 
    'STARTER_DRAFT', 
    'CATCH_SCREEN', 
    'BATTLE_SCREEN'
  ].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-[#f0f0f0] font-sans overflow-hidden flex flex-col">
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
      {showNav && <BottomNav />}

      {updateAvailable && (
        <div className="fixed left-1/2 bottom-6 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/95 px-4 py-3 shadow-lg shadow-black/30">
            <span className="text-sm font-medium">Nuova versione disponibile</span>
            <button
              className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-emerald-400"
              onClick={() => window.location.reload()}
            >
              Aggiorna
            </button>
            <button
              className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600"
              onClick={() => setUpdateAvailable(false)}
            >
              Più tardi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
