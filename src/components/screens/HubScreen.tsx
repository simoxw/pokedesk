import React, { useEffect } from 'react';
import { useStore } from '../../store';
import { useTickSystem } from '../../TickSystem';
import { api } from '../../api';
import { motion } from 'motion/react';
import { Zap, Target, Sword } from 'lucide-react';

export default function HubScreen() {
  const { charges, setScreen, team, updatePokemon, consumeCharge, currentBattlePath } = useStore();
  const { getTimeToNextTick } = useTickSystem();

  useEffect(() => {
    const fixMoves = async () => {
      for (const pokemon of team) {
        if (pokemon.moves.length === 0) {
          try {
            const data = await api.getPokemon(pokemon.pokemonId);
            const moves = await api.getPokemonMoves(data, pokemon.level);
            updatePokemon(pokemon.id, { moves });
          } catch (e) {
            console.error("Failed to fix moves for", pokemon.name, e);
          }
        }
      }
    };
    fixMoves();
  }, [team, updatePokemon]);
  
  const nextTick = getTimeToNextTick();
  const minutes = Math.floor(nextTick / 60000);
  const seconds = Math.floor((nextTick % 60000) / 1000);

  return (
    <div className="h-full relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Cosmic Background */}
      <div className="absolute inset-0 bg-[#0f0f1a]">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 via-transparent to-rose-900/20" />
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl font-black text-white flex items-center justify-center gap-2"
          >
            {charges}<span className="text-[#e63946]">/6</span>
            <Zap className="text-yellow-400 fill-yellow-400" size={48} />
          </motion.div>
          <p className="text-white/50 font-mono mt-4">
            {charges >= 6
              ? '⚡ CARICHE AL MASSIMO!'
              : `PROSSIMA CARICA IN ${minutes}:${seconds.toString().padStart(2, '0')}`}
          </p>
        </div>

        {/* Progresso verso Capopalestra */} 
        <div className="w-full max-w-sm"> 
          {currentBattlePath.nextIsBoss ? ( 
            <motion.div 
              animate={{ scale: [1, 1.03, 1] }} 
              transition={{ duration: 1.5, repeat: Infinity }} 
              className="bg-yellow-500/10 border border-yellow-500/40 rounded-2xl px-4 py-3 text-center" 
            > 
              <p className="text-yellow-400 font-black text-sm uppercase tracking-widest"> 
                ⚔️ CAPOPALESTRA DISPONIBILE! 
              </p> 
              <p className="text-yellow-300/60 text-[10px] mt-1">La prossima lotta è contro il Capopalestra</p> 
            </motion.div> 
          ) : ( 
            <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl px-4 py-3"> 
              <div className="flex justify-between items-center mb-2"> 
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Progresso Palestra</span> 
                <span className="text-[10px] font-bold text-white/60"> 
                  {currentBattlePath.battlesWon % 15}/15 
                </span> 
              </div> 
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden"> 
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                  animate={{ width: `${((currentBattlePath.battlesWon % 15) / 15) * 100}%` }} 
                  transition={{ duration: 0.5 }} 
                /> 
              </div> 
              <p className="text-[10px] text-white/30 mt-1.5 text-center"> 
                {15 - (currentBattlePath.battlesWon % 15)} battaglie al prossimo Capopalestra 
              </p> 
            </div> 
          )} 
        </div> 

        {/* Team Preview */}
        {team.length > 0 && (
          <div className="w-full max-w-sm bg-[#1a1a2e]/60 backdrop-blur-md rounded-2xl p-3 border border-white/5">
            <div className="flex justify-around gap-2">
              {team.map(pkmn => (
                <div key={pkmn.id} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div className="relative">
                    <img 
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkmn.pokemonId}.png`} 
                      alt={pkmn.name}
                      className="w-10 h-10 object-contain"
                    />
                    {pkmn.status && (
                      <span className={`absolute -top-1 -right-1 text-[7px] font-black px-1 py-0.5 rounded shadow-sm ${
                        pkmn.status === 'SLP' ? 'bg-purple-500' :
                        pkmn.status === 'PSN' ? 'bg-purple-700' :
                        pkmn.status === 'BRN' ? 'bg-orange-500' :
                        pkmn.status === 'PAR' ? 'bg-yellow-400 text-black' :
                        pkmn.status === 'FRZ' ? 'bg-blue-400' : ''
                      }`}>{pkmn.status}</span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase truncate w-full text-center text-white/70">
                    {pkmn.name.slice(0, 8)}
                  </span>
                  <div className="w-full bg-white/10 rounded-full h-[3px] mt-0.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        (pkmn.currentHp / pkmn.stats.hp) > 0.5 ? 'bg-emerald-400' : 
                        (pkmn.currentHp / pkmn.stats.hp) > 0.2 ? 'bg-yellow-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${(pkmn.currentHp / pkmn.stats.hp) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={charges === 0}
            onClick={() => {
              consumeCharge();
              setScreen('CATCH_SCREEN');
            }}
            className="w-full bg-[#e63946] disabled:opacity-50 disabled:grayscale p-6 rounded-3xl flex items-center justify-center gap-4 shadow-2xl shadow-[#e63946]/30"
          >
            <Target size={32} />
            <span className="text-2xl font-black">CATTURA</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen('BATTLE_SCREEN')}
            className="w-full bg-[#1a1a2e] border border-white/10 p-6 rounded-3xl flex items-center justify-center gap-4 shadow-xl"
          >
            <Sword size={32} />
            <span className="text-2xl font-black">LOTTA</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
