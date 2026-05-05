import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, CheckCircle, Circle, Award, Sparkles, Zap, Target, Swords, TreePine, ArrowLeft } from 'lucide-react';
import PokemonSprite from '../ui/PokemonSprite';
import { MEGA_IDS } from '../../data/legendaryIds';

const ACHIEVEMENTS_DATA = [
  // CATTURE
  {
    id: 'catch_10',
    name: 'Primo Passo',
    description: 'Cattura 10 Pokémon',
    category: 'catch' as const,
    target: 10,
    reward: { coins: 500 }
  },
  {
    id: 'catch_100',
    name: 'Cacciatore Esperto',
    description: 'Cattura 100 Pokémon',
    category: 'catch' as const,
    target: 100,
    reward: { coins: 5000 }
  },
  {
    id: 'catch_500',
    name: 'Maestro Catture',
    description: 'Cattura 500 Pokémon',
    category: 'catch' as const,
    target: 500,
    reward: { coins: 20000, items: { masterball: 1 } }
  },
  
  // BATTAGLIE
  {
    id: 'battle_10',
    name: 'Guerriero',
    description: 'Vinci 10 battaglie',
    category: 'battle' as const,
    target: 10,
    reward: { coins: 1000 }
  },
  {
    id: 'battle_50',
    name: 'Campione',
    description: 'Vinci 50 battaglie',
    category: 'battle' as const,
    target: 50,
    reward: { coins: 5000 }
  },
  {
    id: 'battle_100',
    name: 'Leggenda',
    description: 'Vinci 100 battaglie',
    category: 'battle' as const,
    target: 100,
    reward: { coins: 10000, items: { rare_candy: 5 } }
  },
  
  // SHINY
  {
    id: 'shiny_1',
    name: 'Scintilla',
    description: 'Cattura 1 Shiny',
    category: 'shiny' as const,
    target: 1,
    reward: { coins: 2000 }
  },
  {
    id: 'shiny_10',
    name: 'Shiny Hunter',
    description: 'Cattura 10 Shiny',
    category: 'shiny' as const,
    target: 10,
    reward: { coins: 15000, items: { masterball: 1 } }
  },
  {
    id: 'shiny_50',
    name: 'Cacciatore di Stelle',
    description: 'Cattura 50 Shiny',
    category: 'shiny' as const,
    target: 50,
    reward: { coins: 50000, title: 'Shiny Hunter' }
  },
  
  // POKEDEX
  {
    id: 'pokedex_gen1',
    name: 'Professor Kanto',
    description: 'Completa il Pokédex Gen 1',
    category: 'collection' as const,
    target: 151,
    reward: { coins: 10000, items: { rare_candy: 3 } }
  },
  {
    id: 'pokedex_gen2',
    name: 'Professor Johto',
    description: 'Completa il Pokédex Gen 2',
    category: 'collection' as const,
    target: 100,
    reward: { coins: 10000, items: { rare_candy: 3 } }
  },
  {
    id: 'pokedex_all',
    name: 'Professor Pokémon',
    description: 'Completa tutti i Pokédex',
    category: 'collection' as const,
    target: 1025,
    reward: { coins: 50000, title: 'Professor' }
  },
  { id: 'col_gen3', name: 'Esploratore Hoenn', description: 'Cattura 50 Pokémon di Gen 3', category: 'collection' as const, target: 50, reward: { coins: 3000, items: { rare_candy: 2 } } },
  { id: 'col_gen3_full', name: 'Maestro Hoenn', description: 'Cattura tutti i 135 Pokémon di Gen 3', category: 'collection' as const, target: 135, reward: { coins: 10000, items: { rare_candy: 3, masterball: 1 } } },
  { id: 'col_gen4', name: 'Esploratore Sinnoh', description: 'Cattura 50 Pokémon di Gen 4', category: 'collection' as const, target: 50, reward: { coins: 3000, items: { rare_candy: 2 } } },
  { id: 'col_gen4_full', name: 'Maestro Sinnoh', description: 'Cattura tutti i 107 Pokémon di Gen 4', category: 'collection' as const, target: 107, reward: { coins: 10000, items: { rare_candy: 3, masterball: 1 } } },
  { id: 'col_gen5', name: 'Esploratore Unima', description: 'Cattura 50 Pokémon di Gen 5', category: 'collection' as const, target: 50, reward: { coins: 4000, items: { rare_candy: 2 } } },
  { id: 'col_gen5_full', name: 'Maestro Unima', description: 'Cattura tutti i 156 Pokémon di Gen 5', category: 'collection' as const, target: 156, reward: { coins: 12000, items: { rare_candy: 4, masterball: 1 } } },
  { id: 'col_gen6', name: 'Esploratore Kalos', description: 'Cattura 30 Pokémon di Gen 6', category: 'collection' as const, target: 30, reward: { coins: 4000, items: { rare_candy: 2 } } },
  { id: 'col_gen6_full', name: 'Maestro Kalos', description: 'Cattura tutti i 72 Pokémon di Gen 6', category: 'collection' as const, target: 72, reward: { coins: 12000, items: { rare_candy: 4, masterball: 1 } } },
  { id: 'col_gen7', name: 'Esploratore Alola', description: 'Cattura 30 Pokémon di Gen 7', category: 'collection' as const, target: 30, reward: { coins: 4000, items: { rare_candy: 2 } } },
  { id: 'col_gen7_full', name: 'Maestro Alola', description: 'Cattura tutti i 88 Pokémon di Gen 7', category: 'collection' as const, target: 88, reward: { coins: 12000, items: { rare_candy: 4, masterball: 2 } } },
  { id: 'col_gen8', name: 'Esploratore Galar', description: 'Cattura 30 Pokémon di Gen 8', category: 'collection' as const, target: 30, reward: { coins: 4000, items: { rare_candy: 2 } } },
  { id: 'col_gen8_full', name: 'Maestro Galar', description: 'Cattura tutti i 89 Pokémon di Gen 8', category: 'collection' as const, target: 89, reward: { coins: 12000, items: { rare_candy: 4, masterball: 2 } } },
  { id: 'col_gen9', name: 'Esploratore Paldea', description: 'Cattura 30 Pokémon di Gen 9', category: 'collection' as const, target: 30, reward: { coins: 4500, items: { rare_candy: 2 } } },
  { id: 'col_gen9_full', name: 'Maestro Paldea', description: 'Cattura tutti i 120 Pokémon di Gen 9', category: 'collection' as const, target: 120, reward: { coins: 14000, items: { rare_candy: 4, masterball: 2 } } },
  { 
    id: 'mega_first', 
    name: 'Primo Passo Mega', 
    description: 'Cattura la tua prima Mega Evoluzione', 
    category: 'collection' as const, 
    target: 1, 
    reward: { coins: 5000, items: { rare_candy: 2 } }, 
  }, 
  { 
    id: 'mega_10', 
    name: 'Cacciatore di Mega', 
    description: 'Cattura 10 Mega Evoluzioni', 
    category: 'collection' as const, 
    target: 10, 
    reward: { coins: 15000, items: { rare_candy: 5, masterball: 1 } }, 
  }, 
  { 
    id: 'mega_all', 
    name: 'Maestro delle Mega', 
    description: 'Cattura almeno 1 esemplare di ogni Mega (48)', 
    category: 'collection' as const, 
    target: 48, 
    reward: { coins: 50000, items: { masterball: 3, rare_candy: 10 }, title: 'Mega Master' }, 
  },
  
  // LEGA
  {
    id: 'league_win',
    name: 'Aspirante',
    description: 'Sconfiggi un membro della Lega',
    category: 'special' as const,
    target: 1,
    reward: { coins: 5000 }
  },
  {
    id: 'league_master',
    name: 'Campione',
    description: 'Sconfiggi tutti i Master',
    category: 'special' as const,
    target: 8,
    reward: { coins: 20000, title: 'Champion' }
  },
  
  // SPECIALI
  {
    id: 'no_damage',
    name: 'Invincibile',
    description: 'Vinci una battaglia senza subire danni',
    category: 'special' as const,
    target: 1,
    reward: { coins: 3000 }
  },
  {
    id: 'streak_10',
    name: 'Serie Vincente',
    description: '10 vittorie consecutive',
    category: 'special' as const,
    target: 10,
    reward: { coins: 5000 }
  },
  {
    id: 'breed_10',
    name: 'Allevatore',
    description: 'Schiudi 10 uova',
    category: 'special' as const,
    target: 10,
    reward: { coins: 5000, items: { rare_candy: 5 } }
  }
];

