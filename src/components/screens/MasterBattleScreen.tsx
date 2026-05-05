import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { BattleEngine } from '../../BattleEngine';
import { motion } from 'motion/react';
import { ArrowLeft, Lock, Star } from 'lucide-react';
import { MASTER_TRAINERS, MasterTrainer } from '../../data/leagueData';
import GameboyDialog from '../ui/GameboyDialog';
import BattleScreen from './BattleScreen';

type Phase = 'select' | 'intro' | 'battle' | 'win' | 'lose';

const randomIv = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateMasterIvs = () => ({
  hp: randomIv(28, 31),
  attack: randomIv(28, 31),
  defense: randomIv(28, 31),
  spAtk: randomIv(28, 31),
  spDef: randomIv(28, 31),
  speed: randomIv(28, 31),
});
const generateMasterEvs = (baseStats?: { 
  attack: number; spAtk: number; speed: number; 
}) => { 
  if (!baseStats) { 
    // fallback invariato 
    const focusPhysical = Math.random() < 0.5; 
    return focusPhysical 
      ? { hp: 120, attack: 252, defense: 68, spAtk: 0, spDef: 0, speed: 68 } 
      : { hp: 120, attack: 0, defense: 68, spAtk: 252, spDef: 0, speed: 68 }; 
  } 
  const isPhysical = baseStats.attack >= baseStats.spAtk; 
  const needsSpeed = baseStats.speed >= 90; 
  if (isPhysical && needsSpeed) { 
    return { hp: 4, attack: 252, defense: 0, spAtk: 0, spDef: 0, speed: 252 }; 
  } else if (isPhysical) { 
    return { hp: 252, attack: 252, defense: 4, spAtk: 0, spDef: 0, speed: 0 }; 
  } else if (needsSpeed) { 
    return { hp: 4, attack: 0, defense: 0, spAtk: 252, spDef: 0, speed: 252 }; 
  } else { 
    return { hp: 252, attack: 0, defense: 4, spAtk: 252, spDef: 0, speed: 0 }; 
  } 
};

