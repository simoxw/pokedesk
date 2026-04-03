import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, CheckCircle, Circle, Award, Sparkles, Zap, Target, Swords, TreePine, ArrowLeft } from 'lucide-react';
import PokemonSprite from '../ui/PokemonSprite';

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
    target: 1008,
    reward: { coins: 50000, title: 'Professor' }
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
  const { achievements, stats, team, box, pokedex, incrementStat, addCoins, addItem, setScreen, initializeAchievements, updateAchievementProgress, unlockAchievement: unlockAchievementStore } = useStore();
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Inizializza achievements se vuoto
  useEffect(() => {
    if (achievements.length === 0) {
      initializeAchievements();
    }
  }, [achievements.length, initializeAchievements]);

  // Calcola progressi retroattivi
  useEffect(() => {
    const updateRetroactiveProgress = () => {
      const allPokemon = [...team, ...box];
      const shinyCount = allPokemon.filter(p => p.isShiny).length;
      const gen1Count = Object.keys(pokedex).filter(id => parseInt(id) <= 151).length;
      const gen2Count = Object.keys(pokedex).filter(id => parseInt(id) > 151 && parseInt(id) <= 251).length;
      const totalCount = Object.keys(pokedex).length;

      ACHIEVEMENTS_DATA.forEach(a => {
        let progress = 0;
        switch (a.id) {
          case 'catch_10':
          case 'catch_100':
          case 'catch_500':
            progress = stats.totalCaught;
            break;
          case 'battle_10':
          case 'battle_50':
          case 'battle_100':
            progress = stats.totalBattles;
            break;
          case 'shiny_1':
          case 'shiny_10':
          case 'shiny_50':
            progress = shinyCount;
            break;
          case 'pokedex_gen1':
            progress = gen1Count;
            break;
          case 'pokedex_gen2':
            progress = gen2Count;
            break;
          case 'pokedex_all':
            progress = totalCount;
            break;
          default:
            progress = 0;
        }
        
        updateAchievementProgress(a.id, progress);
        console.log(`Achievement ${a.id}: progress ${progress}/${a.target}`);
      });
    };

    updateRetroactiveProgress();
  }, [stats, team, box, pokedex]);

  const unlockAchievement = (achievementId: string) => {
    // Usa la funzione dello store per sbloccare l'achievement
    const current = achievements.find(a => a.id === achievementId);
    if (current && !current.unlocked) {
      // Chiama la funzione dello store
      unlockAchievementStore(achievementId);
      
      // Mostra notifica
      const achievement = ACHIEVEMENTS_DATA.find(a => a.id === achievementId);
      if (achievement) {
        setShowNotification(achievement.name);
        setTimeout(() => setShowNotification(null), 3000);
      }
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
    const allPokemon = [...team, ...box];
    const shinyCount = allPokemon.filter(p => p.isShiny).length;
    const gen1Count = Object.keys(pokedex).filter(id => parseInt(id) <= 151).length;
    const gen2Count = Object.keys(pokedex).filter(id => parseInt(id) > 151 && parseInt(id) <= 251).length;
    const totalCount = Object.keys(pokedex).length;

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
        return gen1Count;
      case 'pokedex_gen2':
        return gen2Count;
      case 'pokedex_all':
        return totalCount;
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
            onClick={() => setScreen('HUB_SCREEN')}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{stats.totalCaught}</div>
            <div className="text-xs text-white/40">Catture</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{stats.totalBattles}</div>
            <div className="text-xs text-white/40">Vittorie</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{[...team, ...box].filter(p => p.isShiny).length}</div>
            <div className="text-xs text-white/40">Shiny</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black">{Object.keys(pokedex).length}</div>
            <div className="text-xs text-white/40">Pokédex</div>
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