const CATEGORY_ICONS = {
  catch: <Target className="w-4 h-4" />,
  battle: <Swords className="w-4 h-4" />,
  shiny: <Sparkles className="w-4 h-4" />,
  collection: <TreePine className="w-4 h-4" />,
  special: <Zap className="w-4 h-4" />
};

const CATEGORY_COLORS = {
  catch: 'from-red-500 to-pink-500',
  battle: 'from-blue-500 to-indigo-500',
  shiny: 'from-yellow-400 to-orange-500',
  collection: 'from-green-500 to-emerald-500',
  special: 'from-purple-500 to-pink-500'
};

export default function AchievementScreen() {
  const { achievements, stats, team, box, pokedex, incrementStat, addCoins, addItem, setScreen, initializeAchievements, updateAchievementProgress, unlockAchievement: unlockAchievementStore, leagueProgress, masterProgress } = useStore();
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Inizializza achievements se vuoto o se ne mancano alcuni
  useEffect(() => { 
    const knownIds = new Set(ACHIEVEMENTS_DATA.map(a => a.id)); 
    const storeIds = new Set(achievements.map(a => a.id)); 
    const missingAny = [...knownIds].some(id => !storeIds.has(id)); 
    if (achievements.length === 0 || missingAny) { 
      initializeAchievements(); 
    } 
  }, [achievements.length, initializeAchievements]); 

  // Calcola progressi retroattivi
  useEffect(() => {
    const updateRetroactiveProgress = () => {
      const caughtIds = Object.entries(pokedex) 
        .filter(([, s]) => s === 'caught') 
        .map(([id]) => Number(id)); 
 
      const countInRange = (min: number, max: number) => 
        caughtIds.filter(id => id >= min && id <= max).length; 
 
      const shinyCaught = [...team, ...box].filter(p => p.isShiny).length; 
 
      const progressMap: Record<string, number> = { 
        catch_10: stats.totalCaught, 
        catch_100: stats.totalCaught, 
        catch_500: stats.totalCaught, 
        battle_10: stats.totalBattles, 
        battle_50: stats.totalBattles, 
        battle_100: stats.totalBattles, 
        shiny_1: shinyCaught, 
        shiny_10: shinyCaught, 
        shiny_50: shinyCaught, 
        pokedex_gen1: countInRange(1, 151), 
        pokedex_gen2: countInRange(152, 251), 
        pokedex_all: caughtIds.length, 
        league_win: (leagueProgress.completedRegions.length > 0 || leagueProgress.completedRuns > 0) ? 1 : 0, 
        league_master: masterProgress?.defeatedIds?.length ?? 0, 
        col_gen3: countInRange(252, 386), 
        col_gen3_full: countInRange(252, 386), 
        col_gen4: countInRange(387, 493), 
        col_gen4_full: countInRange(387, 493), 
        col_gen5: countInRange(494, 649), 
        col_gen5_full: countInRange(494, 649), 
        col_gen6: countInRange(650, 721), 
        col_gen6_full: countInRange(650, 721), 
        col_gen7: countInRange(722, 809), 
        col_gen7_full: countInRange(722, 809), 
        col_gen8: countInRange(810, 898), 
        col_gen8_full: countInRange(810, 898), 
        col_gen9: countInRange(906, 1025),
        col_gen9_full: countInRange(906, 1025),
        mega_first: caughtIds.filter(id => MEGA_IDS.has(id)).length, 
        mega_10: caughtIds.filter(id => MEGA_IDS.has(id)).length, 
        mega_all: new Set(caughtIds.filter(id => MEGA_IDS.has(id))).size, 
      }; 
 
      Object.entries(progressMap).forEach(([id, progress]) => { 
        updateAchievementProgress(id, progress); 
      }); 
    };

    updateRetroactiveProgress();
  }, [stats, team, box, pokedex, leagueProgress, masterProgress]);

  const unlockAchievement = (achievementId: string) => { 
    const current = achievements.find(a => a.id === achievementId); 
    // Se non esiste ancora in store, inizializza prima poi sblocca 
    if (!current) { 
      initializeAchievements(); 
      setTimeout(() => { 
        unlockAchievementStore(achievementId); 
      }, 50); 
    } else if (!current.unlocked) { 
      unlockAchievementStore(achievementId); 
    } 
    const achievement = ACHIEVEMENTS_DATA.find(a => a.id === achievementId); 
    if (achievement) { 
      setShowNotification(achievement.name); 
      setTimeout(() => setShowNotification(null), 3000); 
    } 
  }; 

  const handleAchievementClick = (achievementId: string) => {
    const status = getAchievementStatus(achievementId);
    if (status === 'completed') {
      unlockAchievement(achievementId);
    }
  };

  const getAchievementProgress = (achievementId: string) => {
    const current = achievements.find(a => a.id === achievementId);
    if (current) return current.progress;
    
    // Calcolo retroattivo
    const caughtIds = Object.entries(pokedex) 
      .filter(([, s]) => s === 'caught') 
      .map(([id]) => Number(id)); 

    const countInRange = (min: number, max: number) => 
      caughtIds.filter(id => id >= min && id <= max).length; 

    const shinyCount = [...team, ...box].filter(p => p.isShiny).length; 

    switch (achievementId) {
      case 'catch_10':
      case 'catch_100':
      case 'catch_500':
        return stats.totalCaught;
      case 'battle_10':
      case 'battle_50':
      case 'battle_100':
        return stats.totalBattles;
      case 'shiny_1':
      case 'shiny_10':
      case 'shiny_50':
        return shinyCount;
      case 'pokedex_gen1':
        return countInRange(1, 151);
      case 'pokedex_gen2':
        return countInRange(152, 251);
      case 'pokedex_all':
        return caughtIds.length;
      case 'col_gen3': 
      case 'col_gen3_full': 
        return countInRange(252, 386); 
      case 'col_gen4': 
      case 'col_gen4_full': 
        return countInRange(387, 493); 
      case 'col_gen5': 
      case 'col_gen5_full': 
        return countInRange(494, 649); 
      case 'col_gen6': 
      case 'col_gen6_full': 
        return countInRange(650, 721); 
      case 'col_gen7': 
      case 'col_gen7_full': 
        return countInRange(722, 809); 
      case 'col_gen8': 
      case 'col_gen8_full': 
        return countInRange(810, 898); 
      case 'col_gen9':
      case 'col_gen9_full':
        return countInRange(906, 1025);
      case 'mega_first': 
      case 'mega_10': 
      case 'mega_all': 
        return caughtIds.filter(id => MEGA_IDS.has(id)).length; 
      case 'breed_10': 
        return achievements.find(a => a.id === 'breed_10')?.progress ?? 0; 
      case 'no_damage': 
        return achievements.find(a => a.id === 'no_damage')?.progress ?? 0; 
      case 'streak_10': 
        return achievements.find(a => a.id === 'streak_10')?.progress ?? 0; 
      default:
        return 0;
    }
  };

  const getAchievementStatus = (achievementId: string) => {
    const current = achievements.find(a => a.id === achievementId);
    if (current && current.unlocked) return 'unlocked';
    
    const progress = getAchievementProgress(achievementId);
    const achievement = ACHIEVEMENTS_DATA.find(a => a.id === achievementId);
    if (!achievement) return 'locked';
    
    return progress >= achievement.target ? 'completed' : 'in_progress';
  };

  const formatReward = (reward: any) => {
    const parts = [];
    if (reward.coins) parts.push(`${reward.coins}¢`);
    if (reward.items) {
      Object.entries(reward.items).forEach(([item, qty]) => {
        parts.push(`${qty}x ${item}`);
      });
    }
    if (reward.title) parts.push(`Titolo: ${reward.title}`);
    return parts.join(' + ');
  };

  const categories = ['catch', 'battle', 'shiny', 'collection', 'special'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] text-white p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setScreen('START_SCREEN')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-bold">Indietro</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black">ACHIEVEMENT</h1>
              <p className="text-white/40 text-sm">Raggiungi obiettivi e ottieni ricompense!</p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <div className="text-lg font-black">{stats.totalCaught}</div>
            <div className="text-[10px] text-white/40">Catture</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <div className="text-lg font-black">{stats.totalBattles}</div>
            <div className="text-[10px] text-white/40">Vittorie</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <div className="text-lg font-black">{[...team, ...box].filter(p => p.isShiny).length}</div>
            <div className="text-[10px] text-white/40">Shiny</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <div className="text-lg font-black">{Object.keys(pokedex).length}</div>
            <div className="text-[10px] text-white/40">Pokédex</div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="max-w-4xl mx-auto space-y-8 pb-48 overflow-y-auto max-h-[calc(100vh-200px)]">
        {categories.map(category => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 bg-gradient-to-br ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} rounded-xl flex items-center justify-center`}>
                {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
              </div>
              <h2 className="text-xl font-black uppercase tracking-wider text-white/60">
                {category === 'catch' ? 'CATTURE' : 
                 category === 'battle' ? 'BATTAGLIE' : 
                 category === 'shiny' ? 'SHINY' : 
                 category === 'collection' ? 'COLLEZIONE' : 'SPECIALI'}
              </h2>
            </div>
            
            <div className="grid gap-4">
              {ACHIEVEMENTS_DATA.filter(a => a.category === category).map(achievement => {
                const status = getAchievementStatus(achievement.id);
                const progress = getAchievementProgress(achievement.id);
                const percentage = Math.min(100, (progress / achievement.target) * 100);
                
                return (
                  <motion.div
                    key={achievement.id}
                    className={`bg-white/5 rounded-2xl p-4 border transition-all ${
                      status === 'unlocked' 
                        ? 'border-yellow-500/50 bg-yellow-500/10 cursor-default' 
                        : status === 'completed'
                        ? 'border-green-500/30 bg-green-500/5 hover:border-green-400/50 cursor-pointer' 
                        : 'border-white/20 cursor-default'
                    }`}
                    whileHover={status === 'completed' ? { scale: 1.02 } : {}}
                    onClick={() => status === 'completed' && handleAchievementClick(achievement.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {status === 'unlocked' ? (
                          <Trophy className="w-6 h-6 text-yellow-400" />
                        ) : status === 'completed' ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                          <Circle className="w-6 h-6 text-white/30" />
                        )}
                        <div>
                          <h3 className="font-black text-lg">{achievement.name}</h3>
                          <p className="text-sm text-white/40">{achievement.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-white/60">
                          {progress}/{achievement.target}
                        </div>
                        <div className="text-xs text-white/30">{formatReward(achievement.reward)}</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${
                          status === 'unlocked' 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                            : status === 'completed' 
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-r from-blue-400 to-purple-500'
                        }`}
                        style={{ width: `${status === 'unlocked' ? 100 : percentage}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${status === 'unlocked' ? 100 : percentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    {status === 'completed' && ( 
                      <div className="mt-3 flex items-center justify-between"> 
                        <p className="text-[11px] text-green-400 font-bold"> 
                          ✅ Obiettivo completato! Tocca per ritirare la ricompensa. 
                        </p> 
                        <span className="text-[10px] bg-green-500 text-black font-black px-3 py-1 rounded-full animate-pulse"> 
                          RITIRA 
                        </span> 
                      </div> 
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black py-3 px-6 rounded-full shadow-2xl"
          >
            🏆 Achievement sbloccato: {showNotification}!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}