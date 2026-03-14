import React, { useEffect } from 'react';
import { useStore } from '../../store';
import { useTickSystem } from '../../TickSystem';
import { api } from '../../api';
import { motion } from 'motion/react';
import { Zap, Target, Sword } from 'lucide-react';

export default function HubScreen() {
  const { charges, setScreen, team, updatePokemon, consumeCharge } = useStore();
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
            PROSSIMA CARICA IN {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
        </div>

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