export default function MasterBattleScreen() {
  const {
    setScreen,
    leagueProgress,
    masterBattleTeam,
    setMasterBattleTeam,
    clearMasterBattleTeam,
    masterBattleResult,
    setMasterBattleResult,
    addCoins,
    addItem,
    masterProgress,
    recordMasterWin,
    team,
    updatePokemon,
  } = useStore();

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedTrainer, setSelectedTrainer] = useState<MasterTrainer | null>(null);
  const [builtTeam, setBuiltTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [winRewardText, setWinRewardText] = useState('');
  const [battleStarted, setBattleStarted] = useState(false);

  const hasCompletedFullRun = leagueProgress.completedRuns >= 1;
  const defeatedIds: string[] = masterProgress?.defeatedIds ?? [];

  const handleSelectTrainer = async (trainer: MasterTrainer) => {
    setSelectedTrainer(trainer);
    setLoading(true);
    try {
      const built = await Promise.all(
        trainer.pokemon.map(async (entry) => {
          const data = await api.getPokemon(entry.id);
          const species = await api.getSpecies(entry.id);
          const ivs = generateMasterIvs();
          const evs = generateMasterEvs({ 
            attack: data.stats[1].base_stat, 
            spAtk: data.stats[3].base_stat, 
            speed: data.stats[5].base_stat, 
          }); 
          const baseStats = {
            hp: data.stats[0].base_stat,
            attack: data.stats[1].base_stat,
            defense: data.stats[2].base_stat,
            spAtk: data.stats[3].base_stat,
            spDef: data.stats[4].base_stat,
            speed: data.stats[5].base_stat,
          };
          const stats = BattleEngine.calculateStats(
            entry.level,
            baseStats,
            ivs,
            evs,
            'Quirky'
          );
          const moves = await api.getPokemonMoves(data, entry.level);
          return {
            id: Math.random().toString(36).substr(2, 9),
            pokemonId: entry.id,
            name: api.getItalianName(species.names),
            level: entry.level,
            currentHp: stats.hp,
            maxHp: stats.hp,
            stats,
            baseStats,
            ivs,
            evs,
            nature: 'Quirky',
            moves,
            rawStats: data.stats,
            types: data.types.map((t: any) => t.type.name),
            status: null,
            isShiny: false,
            growthRate: species.growth_rate.name,
            trainerName: trainer.name,
          };
        })
      );
      const { battleTower, abandonBattleTower } = useStore.getState(); 
      if (battleTower?.isActive) abandonBattleTower();

      setBuiltTeam(built);
      setMasterBattleTeam(built);
      setPhase('intro');
    } catch (e) {
      console.error('Errore build master team:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phase !== 'battle') return;
    if (masterBattleResult === 'lose') {
      setMasterBattleResult(null);
      clearMasterBattleTeam();
      setPhase('lose');
      return;
    }
    if (!battleStarted && masterBattleTeam) {
      setBattleStarted(true);
      return;
    }
    if (battleStarted && !masterBattleTeam && (masterBattleResult === 'win' || masterBattleResult === null)) {
      handleBattleWin();
    }
  }, [masterBattleTeam, phase, battleStarted, masterBattleResult]);

  const handleBattleWin = () => {
    if (!selectedTrainer) return;
    addCoins(selectedTrainer.reward.coins);
    useStore.getState().incrementMasterMission();
    Object.entries(selectedTrainer.reward.items).forEach(([id, qty]) => addItem(id, Number(qty)));
    const itemList = Object.entries(selectedTrainer.reward.items)
      .map(([id, qty]) => `${Number(qty)}× ${id.replace(/_/g, ' ')}`)
      .join(', ');
    setWinRewardText(`+${selectedTrainer.reward.coins}¢${itemList ? ' · ' + itemList : ''}`);
    recordMasterWin(selectedTrainer.id);
    clearMasterBattleTeam();
    setPhase('win');
  };

  const handleBattleLose = () => {
    // Recupero HP come nella lega: 10% per attivo, 1 HP per esausti
    const activePokemon = team[0];
    if (activePokemon) {
      const healAmount = Math.floor(activePokemon.stats.hp * 0.1);
      const newHp = Math.min(activePokemon.stats.hp, activePokemon.currentHp + healAmount);
      updatePokemon(activePokemon.id, { currentHp: newHp });
    }
    team.forEach(pokemon => {
      if (pokemon.currentHp === 0) {
        updatePokemon(pokemon.id, { currentHp: 1 });
      }
    });
    clearMasterBattleTeam();
    setPhase('lose');
  };

  // FASE BATTLE — render inline (come LeagueBattleScreen, NON setScreen)
  if (phase === 'battle') {
    return <BattleScreen />;
  }

  if (phase === 'select') {
    return (
      <div className="h-full flex flex-col bg-[#0f0f1a] overflow-hidden">
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => {
                clearMasterBattleTeam();
                setMasterBattleResult(null);
                setScreen('LEAGUE_SELECT_SCREEN');
              }}
              className="p-2 bg-[#1a1a2e] rounded-xl"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-black uppercase flex items-center gap-2">
                <Star size={18} className="text-yellow-400 fill-yellow-400" /> MASTER
              </h2>
              <p className="text-[11px] text-white/40">
                Allenatori leggendari • {defeatedIds.length}/{MASTER_TRAINERS.length} sconfitti
              </p>
            </div>
          </div>

          {!hasCompletedFullRun && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 mb-3">
              <p className="text-yellow-400 font-bold text-xs">
                🔒 Completa tutte e 8 le Leghe almeno una volta per sbloccare la modalità Master!
              </p>
            </div>
          )}

          {hasCompletedFullRun && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl px-4 py-2 mb-3">
              <p className="text-purple-300 font-bold text-xs uppercase tracking-wider">
                ⚡ Pokémon Lv. 86–100 · Ricompense esclusive · Sfide infinite
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6 no-scrollbar">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"
              />
            </div>
          )}
          {!loading && (
            <div className="grid grid-cols-2 gap-3">
              {MASTER_TRAINERS.map((trainer) => {
                const isDefeated = defeatedIds.includes(trainer.id);
                const locked = !hasCompletedFullRun;
                return (
                  <motion.button
                    key={trainer.id}
                    whileTap={{ scale: locked ? 1 : 0.97 }}
                    disabled={locked}
                    onClick={() => !locked && handleSelectTrainer(trainer)}
                    className={`relative bg-gradient-to-b rounded-2xl border p-4 flex flex-col gap-2 transition-all text-left ${
                      locked
                        ? 'from-gray-900/40 to-gray-950/60 border-white/10 opacity-40'
                        : isDefeated
                        ? 'from-yellow-900/30 to-yellow-950/50 border-yellow-500/40'
                        : 'from-purple-900/30 to-purple-950/50 border-purple-500/30 hover:border-purple-400/60'
                    }`}
                  >
                    {locked && <Lock size={12} className="absolute top-2 right-2 text-white/30" />}
                    {isDefeated && !locked && (
                      <span className="absolute top-2 right-2 text-[8px] font-black bg-yellow-400 text-black px-1.5 py-0.5 rounded-full">✓</span>
                    )}

                    <div className="flex items-center gap-3">
                      <img
                        src={`https://play.pokemonshowdown.com/sprites/trainers/${trainer.spriteFile}.png`}
                        alt={trainer.name}
                        className="w-14 h-14 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://play.pokemonshowdown.com/sprites/trainers/unknown.png';
                        }}
                      />
                      <div>
                        <p className="font-black text-sm uppercase">{trainer.name}</p>
                        <p className="text-[9px] text-white/40">
                          Lv. {Math.min(...trainer.pokemon.map((p) => p.level))}–{Math.max(...trainer.pokemon.map((p) => p.level))}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {trainer.pokemon.map((p) => (
                        <img
                          key={p.id}
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                          className="w-9 h-9 object-contain"
                          alt={`#${p.id}`}
                        />
                      ))}
                    </div>

                    <p className="text-[9px] text-white/40">
                      🎁 {trainer.reward.coins}¢ + {Object.entries(trainer.reward.items).map(([id, qty]) => `${qty}× ${id.replace(/_/g, ' ')}`).join(', ')}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'intro' && selectedTrainer) {
    return (
      <GameboyDialog
        key="master-intro"
        lines={selectedTrainer.intro}
        trainerName={selectedTrainer.name}
        trainerSprite={`https://play.pokemonshowdown.com/sprites/trainers/${selectedTrainer.spriteFile}.png`}
        variant="intro"
        onComplete={() => {
          setBattleStarted(false);
          setMasterBattleTeam(builtTeam);
          setPhase('battle');
        }}
      />
    );
  }

  if (phase === 'win' && selectedTrainer) {
    return (
      <GameboyDialog
        key="master-win"
        lines={[...selectedTrainer.win, ...(winRewardText ? [`🎁 ${winRewardText}`] : [])]}
        trainerName={selectedTrainer.name}
        trainerSprite={`https://play.pokemonshowdown.com/sprites/trainers/${selectedTrainer.spriteFile}.png`}
        variant="win"
        onComplete={() => {
          clearMasterBattleTeam();
          setPhase('select');
          setSelectedTrainer(null);
        }}
      />
    );
  }

  if (phase === 'lose' && selectedTrainer) {
    return (
      <GameboyDialog
        key="master-lose"
        lines={selectedTrainer.lose}
        trainerName={selectedTrainer.name}
        trainerSprite={`https://play.pokemonshowdown.com/sprites/trainers/${selectedTrainer.spriteFile}.png`}
        variant="lose"
        onComplete={() => {
          setPhase('select');
          setSelectedTrainer(null);
        }}
      />
    );
  }

  return null;
}
