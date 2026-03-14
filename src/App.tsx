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
import TypeBadge from './components/ui/TypeBadge';
import { useTickSystem } from './TickSystem';
import { NotificationService } from './NotificationService';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const { 
    currentScreen, 
    isFirstRun, 
    settings, 
    pendingEvolution, 
    pendingNewMove, 
    team, 
    box, 
    confirmEvolution, 
    dismissEvolution, 
    dismissNewMove, 
    replaceMove 
  } = useStore();
  const { getTimeToNextTick } = useTickSystem();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const getPokemonById = (id: string) => [...team, ...box].find(p => p.id === id);

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

      {/* Modale Nuova Mossa */}
      <AnimatePresence>
        {pendingNewMove && (() => {
          const pkmn = getPokemonById(pendingNewMove.pokemonId);
          if (!pkmn) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-2xl border border-white/10"
              >
                <h2 className="mb-4 text-xl font-bold text-center text-emerald-400">Nuova Mossa!</h2>
                <p className="mb-6 text-center text-slate-300">
                  <span className="font-bold text-white">{pkmn.name}</span> vuole imparare <span className="font-bold text-emerald-400">{pendingNewMove.move.name}</span>! Ma conosce già 4 mosse. Quale vuole dimenticare?
                </p>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {pkmn.moves.map(move => (
                    <button
                      key={move.id}
                      onClick={() => replaceMove(pkmn.id, move.id, pendingNewMove.move)}
                      className="flex items-center justify-between rounded-xl bg-slate-800 p-4 hover:bg-slate-700 transition-colors border border-white/5"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-white">{move.name}</span>
                        <span className="text-xs text-slate-400">Potenza: {move.power || '--'} | Precisione: {move.accuracy || '--'}</span>
                      </div>
                      <TypeBadge type={move.type as any} small />
                    </button>
                  ))}
                </div>

                <button
                  onClick={dismissNewMove}
                  className="w-full rounded-xl bg-slate-700 py-3 font-semibold text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Non imparare
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Modale Evoluzione */}
      <AnimatePresence>
        {pendingEvolution && !pendingNewMove && (() => {
          const pkmn = getPokemonById(pendingEvolution.pokemonId);
          if (!pkmn) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950 p-8 text-center shadow-2xl border border-white/10"
              >
                <h2 className="mb-8 text-2xl font-bold tracking-tight text-white">Evoluzione in corso!</h2>
                
                <div className="mb-8 flex items-center justify-center gap-6">
                  <div className="flex flex-col items-center">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkmn.pokemonId}.png`} 
                      alt={pkmn.name}
                      className="h-24 w-24 object-contain"
                    />
                    <span className="mt-2 text-sm font-medium text-slate-400">{pkmn.name}</span>
                  </div>
                  
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-3xl text-slate-500"
                  >
                    →
                  </motion.div>

                  <div className="flex flex-col items-center">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pendingEvolution.newPokemonId}.png`} 
                      alt={pendingEvolution.newName}
                      className="h-24 w-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                    />
                    <span className="mt-2 text-sm font-bold text-emerald-400">{pendingEvolution.newName}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmEvolution}
                    className="w-full rounded-2xl bg-emerald-500 py-4 font-bold text-slate-900 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all"
                  >
                    EVOLVI!
                  </button>
                  <button
                    onClick={dismissEvolution}
                    className="w-full rounded-2xl bg-slate-800/50 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    Dopo
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

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
