import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import StartScreen from './components/screens/StartScreen';
import StarterDraft from './components/screens/StarterDraft';
import HubScreen from './components/screens/HubScreen';
import CatchScreen from './components/screens/CatchScreen';
import SafariScreen from './components/screens/SafariScreen';
import BattleScreen from './components/screens/BattleScreen';
import TeamScreen from './components/screens/TeamScreen';
import BoxScreen from './components/screens/BoxScreen';
import BagScreen from './components/screens/BagScreen';
import PokedexScreen from './components/screens/PokedexScreen';
import ShopScreen from './components/screens/ShopScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import TradeScreen from './components/screens/TradeScreen';
import FriendBattleScreen from './components/screens/FriendBattleScreen';
import LeagueSelectScreen from './components/screens/LeagueSelectScreen';
import LeagueBattleScreen from './components/screens/LeagueBattleScreen';
import MasterBattleScreen from './components/screens/MasterBattleScreen';
import IslandScreen from './components/screens/IslandScreen';
import OptionsScreen from './components/screens/OptionsScreen';
import AchievementScreen from './components/screens/AchievementScreen';
import BottomNav from './components/ui/BottomNav';
import TypeBadge from './components/ui/TypeBadge';
import { useTickSystem } from './TickSystem';
import { audioService } from './AudioService';
import FloatingMuteButton from './components/ui/FloatingMuteButton';
import { NotificationService } from './NotificationService';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';

