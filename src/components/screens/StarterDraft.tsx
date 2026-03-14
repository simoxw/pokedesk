import React, { useState } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Pokemon, Stats, Move } from '../../types';
import { CatchEngine } from '../../CatchEngine';
import { BattleEngine } from '../../BattleEngine';

const STARTER_IDS = [1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393];

export default function StarterDraft() {
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const { setPlayer, addPokemon, setScreen } = useStore();

  const toggleSelect = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  const handleConfirm = async () => {
    if (selected.length !== 3) return;
    setLoading(true);

    try {
      for (const id of selected) {
        const data = await api.getPokemon(id);
        const species = await api.getSpecies(id);
        
        const ivs = CatchEngine.generateIVs();
        const nature = CatchEngine.getNature();
        
        const baseStats = {
          hp: data.stats[0].base_stat,
          attack: data.stats[1].base_stat,
          defense: data.stats[2].base_stat,
          spAtk: data.stats[3].base_stat,
          spDef: data.stats[4].base_stat,
          speed: data.stats[5].base_stat,
        };

        const stats = BattleEngine.calculateStats(5, baseStats, ivs, { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, nature);
        const moves = await api.getPokemonMoves(data, 5);
        const baseSpeciesId = await api.getBaseSpeciesId(species);

        const startExp = (() => { 
          switch (species.growth_rate.name) { 
            case 'slow': return Math.floor(5 * 5 ** 3 / 4); 
            case 'medium-slow': return Math.max(0, Math.floor(6/5 * 125 - 15*25 + 100*5 - 140)); 
            case 'fast': return Math.floor(4 * 5 ** 3 / 5); 
            default: return Math.floor(5 ** 3); // 125 
          } 
        })(); 
        const pokemon: Pokemon = {
          id: Math.random().toString(36).substr(2, 9),
          pokemonId: id,
          name: api.getItalianName(species.names),
          level: 5,
          exp: startExp,
          types: data.types.map((t: any) => t.type.name),
          baseStats,
          ivs,
          evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
          stats,
          nature,
          moves,
          currentHp: stats.hp,
          status: null,
          isShiny: false,
          caughtAt: Date.now(),
          growthRate: species.growth_rate.name,
          baseSpeciesId,
        };
        addPokemon(pokemon);
      }
      setPlayer("Allenatore", "M");
      setScreen('HUB_SCREEN');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[#0f0f1a]">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold">Scegli 3 Starter</h2>
        <p className="text-white/50">Inizia la tua avventura con un team bilanciato</p>
      </div>

      <div className="grid grid-cols-3 gap-4 overflow-y-auto flex-1 pb-24">
        {STARTER_IDS.map(id => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleSelect(id)}
            className={`relative aspect-square rounded-2xl p-2 flex flex-col items-center justify-center transition-all ${
              selected.includes(id) 
                ? 'bg-[#e63946] ring-4 ring-[#e63946]/30' 
                : 'bg-[#1a1a2e] border border-white/5'
            }`}
          >
            <img 
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
              alt="starter"
              className="w-full h-auto"
            />
            {selected.includes(id) && (
              <div className="absolute top-2 right-2 bg-white text-[#e63946] rounded-full p-1">
                <Check size={12} strokeWidth={4} />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="fixed bottom-6 left-6 right-6">
        <button
          disabled={selected.length !== 3 || loading}
          onClick={handleConfirm}
          className="w-full bg-[#e63946] disabled:opacity-50 disabled:grayscale py-4 rounded-2xl font-bold text-lg shadow-xl"
        >
          {loading ? "Caricamento..." : `CONFERMA (${selected.length}/3)`}
        </button>
      </div>
    </div>
  );
}
