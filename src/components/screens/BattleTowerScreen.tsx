import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { TOWER_MILESTONES } from '../../services/battleTowerService';
import { ChevronLeft, ChevronDown, ChevronUp, Trophy, Info, AlertTriangle, Gift, Play } from 'lucide-react';

const BattleTowerScreen: React.FC = () => {
  const { setScreen, battleTower, team, startBattleTower, abandonBattleTower } = useStore();
  const [showMilestones, setShowMilestones] = useState(false);

  const handleStart = () => {
    if (team.length === 0) return;
    if (!battleTower.isActive) {
      startBattleTower();
    }
    setScreen('BATTLE_SCREEN');
  };

  const handleAbandon = () => {
    if (window.confirm("Vuoi davvero abbandonare la scalata? Perderai i progressi attuali (ma non il record).")) {
      abandonBattleTower();
    }
  };

  const isAnyPokemonDamaged = team.some(p => p.currentHp < p.stats.hp);

  return (
    <div className="min-h-screen bg-[#0f0f1e] text-white p-4 pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setScreen('START_SCREEN')}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-red-500">🗼</span> TORRE LOTTA
          </h1>
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
            Record personale: {battleTower.bestFloor > 0 ? `Piano ${battleTower.bestFloor}` : '—'}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Elite Mode Warning */}
        {(battleTower.bestFloor >= 24 || battleTower.currentFloor >= 25) && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-xs font-medium text-yellow-500/80 leading-relaxed">
              <span className="font-black">⚡ MODALITÀ ELITE:</span> Dal piano 25 affronterai squadre da 4 Pokémon al Lv.100 con EV ottimizzati.
            </p>
          </div>
        )}

        {/* Team Preview */}
        <div className="bg-[#1a1a2e] border border-white/5 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-black text-white/40 uppercase tracking-widest">La tua squadra</h2>
            <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-full text-white/60">
              {team.length}/4 Pokémon
            </span>
          </div>

          {team.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-bold text-red-500/60 uppercase">Squadra vuota!</p>
              <p className="text-[10px] text-white/20 mt-1">Aggiungi Pokémon dal Box per iniziare</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {team.map((p) => (
                <div key={p.id} className="bg-white/5 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`} 
                      alt={p.name}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase truncate">{p.name}</p>
                    <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          (p.currentHp / p.stats.hp) > 0.5 ? 'bg-green-500' : 
                          (p.currentHp / p.stats.hp) > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(p.currentHp / p.stats.hp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAnyPokemonDamaged && (
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              <p className="text-[10px] font-bold text-orange-500/80 uppercase">
                Il team non viene curato all'ingresso
              </p>
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="bg-white/5 rounded-3xl p-5 space-y-3">
          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest">Regole della torre</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-[11px] font-medium text-white/60">
              <div className="w-1 h-1 rounded-full bg-red-500" />
              Nessuna cura tra i piani
            </li>
            <li className="flex items-center gap-3 text-[11px] font-medium text-white/60">
              <div className="w-1 h-1 rounded-full bg-red-500" />
              Gli HP persistono tra le battaglie
            </li>
            <li className="flex items-center gap-3 text-[11px] font-medium text-white/60">
              <div className="w-1 h-1 rounded-full bg-red-500" />
              Piano 25+: squadre complete Lv.100
            </li>
          </ul>
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          <button 
            onClick={() => setShowMilestones(!showMilestones)}
            className="w-full bg-[#1a1a2e] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-[#252545] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-red-500" />
              <span className="text-sm font-black uppercase tracking-tight">Premi per piano</span>
            </div>
            {showMilestones ? <ChevronUp className="w-5 h-5 text-white/20" /> : <ChevronDown className="w-5 h-5 text-white/20" />}
          </button>

          <AnimatePresence>
            {showMilestones && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#1a1a2e]/50 border border-white/5 rounded-2xl p-4 space-y-3 max-h-64 overflow-y-auto no-scrollbar">
                  {Object.entries(TOWER_MILESTONES).map(([floor, reward]) => {
                    const isClaimed = battleTower.claimedFloorRewards.includes(Number(floor));
                    return (
                      <div 
                        key={floor} 
                        className={`flex items-center justify-between p-3 rounded-xl bg-white/5 ${isClaimed ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black">{reward.label}</span>
                          {isClaimed && <span className="text-green-500 text-xs font-bold">✓</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold">
                          <span className="text-yellow-400">{reward.coins}💰</span>
                          {Object.entries(reward.items).map(([id, qty]) => (
                            <span key={id} className="text-white/60 uppercase">{qty}x {id.replace('_', ' ')}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Start / Continue Button */}
        <div className="space-y-3">
          <button
            onClick={handleStart}
            disabled={team.length === 0}
            className={`w-full py-5 rounded-3xl font-black text-lg tracking-tight flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${
              team.length === 0 
                ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' 
                : 'bg-[#e63946] text-white shadow-red-500/20 hover:bg-[#ff4d5a]'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            {battleTower.isActive 
              ? `CONTINUA (Piano ${battleTower.currentFloor})` 
              : battleTower.bestFloor > 0 ? "NUOVO TENTATIVO" : "INIZIA"}
          </button>

          {battleTower.isActive && (
            <button
              onClick={handleAbandon}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white/30 hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
            >
              ABBANDONA SCALATA
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleTowerScreen;