export default function App() {
  const { 
    currentScreen, 
    isFirstRun, 
    settings,
    pendingMedalUnlock,
    pendingEvolution, 
    team, 
    box, 
    confirmEvolution, 
    dismissEvolution, 
    dismissNewMove, 
    dismissMedalUnlock,
    replaceMove,
    pendingMissionToast,
    dismissMissionToast,
  } = useStore();
  const pendingNewMoveQueue = useStore(state => state.pendingNewMoveQueue);
  const pendingNewMove = pendingNewMoveQueue?.[0] ?? null;
  const { getTimeToNextTick } = useTickSystem();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const getPokemonById = (id: string) => [...team, ...box].find(p => p.id === id);
  const [confirmForget, setConfirmForget] = useState<{ moveId: string; moveName: string } | null>(null);

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

  useEffect(() => {
    if (!pendingMedalUnlock) return;
    confetti({
      particleCount: 200,
      spread: 120,
      startVelocity: 50,
      origin: { y: 0.4 },
      colors: ['#f59e0b', '#f43f5e', '#22d3ee', '#a855f7', '#34d399']
    });
  }, [pendingMedalUnlock]);

  useEffect(() => {
    if (!pendingMissionToast) return;
    const t = setTimeout(() => dismissMissionToast(), 3000);
    return () => clearTimeout(t);
  }, [pendingMissionToast]);

  useEffect(() => {
    audioService.setEnabled(settings.audio);
  }, [settings.audio]);

  useEffect(() => {
    const battleScreens = ['BATTLE_SCREEN','FRIEND_BATTLE_SCREEN','LEAGUE_BATTLE_SCREEN','MASTER_BATTLE_SCREEN'];
    const catchScreens = ['CATCH_SCREEN','SAFARI_SCREEN'];
    if (battleScreens.includes(currentScreen)) {
      audioService.playMusic('battle');
    } else if (catchScreens.includes(currentScreen)) {
      audioService.playMusic('catch');
    } else if (currentScreen === 'ISLAND_SCREEN') {
      audioService.playMusic('island');
    } else {
      audioService.playMusic('main');
    }
  }, [currentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'START_SCREEN': return <StartScreen />;
      case 'STARTER_DRAFT': return <StarterDraft />;
      case 'HUB_SCREEN': return <HubScreen />;
      case 'CATCH_SCREEN': return <CatchScreen />;
      case 'SAFARI_SCREEN': return <SafariScreen />;
      case 'BATTLE_SCREEN': return <BattleScreen />;
      case 'TEAM_SCREEN': return <TeamScreen />;
      case 'BOX_SCREEN': return <BoxScreen />;
      case 'BAG_SCREEN': return <BagScreen />;
      case 'POKEDEX_SCREEN': return <PokedexScreen />;
      case 'SHOP_SCREEN': return <ShopScreen />;
      case 'PROFILE_SCREEN': return <ProfileScreen />;
      case 'TRADE_SCREEN': return <TradeScreen />;
      case 'OPTIONS_SCREEN': return <OptionsScreen />;
      case 'FRIEND_BATTLE_SCREEN': return <FriendBattleScreen />;
      case 'LEAGUE_SELECT_SCREEN': return <LeagueSelectScreen />;
      case 'LEAGUE_BATTLE_SCREEN': return <LeagueBattleScreen />;
      case 'MASTER_BATTLE_SCREEN': return <MasterBattleScreen />;
      case 'ISLAND_SCREEN': return <IslandScreen />;
      case 'ACHIEVEMENT_SCREEN': return <AchievementScreen />;
      default: return <StartScreen />;
    }
  };

  const showNav = ![
    'START_SCREEN', 
    'STARTER_DRAFT', 
    'CATCH_SCREEN', 
    'SAFARI_SCREEN',
    'BATTLE_SCREEN',
    'FRIEND_BATTLE_SCREEN',
    'LEAGUE_BATTLE_SCREEN',
    'MASTER_BATTLE_SCREEN'
  ].includes(currentScreen);

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-[#f0f0f0] font-sans overflow-hidden flex flex-col">
      <main className="flex-1 relative">
        <AnimatePresence mode="sync">
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

      {/* Toast missione completata */}
      <AnimatePresence>
        {pendingMissionToast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-4 right-4 z-[200] flex items-center gap-3 bg-yellow-500/90 backdrop-blur-sm text-black px-4 py-3 rounded-2xl shadow-2xl"
          >
            <span className="text-xl">✅</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm">Missione completata!</p>
              <p className="text-[11px] font-bold opacity-70 truncate">{pendingMissionToast}</p>
            </div>
            <button onClick={dismissMissionToast} className="text-black/50 font-black text-lg leading-none">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

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
                
                {/* Card nuova mossa */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-4">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">
                    Nuova mossa
                  </p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-white text-sm uppercase">{pendingNewMove.move.name}</span>
                    <TypeBadge type={pendingNewMove.move.type as any} small />
                  </div>
                  <div className="flex gap-3 text-[11px] font-bold">
                    <span className={
                      pendingNewMove.move.category === 'physical' ? 'text-orange-400' :
                      pendingNewMove.move.category === 'special' ? 'text-purple-400' :
                      'text-slate-400'
                    }>
                      {pendingNewMove.move.category === 'physical' ? '⚔️ Fisico' :
                       pendingNewMove.move.category === 'special' ? '✨ Speciale' : '💫 Stato'}
                    </span>
                    <span className="text-white/50">POT: {pendingNewMove.move.power || '--'}</span>
                    <span className="text-white/50">ACC: {pendingNewMove.move.accuracy || '--'}%</span>
                    <span className="text-white/50">PP: {pendingNewMove.move.pp}</span>
                  </div>
                  {pendingNewMove.move.description && (
                    <p className="text-[10px] text-white/40 mt-2 italic leading-relaxed">
                      {pendingNewMove.move.description}
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 text-center mb-3">
                  Scegli quale mossa dimenticare:
                </p>

                <div className="grid grid-cols-1 gap-2 mb-4">
                  {pkmn.moves.map(move => (
                    <button
                      key={move.id}
                      onClick={() => {
                        if (confirmForget?.moveId === move.id) {
                          replaceMove(pkmn.id, move.id, pendingNewMove.move);
                          setConfirmForget(null);
                        } else {
                          setConfirmForget({ moveId: move.id, moveName: move.name });
                        }
                      }}
                      className={`flex items-center justify-between rounded-xl p-3 transition-colors border ${
                        confirmForget?.moveId === move.id
                          ? 'bg-red-500/20 border-red-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 border-white/5'
                      }`}
                    >
                      <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-xs uppercase">{move.name}</span>
                          <TypeBadge type={move.type as any} small />
                        </div>
                        <div className="flex gap-3 text-[10px] font-bold">
                          <span className={
                            move.category === 'physical' ? 'text-orange-400' :
                            move.category === 'special' ? 'text-purple-400' :
                            'text-slate-400'
                          }>
                            {move.category === 'physical' ? '⚔️ Fis.' :
                             move.category === 'special' ? '✨ Sp.' : '💫 Stato'}
                          </span>
                          <span className="text-white/40">POT: {move.power || '--'}</span>
                          <span className="text-white/40">ACC: {move.accuracy || '--'}%</span>
                          <span className="text-white/40">PP: {move.pp}/{move.maxPp}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black ml-2 shrink-0 ${
                        confirmForget?.moveId === move.id ? 'text-red-300' : 'text-red-400'
                      }`}>
                        {confirmForget?.moveId === move.id ? '⚠️ CONFERMA' : 'DIMENTICA'}
                      </span>
                    </button>
                  ))}
                  {confirmForget && (
                    <p className="text-[10px] text-red-400/70 text-center italic">
                      Tocca di nuovo "{confirmForget.moveName}" per confermare che venga dimenticata.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => { dismissNewMove(); setConfirmForget(null); }}
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

      {/* Modale Medaglia Sbloccata */}
      <AnimatePresence>
        {pendingMedalUnlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950 p-6 text-center shadow-2xl border border-white/10"
            >
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-2">Medaglia conquistata!</h2>
              <p className="text-sm text-white/70 mb-5">{pendingMedalUnlock.name}</p>
              <div className="flex justify-center gap-2 mb-6">
                <TypeBadge type={pendingMedalUnlock.type as any} small />
                <span className="text-xs text-white/70">#{pendingMedalUnlock.id + 1}</span>
              </div>
              <button
                onClick={dismissMedalUnlock}
                className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-slate-900 hover:bg-emerald-400 transition-colors"
              >
                RITIRA
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingMuteButton />

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
