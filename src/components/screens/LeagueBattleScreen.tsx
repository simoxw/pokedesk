import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { BattleEngine } from '../../BattleEngine';
import { CatchEngine } from '../../CatchEngine';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import {
  LEAGUE_REGIONS,
  scaleLeagueLevel,
  LeagueTrainer,
} from '../../data/leagueData';
import GameboyDialog from '../ui/GameboyDialog';
import BattleScreen from './BattleScreen';

type Phase = 'intro' | 'battle' | 'win' | 'lose' | 'region_complete';

export default function LeagueBattleScreen() {
  const {
    setScreen,
    leagueProgress,
    advanceLeagueTrainer,
    completeLeagueRegion,
    abandonLeagueRun,
    addCoins,
    addItem,
    medals,
    team,
    updatePokemon,
    leagueBattleTeam,
    setLeagueBattleTeam,
    clearLeagueBattleTeam,
  } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [loading, setLoading] = useState(true);
  const [builtTeam, setBuiltTeam] = useState<any[]>([]);

  const run = leagueProgress.currentRun;
  if (!run) {
    setScreen('LEAGUE_SELECT_SCREEN');
    return null;
  }

  const region = LEAGUE_REGIONS.find(r => r.id === run.regionId);
  if (!region) {
    setScreen('LEAGUE_SELECT_SCREEN');
    return null;
  }

  const trainerIndex = run.trainerIndex;
  const isChampion = trainerIndex >= region.elite4.length;
  const trainer: LeagueTrainer = isChampion
    ? region.champion
    : region.elite4[trainerIndex];

  const completedRuns = leagueProgress.completedRuns;

  // Costruisce il team del trainer fetchando i dati da PokeAPI
  useEffect(() => {
    const buildTeam = async () => {
      setLoading(true);
      setPhase('intro');
      try {
        const built = await Promise.all(
          trainer.pokemon.map(async entry => {
            const scaledLevel = scaleLeagueLevel(entry.level, completedRuns);
            const data = await api.getPokemon(entry.id);
            const species = await api.getSpecies(entry.id);
            const ivs = CatchEngine.generateIVs();
            const baseStats = {
              hp:      data.stats[0].base_stat,
              attack:  data.stats[1].base_stat,
              defense: data.stats[2].base_stat,
              spAtk:   data.stats[3].base_stat,
              spDef:   data.stats[4].base_stat,
              speed:   data.stats[5].base_stat,
            };
            const stats = BattleEngine.calculateStats(
              scaledLevel, baseStats, ivs,
              { hp:0, attack:0, defense:0, spAtk:0, spDef:0, speed:0 },
              'Quirky'
            );
            const moves = await api.getPokemonMoves(data, scaledLevel);
            return {
              id: Math.random().toString(36).substr(2, 9),
              pokemonId: entry.id,
              name: api.getItalianName(species.names),
              level: scaledLevel,
              currentHp: stats.hp,
              maxHp: stats.hp,
              stats,
              baseStats,
              ivs,
              evs: { hp:0, attack:0, defense:0, spAtk:0, spDef:0, speed:0 },
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
        setBuiltTeam(built);
      } catch (e) {
        console.error('Errore build team lega:', e);
      } finally {
        setLoading(false);
      }
    };
    buildTeam();
  }, [trainer.id]);

  // Quando arriva in fase battle, inietta il team nel friendBattleTeam
  useEffect(() => {
    if (phase === 'battle' && builtTeam.length > 0) {
      setLeagueBattleTeam(builtTeam);
    }
  }, [phase, builtTeam]);

  // Monitora la fine della battaglia leggendo friendBattleTeam
  // BattleScreen chiama clearFriendBattleTeam alla fine
  // Usiamo un listener sul fatto che friendBattleTeam diventa null
  const [battleStarted, setBattleStarted] = useState(false);

  useEffect(() => {
    if (phase !== 'battle') return;
    if (!battleStarted && leagueBattleTeam) {
      setBattleStarted(true);
      return;
    }
    if (battleStarted && !leagueBattleTeam) {
      const playerAlive = useStore.getState().team.some(p => p.currentHp > 0);
      if (playerAlive) {
        handleBattleWin();
      } else {
        handleBattleLose();
      }
    }
  }, [leagueBattleTeam, phase, battleStarted]);

  const handleBattleWin = () => {
    // Ricompensa trainer
    addCoins(trainer.reward.coins);
    Object.entries(trainer.reward.items).forEach(([id, qty]) => addItem(id, qty));
    setPhase('win');
  };

  const handleBattleLose = () => {
    setPhase('lose');
  };

  const handleWinDialogComplete = () => {
    const nextIndex = trainerIndex + 1;
    const totalTrainers = region.elite4.length + 1; // +1 campione

    if (nextIndex >= totalTrainers) {
      // Completata la regione
      completeLeagueRegion(region.id, region.completionReward.trophyLabel);
      addCoins(region.completionReward.coins);
      Object.entries(region.completionReward.items).forEach(([id, qty]) =>
        addItem(id, qty)
      );
      setPhase('region_complete');
    } else {
      advanceLeagueTrainer(trainerIndex);
      setScreen('HUB_SCREEN');
    }
  };

  const handleLoseDialogComplete = () => {
    abandonLeagueRun();
    setScreen('HUB_SCREEN');
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0f0f1a] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full"
        />
        <p className="text-white/50 font-bold text-sm">
          Preparazione battaglia con {trainer.name}...
        </p>
      </div>
    );
  }

  // FASE BATTLE — mostra BattleScreen direttamente
  if (phase === 'battle') {
    return <BattleScreen />;
  }

  return (
    <AnimatePresence mode="wait">

      {/* INTRO */}
      {phase === 'intro' && (
        <GameboyDialog
          key="intro"
          lines={trainer.intro}
          trainerName={`${trainer.title} — ${trainer.name}`}
          trainerSprite={trainer.spriteUrl}
          variant="intro"
          onComplete={() => {
            setBattleStarted(false);
            setPhase('battle');
          }}
        />
      )}

      {/* WIN */}
      {phase === 'win' && (
        <GameboyDialog
          key="win"
          lines={trainer.win}
          trainerName={trainer.name}
          trainerSprite={trainer.spriteUrl}
          variant="win"
          onComplete={handleWinDialogComplete}
        />
      )}

      {/* LOSE */}
      {phase === 'lose' && (
        <GameboyDialog
          key="lose"
          lines={trainer.lose}
          trainerName={trainer.name}
          trainerSprite={trainer.spriteUrl}
          variant="lose"
          onComplete={handleLoseDialogComplete}
        />
      )}

      {/* REGION COMPLETE */}
      {phase === 'region_complete' && (
        <motion.div
          key="complete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] bg-gradient-to-b from-yellow-950 to-black flex flex-col items-center justify-center p-6 gap-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-8xl"
          >
            🏆
          </motion.div>

          <div className="text-center">
            <h2 className="text-3xl font-black text-yellow-400 mb-2">
              {region.completionReward.trophyLabel}
            </h2>
            <p className="text-white/70 text-sm">
              Hai conquistato la Lega di {region.name}!
            </p>
          </div>

          {/* Ricompense */}
          <div className="bg-white/5 border border-yellow-500/30 rounded-2xl p-4 w-full max-w-xs">
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-3">
              🎁 Ricompense
            </p>
            <div className="space-y-1 text-sm text-white/80">
              <p>💰 +{region.completionReward.coins} monete</p>
              {Object.entries(region.completionReward.items).map(([id, qty]) => (
                <p key={id}>✦ {qty}x {id.replace('_', ' ')}</p>
              ))}
            </div>
          </div>

          {/* Prossime regioni disponibili */}
          {leagueProgress.completedRegions.length < 8 && (
            <p className="text-white/40 text-xs text-center italic">
              {8 - leagueProgress.completedRegions.length} regioni ancora da conquistare
            </p>
          )}

          {leagueProgress.completedRegions.length === 8 && (
            <p className="text-yellow-400 font-black text-sm text-center">
              🌟 HAI CONQUISTATO TUTTE LE LEGHE!
            </p>
          )}

          <button
            onClick={() => setScreen('HUB_SCREEN')}
            className="w-full max-w-xs bg-yellow-500 text-black py-4 rounded-2xl font-black text-lg"
          >
            TORNA ALL'HUB
          </button>
        </motion.div>
      )}

    </AnimatePresence>
  );
}