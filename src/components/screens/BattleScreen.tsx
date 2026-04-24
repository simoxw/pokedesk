import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { BattleEngine } from '../../BattleEngine';
import { CatchEngine } from '../../CatchEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Backpack, ArrowLeftRight, Shield, ArrowLeft, X, Heart } from 'lucide-react';
import HPBar from '../ui/HPBar';
import { useSoundEffects } from '../../useSoundEffects';
import TypeBadge from '../ui/TypeBadge';
import PokemonSprite from '../ui/PokemonSprite';
import confetti from 'canvas-confetti';
import { generateRandomEVs, getTowerFloorConfig, TOWER_MILESTONES } from '../../services/battleTowerService';
import { useLoadingWatchdog } from '../../useLoadingWatchdog';

const SELF_DROP_MOVE_IDS = new Set(['276', '315', '354', '370', '434', '437', '557', '620', '705']);

export default function BattleScreen() {
  const { team, setScreen, incrementStat, addCoins, addItem, updatePokemon, inventory, useItem, gainExp, currentBattlePath, recordBattleWin, medals, expShareActive, expBoostActive, friendBattleTeam, clearFriendBattleTeam, leagueBattleTeam, clearLeagueBattleTeam, setLeagueBattleResult, masterBattleTeam, clearMasterBattleTeam, setMasterBattleResult, battleTower, startBattleTower, advanceBattleTowerFloor, abandonBattleTower, claimBattleTowerReward, reportGenBattleResult } = useStore();
  const isFriendBattle = !!friendBattleTeam;
  const isTowerBattle = !!battleTower?.isActive;
  const towerFloor = battleTower?.currentFloor ?? 0;
  const { playSound } = useSoundEffects(useStore.getState().settings.audio);
  const medalsCount = medals.filter((m: any) => m.isUnlocked).length;
  const [activeIdx, setActiveIdx] = useState(0);
  const [enemy, setEnemy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [logs, setLogs] = useState<string[]>(['Inizia la battaglia!']);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTeamOverlay, setShowTeamOverlay] = useState(false);
  const [showBagOverlay, setShowBagOverlay] = useState(false);
  const [attackAnim, setAttackAnim] = useState(false);
  const [enemyHitAnim, setEnemyHitAnim] = useState(false);
  const [playerHitAnim, setPlayerHitAnim] = useState(false);
  const [statChanges, setStatChanges] = useState<{ label: string; positive: boolean } | null>(null);
  const [playerStages, setPlayerStages] = useState<Record<string, number>>({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 }); 
  const [enemyStages, setEnemyStages] = useState<Record<string, number>>({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 }); 
  const [enemyFlinch, setEnemyFlinch] = useState(false);
  const [playerFlinch, setPlayerFlinch] = useState(false);
  const [enemyPhase, setEnemyPhase] = useState(1); 
  const [enemy2, setEnemy2] = useState<any>(null); 
  const [enemy3, setEnemy3] = useState<any>(null);
  const [enemy4, setEnemy4] = useState<any>(null);
  const [activeMoveTooltip, setActiveMoveTooltip] = useState<any>(null);
  const [lastEnemyMove, setLastEnemyMove] = useState<{ name: string; type: string } | null>(null);
  const tooltipTimeout = React.useRef<any>(null);
  const battleTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressActive = React.useRef(false);
  const enemyRef = React.useRef<any>(null);
  enemyRef.current = enemy;
  const [apiError, setApiError] = useState<string | null>(null);
  const [playerTookDamage, setPlayerTookDamage] = useState(false);
  const [totalEnemies, setTotalEnemies] = useState(1);

  useLoadingWatchdog(loading); 
  const playerPkmn = team[activeIdx];
  const isLeagueBattle = !!leagueBattleTeam;
  const isMasterBattle = !!masterBattleTeam;
  const wasLeagueBattle = React.useRef(isLeagueBattle);
  const wasMasterBattle = React.useRef(isMasterBattle);
  const wasTowerBattle = React.useRef(isTowerBattle);
  const wasTowerFloor = React.useRef(towerFloor);
  const isBoss = !isFriendBattle && !isLeagueBattle && !isMasterBattle && currentBattlePath.nextIsBoss;
  const friendTrainerName = friendBattleTeam?.[0]?.trainerName ?? 'Amico';
  const leagueTrainerName = leagueBattleTeam?.[0]?.trainerName ?? 'Trainer';
  const masterTrainerName = masterBattleTeam?.[0]?.trainerName ?? 'Master Trainer';

  const applyEvGain = (pokemon: any, enemyData: any) => { 
    if (!enemyData?.rawStats) return; 
    const statMap: Record<string, string> = { 
      'hp': 'hp', 'attack': 'attack', 'defense': 'defense', 
      'special-attack': 'spAtk', 'special-defense': 'spDef', 'speed': 'speed' 
    }; 
    const newEvs = { ...pokemon.evs }; 
    let totalEvs = Object.values(newEvs).reduce((a: number, b: any) => a + b, 0) as number; 

    for (const s of enemyData.rawStats) { 
      const effort: number = s.effort || 0; 
      if (effort === 0) continue; 
      const key = statMap[s.stat.name]; 
      if (!key) continue; 
      const canAdd = Math.min(effort, 252 - newEvs[key], 510 - totalEvs); 
      if (canAdd <= 0) continue; 
      newEvs[key] += canAdd; 
      totalEvs += canAdd; 
    } 

    const newStats = BattleEngine.calculateStats(pokemon.level, pokemon.baseStats, pokemon.ivs, newEvs, pokemon.nature); 
    updatePokemon(pokemon.id, { evs: newEvs, stats: newStats }); 
  }; 

  const applyStage = (base: number, stage: number) => { 
    return Math.floor(base * BattleEngine.getStageMultiplier(stage)); 
  }; 

  const isImmuneToStatus = (pokemonTypes: string[], status: string): boolean => { 
    if (status === 'BRN' && pokemonTypes.includes('fire')) return true; 
    if (status === 'PAR' && pokemonTypes.includes('electric')) return true; 
    if (status === 'FRZ' && pokemonTypes.includes('ice')) return true; 
    if (status === 'PSN' && (pokemonTypes.includes('poison') || pokemonTypes.includes('steel'))) return true; 
    return false; 
  }; 

  useEffect(() => {
    battleTimeoutRef.current = setTimeout(() => { 
      setLoading(false); 
      setApiError('Caricamento troppo lento. Controlla la connessione e riprova.'); 
    }, 30000); 

    const initBattle = async () => {
      setLoading(true);
      setLastEnemyMove(null);
      console.log('[Battle] Initializing battle...');
      try {
        setLogs(['Inizia la battaglia!']);

        // PRIORITÀ: LEGA, MASTER, AMICI hanno la precedenza sulla Torre se i loro team sono settati
        if (isLeagueBattle && leagueBattleTeam && leagueBattleTeam.length > 0) {
          console.log('[Battle] Type: League Battle');
          const toEnemy = (p: any) => ({
            ...p,
            currentHp: p.stats.hp,
            maxHp: p.stats.hp,
            status: null,
          });
          const [l1, l2, l3, l4] = leagueBattleTeam;
          if (l2) setEnemy2(toEnemy(l2));
          if (l3) setEnemy3(toEnemy(l3));
          if (l4) setEnemy4(toEnemy(l4));
          const firstEnemy = toEnemy(l1);
          setEnemy(firstEnemy);
          enemyRef.current = firstEnemy;
          setLogs([`⚔️ Battaglia contro ${leagueTrainerName}!`]);
          setTotalEnemies([l1, l2, l3, l4].filter(Boolean).length);
          setLoading(false);
          return;
        }

        if (isMasterBattle && masterBattleTeam && masterBattleTeam.length > 0) {
          console.log('[Battle] Type: Master Battle');
          const toEnemy = (p: any) => ({
            ...p,
            currentHp: p.stats.hp,
            maxHp: p.stats.hp,
            status: null,
          });
          const [m1, m2, m3, m4] = masterBattleTeam;
          if (m2) setEnemy2(toEnemy(m2));
          if (m3) setEnemy3(toEnemy(m3));
          if (m4) setEnemy4(toEnemy(m4));
          const firstEnemy = toEnemy(m1);
          setEnemy(firstEnemy);
          enemyRef.current = firstEnemy;
          setLogs([`⚔️ Sfida Master contro ${masterTrainerName}!`]);
          setTotalEnemies([m1, m2, m3, m4].filter(Boolean).length);
          setLoading(false);
          return;
        }

        if (isFriendBattle && friendBattleTeam && friendBattleTeam.length > 0) {
          console.log('[Battle] Type: Friend Battle');
          const toEnemy = (p: any) => ({
            ...p,
            name: p.name,
            currentHp: p.stats.hp,
            maxHp: p.stats.hp,
            status: null,
            rawStats: null,
          });
          const [f1, f2, f3, f4] = friendBattleTeam;
          if (f2) setEnemy2(toEnemy(f2));
          if (f3) setEnemy3(toEnemy(f3));
          if (f4) setEnemy4(toEnemy(f4));
          const firstEnemy = toEnemy(f1);
          setEnemy(firstEnemy);
          enemyRef.current = firstEnemy;
          setLogs([`⚔️ Sfida con ${friendTrainerName}! Forza!`]);
          setTotalEnemies([f1, f2, f3, f4].filter(Boolean).length);
          setLoading(false);
          return;
        }

        if (isTowerBattle) {
           console.log('[Battle] Type: Tower Battle');
           const floor = battleTower?.currentFloor ?? 1;
           const teamAvgLevel = Math.floor(team.reduce((acc, p) => acc + p.level, 0) / team.length);
           const config = getTowerFloorConfig(floor, teamAvgLevel);
           
           // Build enemy team
           const enemyPokemonIds: number[] = [];
           for (let i = 0; i < config.enemyCount; i++) {
             const id = Math.floor(Math.random() * 898) + 1;
             enemyPokemonIds.push(id);
           }
           
           try {
             const buildEnemy = async (id: number) => {
               const data = await api.getPokemon(id);
               const species = await api.getSpecies(id);
               const ivs = CatchEngine.generateIVs();
               const evs = config.useRandomEVs ? generateRandomEVs() : 
                 { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
               const baseStats = {
                 hp: data.stats[0].base_stat, attack: data.stats[1].base_stat,
                 defense: data.stats[2].base_stat, spAtk: data.stats[3].base_stat,
                 spDef: data.stats[4].base_stat, speed: data.stats[5].base_stat,
               };
               const stats = BattleEngine.calculateStats(
                 config.enemyLevel, baseStats, ivs, evs, 'Quirky'
               );
               const moves = await api.getPokemonMoves(data, config.enemyLevel);
               return {
                 id: Math.random().toString(36).substr(2, 9),
                 pokemonId: data.id,
                 name: api.getItalianName(species.names),
                 level: config.enemyLevel,
                 currentHp: stats.hp,
                 maxHp: stats.hp,
                 stats, baseStats, ivs, evs,
                 nature: 'Quirky',
                 moves,
                 rawStats: data.stats,
                 types: data.types.map((t: any) => t.type.name),
                 status: null,
                 isShiny: false,
                 growthRate: species.growth_rate.name,
                 trainerName: `Torre - Piano ${floor}`,
               };
             };
             
             const enemies = await Promise.all(enemyPokemonIds.map(buildEnemy));
             const [e1, e2, e3, e4] = enemies;
             setEnemy(e1);
             enemyRef.current = e1;
             if (e2) setEnemy2(e2);
             if (e3) setEnemy3(e3);
             if (e4) setEnemy4(e4);
             
             const floorLabel = config.isEliteMode 
               ? `⚡ Piano ${floor} — Modalità Elite!` 
               : config.isBossFloor 
               ? `🗼 Piano ${floor} — Boss Floor!` 
               : `🗼 Torre Lotta — Piano ${floor}`;
             setLogs([floorLabel]);
             setTotalEnemies(enemies.length);
             setLoading(false);
             return;
           } catch(_e) {
             console.error('Tower battle init error:', _e);
             setLoading(false);
             return;
           }
         }
        // Gen sbloccate progressivamente con le medaglie 
        const getRandomPokemonId = (medals: number): number => {
          const ranges: Array<{min: number, max: number, weight: number}> = [
            { min: 1,   max: 151, weight: 30 },  // Gen 1
          ];
          if (medals >= 1)  ranges.push({ min: 152, max: 251, weight: 25 }); // Gen 2
          if (medals >= 5)  ranges.push({ min: 252, max: 386, weight: 22 }); // Gen 3
          if (medals >= 10) ranges.push({ min: 387, max: 493, weight: 18 }); // Gen 4
          if (medals >= 20) ranges.push({ min: 494, max: 649, weight: 15 }); // Gen 5

          const totalWeight = ranges.reduce((sum, r) => sum + r.weight, 0);
          let roll = Math.random() * totalWeight;
          for (const range of ranges) {
            roll -= range.weight;
            if (roll <= 0) {
              return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            }
          }
          return Math.floor(Math.random() * 151) + 1; // fallback Gen 1
        }; 
        
        const id = getRandomPokemonId(medalsCount);
        console.log(`[Battle] Type: Wild Battle, Target ID: ${id}, Boss: ${isBoss}`);
                  
        const data = await api.getPokemon(id);
        const species = await api.getSpecies(id);
        
        const teamAvgLevel = team.reduce((acc, p) => acc + p.level, 0) / team.length; 
        const variance = Math.floor(Math.random() * 5) - 2; // da -2 a +2 
        let level = Math.max(5, Math.floor(teamAvgLevel + variance)); 
        let enemyName = api.getItalianName(species.names);

        if (isBoss) { 
          level = playerPkmn.level + 3; 
          addLog("⚔️ SFIDA CAPOPALESTRA! (2 Pokémon)"); 
   
          // Carica il secondo Pokémon del boss 
          const id2 = getRandomPokemonId(medalsCount); 
          const data2 = await api.getPokemon(id2); 
          const species2 = await api.getSpecies(id2);
          const ivs2 = CatchEngine.generateIVs(); 
          const baseStats2 = { 
            hp: data2.stats[0].base_stat, attack: data2.stats[1].base_stat, 
            defense: data2.stats[2].base_stat, spAtk: data2.stats[3].base_stat, 
            spDef: data2.stats[4].base_stat, speed: data2.stats[5].base_stat, 
          }; 
          const stats2 = BattleEngine.calculateStats(level, baseStats2, ivs2, { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, 'Quirky'); 
          const moves2 = await api.getPokemonMoves(data2, level); 
          setEnemy2({ 
            ...data2, 
            rawStats: data2.stats,
            name: api.getItalianName(species2.names), 
            level, 
            currentHp: stats2.hp, 
            maxHp: stats2.hp, 
            stats: stats2, 
            moves: moves2, 
            types: data2.types.map((t: any) => t.type.name), 
          }); 

          if (medalsCount >= 21) {
            addLog("⚔️ Capopalestra potente (3 Pokémon)!");
            const id3 = getRandomPokemonId(medalsCount);
            const data3 = await api.getPokemon(id3);
            const species3 = await api.getSpecies(id3);
            const ivs3 = CatchEngine.generateIVs();
            const baseStats3 = {
              hp: data3.stats[0].base_stat,
              attack: data3.stats[1].base_stat,
              defense: data3.stats[2].base_stat,
              spAtk: data3.stats[3].base_stat,
              spDef: data3.stats[4].base_stat,
              speed: data3.stats[5].base_stat,
            };
            const stats3 = BattleEngine.calculateStats(
              level, baseStats3, ivs3, 
              { hp:0, attack:0, defense:0, spAtk:0, spDef:0, speed:0 }, 
              'Quirky'
            );
            const moves3 = await api.getPokemonMoves(data3, level);
            setEnemy3({
              ...data3,
              rawStats: data3.stats,
              name: api.getItalianName(species3.names),
              level,
              currentHp: stats3.hp,
              maxHp: stats3.hp,
              stats: stats3,
              moves: moves3,
              types: data3.types.map((t: any) => t.type.name),
            });
          }
        }


        const baseStats = {
          hp: data.stats[0].base_stat,
          attack: data.stats[1].base_stat,
          defense: data.stats[2].base_stat,
          spAtk: data.stats[3].base_stat,
          spDef: data.stats[4].base_stat,
          speed: data.stats[5].base_stat,
        };

        const ivs = CatchEngine.generateIVs();
        const stats = BattleEngine.calculateStats(level, baseStats, ivs, { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }, 'Quirky');
        const moves = await api.getPokemonMoves(data, level);

        const enemyData = {
          ...data,
          rawStats: data.stats,
          name: enemyName,
          level,
          currentHp: stats.hp,
          maxHp: stats.hp,
          stats,
          moves,
          types: data.types.map((t: any) => t.type.name),
        };
        setEnemy(enemyData);
        enemyRef.current = enemyData;
        console.log('[Battle] Enemy loaded:', enemyData.name, 'Lv.', enemyData.level);
        setTotalEnemies(1 + (enemy2 ? 1 : 0) + (enemy3 ? 1 : 0));
        setLoading(false);
        useStore.getState().updatePokedex(id, 'seen');
      } catch (err: any) {
        console.error('[Battle] Initialization failed:', err);
        setLoading(false);
        if (err.message === 'OFFLINE') {
          setApiError('Sei offline. Connettiti per continuare.');
        } else {
          setApiError('Errore di connessione. Riprova tra qualche secondo.');
        }
      }
    };
    initBattle().finally(() => {
      if (battleTimeoutRef.current) clearTimeout(battleTimeoutRef.current);
    });
    
    return () => {
      if (battleTimeoutRef.current) clearTimeout(battleTimeoutRef.current);
    };
  }, []);

  const award40MedalExpItems = () => {
    const bossesWon = useStore.getState().medals.filter((m: any) => m.isUnlocked).length;
    if (bossesWon >= 40) {
      if ((useStore.getState().inventory['exp_share'] || 0) === 0) {
        addItem('exp_share', 1);
        addLog('🏆 Hai completato tutte le palestre! Ottieni il Condividi ESP!');
      }
      if ((useStore.getState().inventory['exp_boost'] || 0) === 0) {
        addItem('exp_boost', 1);
        addLog('🏆 Hai completato tutte le palestre! Ottieni il Potenziamento ESP!');
      }
    }
  };

  const processEnemyDefeat = async (defeatedEnemy: any) => {
    const currentPkm = team[activeIdx];
    const baseExp = defeatedEnemy.base_experience || 100;
    const boostedBaseExp = expBoostActive ? baseExp * 2 : baseExp;
    const exp = BattleEngine.calculateExp(boostedBaseExp, defeatedEnemy.level);
    addLog(`${defeatedEnemy.name} è esausto! ${currentPkm.name} guadagna ${exp} ESP!`);
    const levelBefore = currentPkm.level;
    gainExp(currentPkm.id, exp); 
    // EV gain per il Pokémon attivo 
    const freshActive = useStore.getState().team.find((p: any) => p.id === currentPkm.id) ?? currentPkm; 
    applyEvGain(freshActive, defeatedEnemy); 
    
    if (expShareActive) { 
      const halfExp = Math.max(1, Math.floor(exp / 2)); 
      useStore.getState().team.forEach((p: any) => { 
        if (p.id !== currentPkm.id && p.currentHp > 0) {
          gainExp(p.id, halfExp);
          const freshP = useStore.getState().team.find((tp: any) => tp.id === p.id) ?? p; 
          applyEvGain(freshP, defeatedEnemy);
        }
      }); 
    } 
    
    setTimeout(() => { 
      const freshPkmn = useStore.getState().team.find((p: any) => p.id === currentPkm.id); 
      if (freshPkmn && freshPkmn.level > levelBefore) { 
        addLog(`🎊 LIVELLO SUPERATO! ${freshPkmn.name} è ora al Lv. ${freshPkmn.level}!`); 
      } 
    }, 100); 

    if (isBoss && enemyPhase === 1 && enemy2) { 
      addLog(`⚔️ Il Capopalestra lancia il secondo Pokémon!`); 
      setLastEnemyMove(null);
      setEnemyPhase(2); 
      setEnemy(enemy2); 
      enemyRef.current = enemy2; 
      setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 }); 
      setTurn('player'); 
      setIsAnimating(false); 
      return true;
    }

    if (isFriendBattle && enemyPhase === 1 && enemy2) {
      addLog(`⚔️ ${friendTrainerName} lancia il secondo Pokémon!`);
      setLastEnemyMove(null);
      setEnemyPhase(2);
      setEnemy(enemy2);
      enemyRef.current = enemy2;
      setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
      setTurn('player');
      setIsAnimating(false);
      return true;
    } 

    if (isBoss && enemyPhase === 2 && enemy3) {
      addLog(`⚔️ Il Capopalestra lancia il terzo Pokémon!`);
      setLastEnemyMove(null);
      setEnemyPhase(3);
      setEnemy(enemy3);
      enemyRef.current = enemy3;
      setEnemyStages({ attack:0, defense:0, spAtk:0, spDef:0, speed:0, accuracy:0, evasion:0 });
      setTurn('player');
      setIsAnimating(false);
      return true;
    }

    if (isFriendBattle && enemyPhase === 2 && enemy3) {
      addLog(`⚔️ ${friendTrainerName} lancia il terzo Pokémon!`);
      setLastEnemyMove(null);
      setEnemyPhase(3);
      setEnemy(enemy3);
      enemyRef.current = enemy3;
      setEnemyStages({ attack:0, defense:0, spAtk:0, spDef:0, speed:0, accuracy:0, evasion:0 });
      setTurn('player');
      setIsAnimating(false);
      return true;
    }

    if (isFriendBattle && enemyPhase === 3 && enemy4) {
      addLog(`⚔️ ${friendTrainerName} lancia il quarto Pokémon!`);
      setLastEnemyMove(null);
      setEnemyPhase(4);
      setEnemy(enemy4);
      enemyRef.current = enemy4;
      setEnemyStages({ attack:0, defense:0, spAtk:0, spDef:0, speed:0, accuracy:0, evasion:0 });
      setTurn('player');
      setIsAnimating(false);
      return true;
    }

    if ((isLeagueBattle || isMasterBattle) && enemyPhase === 1 && enemy2) {
      const trainerName = isLeagueBattle ? leagueTrainerName : masterTrainerName;
      addLog(`⚔️ ${trainerName} lancia il secondo Pokémon!`);
      setLastEnemyMove(null);
      setEnemyPhase(2);
      setEnemy(enemy2);
      enemyRef.current = enemy2;
      setEnemyStages({ attack:0, defense:0, spAtk:0, spDef:0, speed:0, accuracy:0, evasion:0 });
      setTurn('player');
      setIsAnimating(false);
      return true;
    }

    if ((isLeagueBattle || isMasterBattle) && enemyPhase === 2 && enemy3) {
      const trainerName = isLeagueBattle ? leagueTrainerName : masterTrainerName;
      addLog(`⚔️ ${trainerName} lancia il terzo Pokémon!`);
      setLastEnemyMove(null);
      setEnemyPhase(3);
      setEnemy(enemy3);
      enemyRef.current = enemy3;
      setEnemyStages({ attack:0, defense:0, spAtk:0, spDef:0, speed:0, accuracy:0, evasion:0 });
      setTurn('player');
      setIsAnimating(false);
      return true;
    }

    if ((isLeagueBattle || isMasterBattle) && enemyPhase === 3 && enemy4) {
      const trainerName = isLeagueBattle ? leagueTrainerName : masterTrainerName;
      addLog(`⚔️ ${trainerName} lancia il quarto Pokémon!`);
      setLastEnemyMove(null);
      setEnemyPhase(4);
      setEnemy(enemy4);
      enemyRef.current = enemy4;
      setEnemyStages({ attack:0, defense:0, spAtk:0, spDef:0, speed:0, accuracy:0, evasion:0 });
      setTurn('player');
      setIsAnimating(false);
      return true;
    }

    if (isLeagueBattle) {
      addLog(`🏆 Hai sconfitto ${leagueTrainerName}!`);
      incrementStat('totalBattles');
      team.forEach(p => {
        const recoveredHp = Math.min(p.stats.hp, p.currentHp + Math.floor(p.stats.hp * 0.1));
        const recoveredMoves = p.moves.map((m: any) => ({ ...m, pp: m.maxPp }));
        updatePokemon(p.id, { currentHp: recoveredHp, moves: recoveredMoves });
      });
      setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
      setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
      setEnemyFlinch(false);
      setPlayerFlinch(false);
      award40MedalExpItems();
      clearLeagueBattleTeam();
      setIsFinished(true);
      setIsAnimating(false);
      return false;
    }

    if (isMasterBattle) {
      addLog(`🏆 Hai sconfitto ${masterTrainerName}!`);
      incrementStat('totalBattles');
      team.forEach(p => {
        const recoveredHp = Math.min(p.stats.hp, p.currentHp + Math.floor(p.stats.hp * 0.1));
        const recoveredMoves = p.moves.map((m: any) => ({ ...m, pp: m.maxPp }));
        updatePokemon(p.id, { currentHp: recoveredHp, moves: recoveredMoves });
      });
      setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
      setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
      setEnemyFlinch(false);
      setPlayerFlinch(false);
      award40MedalExpItems();
      clearMasterBattleTeam();
      setMasterBattleResult('win');
      setIsFinished(true);
      setIsAnimating(false);
      return false;
    }

    if (isTowerBattle) {
      // Logic for tower multi-enemy phases
      if (enemyPhase === 1 && enemy2) {
        addLog(`⚔️ L'avversario lancia il secondo Pokémon!`);
        setEnemyPhase(2); setEnemy(enemy2); enemyRef.current = enemy2;
        setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
        setTurn('player'); setIsAnimating(false); return true;
      }
      if (enemyPhase === 2 && enemy3) {
        addLog(`⚔️ L'avversario lancia il terzo Pokémon!`);
        setEnemyPhase(3); setEnemy(enemy3); enemyRef.current = enemy3;
        setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
        setTurn('player'); setIsAnimating(false); return true;
      }
      if (enemyPhase === 3 && enemy4) {
        addLog(`⚔️ L'avversario lancia il quarto Pokémon!`);
        setEnemyPhase(4); setEnemy(enemy4); enemyRef.current = enemy4;
        setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
        setTurn('player'); setIsAnimating(false); return true;
      }

      advanceBattleTowerFloor();
      const newFloor = useStore.getState().battleTower.currentFloor;
      const completedFloor = newFloor - 1; // currentFloor is now the next floor to fight
      const towerReward = 500 + Math.max(0, completedFloor - 1) * 100;
      addCoins(towerReward);
      addLog(`🎁 +${towerReward} monete per aver superato il Piano ${completedFloor}!`);
      
      // Check milestone for the floor that was just completed
      const milestones = [7, 14, 21, 25, 35, 49, 77];
      if (milestones.includes(completedFloor)) {
        claimBattleTowerReward(completedFloor);
        const milestone = TOWER_MILESTONES[completedFloor];
        if (milestone) addLog(`🎁 ${milestone.label} completato!`);
      }
      
      incrementStat('totalBattles');
      // No healing in tower
      setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
      setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
      setEnemyFlinch(false);
      setPlayerFlinch(false);
      setIsFinished(true);
      setIsAnimating(false);
      return false;
    }

    if (isFriendBattle) {
      addLog(`🏆 Hai sconfitto la squadra di ${friendTrainerName}!`);
      addCoins(300);
      addLog('🎁 +300 monete per la vittoria!');
      incrementStat('totalBattles');
      team.forEach(p => {
        const recoveredHp = Math.min(p.stats.hp, p.currentHp + Math.floor(p.stats.hp * 0.1));
        const recoveredMoves = p.moves.map((m: any) => ({ ...m, pp: m.maxPp }));
        updatePokemon(p.id, { currentHp: recoveredHp, moves: recoveredMoves });
      });
      setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
      setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
      setEnemyFlinch(false);
      setPlayerFlinch(false);
      clearFriendBattleTeam();
      setIsFinished(true);
      setIsAnimating(false);
      return false;
    }

    recordBattleWin(); 
    award40MedalExpItems();
    reportGenBattleResult({ win: true, noFaint: team.every((p) => p.currentHp > 0), solo: team.length === 1 });
    // Achievement: Invincibile 
    if (!playerTookDamage) { 
      useStore.getState().updateAchievementProgress('no_damage', 1); 
    } 
    // Achievement: Serie Vincente 
    const newStreak = (useStore.getState().battleWinStreak ?? 0); 
    useStore.getState().updateAchievementProgress('streak_10', newStreak); 

    if (isBoss) { 
      addLog("🏅 Medaglia conquistata!"); 
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); 
      addCoins(Math.floor(500 + (defeatedEnemy?.level ?? 5) * 2)); 
      addItem('megaball', 1); 
      addItem('full_heal', 2); 
      addItem('superpotion', 2); 
      if (Math.random() < 0.10) addItem('rare_candy', 1); 
      if (Math.random() < 0.10) addItem('ultraball', 1); 
      addLog('🎁 Ricompense Capopalestra ricevute!'); 
    } else { 
      addCoins(Math.floor(200 + (defeatedEnemy?.level ?? 5) * 2)); 
      addItem('pokeball', 1); 
      addItem('potion', 2); 
      addItem('full_heal', 1); 
      if (Math.random() < 0.10) addItem('superpotion', 1); 
      if (Math.random() < 0.10) addItem('megaball', 1); 
    } 
    incrementStat('totalBattles');
    useStore.getState().team.forEach(p => { 
      const isActive = p.id === currentPkm.id; 
      const recoveredHp = isActive 
        ? Math.min(p.stats.hp, p.currentHp + Math.floor(p.stats.hp * 0.1)) 
        : Math.max(1, p.currentHp); // KO → 1HP minimo, non resta a 0 
      const recoveredMoves = p.moves.map((m: any) => ({ ...m, pp: m.maxPp })); 
      updatePokemon(p.id, { currentHp: recoveredHp, moves: recoveredMoves }); 
    });
    setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
    setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
    setEnemyFlinch(false);
    setPlayerFlinch(false);
    setIsFinished(true);
    setIsAnimating(false);
    return false; // end battle
  };

  const executeEnemyTurn = async (currentPlayerPkmn: any) => {
    console.log('[Battle] Enemy turn starting...');
    await new Promise(r => setTimeout(r, 800));
    const liveEnemy = enemyRef.current ?? enemy;
    if (!liveEnemy || liveEnemy.currentHp <= 0) return;

    const validMoves = liveEnemy.moves.filter((m: any) => m.pp > 0);

    // Boss/Lega/Master usano Iperpozione se HP < 30%
    const isEliteBattle = isBoss || isLeagueBattle || isMasterBattle || wasTowerBattle.current;
    if (isEliteBattle && liveEnemy.currentHp / liveEnemy.maxHp < 0.30 && Math.random() < 0.30) {
      const heal = Math.floor(liveEnemy.maxHp * 0.60);
      const newHp = Math.min(liveEnemy.maxHp, liveEnemy.currentHp + heal);
      setEnemy((prev: any) => {
        const next = { ...prev, currentHp: newHp };
        enemyRef.current = next;
        return next;
      });
      addLog(`${liveEnemy.name} usa Iperpozione! (+${heal} HP)`);
      setTurn('player');
      setIsAnimating(false);
      return;
    }

    // AI priority list
    let enemyMove: any;

    // Priorità 1: mossa che fa KO
    const effEnemyAtkTemp = {
      ...liveEnemy,
      stats: {
        ...liveEnemy.stats,
        attack: applyStage(liveEnemy.stats.attack, enemyStages.attack),
        spAtk: applyStage(liveEnemy.stats.spAtk, enemyStages.spAtk),
      }
    };
    const effPlayerDefTemp = {
      ...currentPlayerPkmn,
      stats: {
        ...currentPlayerPkmn.stats,
        defense: applyStage(currentPlayerPkmn.stats.defense, playerStages.defense),
        spDef: applyStage(currentPlayerPkmn.stats.spDef, playerStages.spDef),
      }
    };

    const koMove = validMoves.find((m: any) => {
      if (m.category === 'status') return false;
      const dmg = BattleEngine.calculateDamage(effEnemyAtkTemp as any, effPlayerDefTemp as any, m, false);
      return dmg >= currentPlayerPkmn.currentHp;
    });

    if (koMove) {
      enemyMove = koMove;
    }
    // Priorità 2: mossa superefficace
    else {
      // Priorità 1.5: Cura se HP < 50%
      const HEAL_MOVES: Record<string, number> = {
        '105': 0.5, '135': 0.5, '208': 0.5, '303': 0.5, '355': 0.5,
        '236': 0.5, '235': 0.5, '234': 0.5, '505': 0.5, '392': 0.25,
        '588': 0.5, '456': 0.5, '273': 0.5, '156': 0.5
      };
      const healMove = validMoves.find((m: any) => 
        (HEAL_MOVES[m.id] || m.name.toLowerCase().includes('recup')) && 
        liveEnemy.currentHp / liveEnemy.maxHp < 0.5
      );

      const superEffective = validMoves.filter((m: any) =>
        m.category !== 'status' &&
        BattleEngine.getTypeEffectiveness(m.type, currentPlayerPkmn.types) >= 2
      );
      const offensiveMoves = validMoves.filter((m: any) => m.category !== 'status');
      const getExpectedDamage = (move: any) => {
        const dmg = BattleEngine.calculateDamage(effEnemyAtkTemp as any, effPlayerDefTemp as any, move, false);
        const acc = Math.max(0.5, (move.accuracy ?? 100) / 100);
        return dmg * acc;
      };
      const bestSuperEffective = superEffective
        .slice()
        .sort((a: any, b: any) => getExpectedDamage(b) - getExpectedDamage(a))[0];
      const bestOffensive = offensiveMoves
        .slice()
        .sort((a: any, b: any) => getExpectedDamage(b) - getExpectedDamage(a))[0];

      // Priorità 3: mossa di stato se player non ha status e nemico ha >50% HP
      const statusMoves = validMoves.filter((m: any) =>
        m.category === 'status' && 
        m.statusEffect && 
        !currentPlayerPkmn.status &&
        !isImmuneToStatus(currentPlayerPkmn.types, m.statusEffect)
      );
      const isEliteAI = isLeagueBattle || isMasterBattle;
      const healChance = isEliteAI ? 0.8 : 0.7;
      const superEffectiveChance = isEliteAI ? 0.92 : 0.75;
      const statusChance = isEliteAI ? 0.2 : 0.4;

      if (healMove && Math.random() < healChance) {
        enemyMove = healMove;
      } else if (bestSuperEffective && Math.random() < superEffectiveChance) {
        enemyMove = bestSuperEffective;
      } else if (statusMoves.length > 0 && liveEnemy.currentHp / liveEnemy.maxHp > 0.5 && Math.random() < statusChance) {
        enemyMove = statusMoves[Math.floor(Math.random() * statusMoves.length)];
      } else {
        enemyMove = bestOffensive ?? validMoves[Math.floor(Math.random() * validMoves.length)];
      }
    }

    console.log('[Battle] Enemy chose move:', enemyMove?.name);

    // Fallback assoluto
    if (!enemyMove) {
      if (validMoves.length === 0) {
        addLog(`${liveEnemy.name} non ha più PP! Usa Lotta!`);
      }
      enemyMove = validMoves.length > 0
        ? validMoves[Math.floor(Math.random() * validMoves.length)]
        : { name: 'Lotta', type: 'normal', power: 40, category: 'physical', pp: 1, maxPp: 1, id: '0', accuracy: 100, priority: 0, description: '' };
    }

    setEnemy((prev: any) => {
      if (!prev) return prev;
      const updatedMoves = prev.moves.map((m: any) =>
        m.id === enemyMove.id ? { ...m, pp: Math.max(0, m.pp - 1) } : m
      );
      const next = { ...prev, moves: updatedMoves };
      enemyRef.current = next;
      return next;
    });

    // --- CHECK STATUS NEMICO: blocca il turno se necessario ---
    // SLP: 20% chance di svegliarsi ogni turno
    if (liveEnemy.status === 'SLP') {
      if (Math.random() < 0.2) {
        setEnemy((prev: any) => {
          const next = { ...prev, status: null };
          enemyRef.current = next;
          return next;
        });
        addLog(`${liveEnemy.name} si è svegliato!`);
        // Prosegue con l'attacco dopo essersi svegliato
      } else {
        addLog(`${liveEnemy.name} sta dormendo profondamente...`);
        setTurn('player');
        setIsAnimating(false);
        return;
      }
    }

    // FRZ: 20% unfreeze else skip 
    if (liveEnemy.status === 'FRZ') {
      if (Math.random() < 0.2) {
        setEnemy((prev: any) => {
          const next = { ...prev, status: null };
          enemyRef.current = next;
          return next;
        });
        addLog(`${liveEnemy.name} si è scongelato!`);
      } else {
        addLog(`${liveEnemy.name} è congelato!`);
        setTurn('player');
        setIsAnimating(false);
        return;
      }
    }

    // PAR: 25% skip
    if (liveEnemy.status === 'PAR' && Math.random() < 0.25) {
      addLog(`${liveEnemy.name} è paralizzato e non riesce a muoversi!`);
      setTurn('player');
      setIsAnimating(false);
      return;
    }
    // --- FINE CHECK STATUS NEMICO ---

    // Accuracy Check per il nemico
    const enemyAccStage = enemyStages.accuracy - playerStages.evasion;
    const enemyAccMultiplier = enemyAccStage >= 0 ? (3 + enemyAccStage) / 3 : 3 / (3 - enemyAccStage);
    const enemyFinalAccuracy = (enemyMove.accuracy || 100) * enemyAccMultiplier;

    if (enemyMove.category !== 'status' && enemyMove.accuracy && enemyMove.accuracy < 100) { 
      if (Math.random() * 100 >= enemyFinalAccuracy) { 
        addLog(`${liveEnemy.name} usa ${enemyMove.name}!`); 
        addLog('Ma ha mancato!'); 
        await new Promise(r => setTimeout(r, 800)); 
        setTurn('player'); 
        setIsAnimating(false); 
        return; 
      } 
    }

    // Check Flinch
    if (playerFlinch) {
      addLog(`${currentPlayerPkmn.name} ha tentennato e non può muoversi!`);
      setPlayerFlinch(false);
      setTurn('player');
      setIsAnimating(false);
      return;
    }

    const effEnemyAtk = {
      ...liveEnemy,
      stats: {
        ...liveEnemy.stats,
        attack: applyStage(liveEnemy.stats.attack, enemyStages.attack),
        spAtk: applyStage(liveEnemy.stats.spAtk, enemyStages.spAtk),
        defense: applyStage(liveEnemy.stats.defense, enemyStages.defense),
        spDef: applyStage(liveEnemy.stats.spDef, enemyStages.spDef),
      }
    };
    const effPlayerDef = {
      ...currentPlayerPkmn,
      stats: {
        ...currentPlayerPkmn.stats,
        defense: applyStage(currentPlayerPkmn.stats.defense, playerStages.defense),
        spDef: applyStage(currentPlayerPkmn.stats.spDef, playerStages.spDef),
      }
    };
    const isEnemyCrit = Math.random() < 0.06;
    const enemyDamage = BattleEngine.calculateDamage(effEnemyAtk as any, effPlayerDef as any, enemyMove, isEnemyCrit);
    setLastEnemyMove({ name: enemyMove.name, type: enemyMove.type });
    addLog(`${liveEnemy.name} usa ${enemyMove.name}!${enemyDamage > 0 ? ` (${enemyDamage} danni)` : ''}`);
    if (isEnemyCrit && enemyDamage > 0) addLog('Brutto colpo!');
    const typeMultiplier = BattleEngine.getTypeEffectiveness(enemyMove.type, currentPlayerPkmn.types);
    const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
    if (effLabel && (enemyDamage > 0 || typeMultiplier === 0)) addLog(effLabel);
    if (typeMultiplier >= 2) playSound('hitSuper');
    else if (typeMultiplier > 0 && typeMultiplier < 1) playSound('hitWeak');

    // --- HEALING NEMICO ---
    const ENEMY_HEAL_MOVES: Record<string, number> = {
      '105': 0.5, '135': 0.5, '208': 0.5, '303': 0.5, '355': 0.5,
      '236': 0.5, '235': 0.5, '234': 0.5, '505': 0.5, '392': 0.25,
      '588': 0.5, '456': 0.5, '273': 0.5, '156': 0.5
    };
    const enemyHealRatio = ENEMY_HEAL_MOVES[enemyMove.id] ?? (enemyMove.name.toLowerCase().includes('recup') ? 0.5 : 0);
    if (enemyHealRatio > 0 || enemyMove.id === '156') {
      const healed = Math.floor(liveEnemy.maxHp * 0.5);
      const newEnemyHp = Math.min(liveEnemy.maxHp, liveEnemy.currentHp + healed);
      const actualHeal = newEnemyHp - liveEnemy.currentHp;
      setEnemy((prev: any) => {
        const next = { ...prev, currentHp: newEnemyHp };
        enemyRef.current = next;
        return next;
      });
      addLog(`${liveEnemy.name} recupera ${actualHeal} HP!`);
      // Riposo: solo guarigione al 50%, nessun sonno
    }

    // Check Flinch inflitto dal nemico al giocatore
    if (enemyMove.meta?.flinch_chance > 0) {
      if (Math.random() * 100 < enemyMove.meta.flinch_chance) {
        setPlayerFlinch(true);
      }
    }

    // Applica effetto di stato nemico 
    const statusChance = (!enemyMove.effectChance || enemyMove.effectChance === 0) ? 100 : enemyMove.effectChance;
    if (enemyMove.statusEffect && !currentPlayerPkmn.status && Math.random() * 100 < statusChance) {
      if (isImmuneToStatus(currentPlayerPkmn.types, enemyMove.statusEffect)) {
        addLog(`${currentPlayerPkmn.name} è immune a ${enemyMove.statusEffect}!`);
      } else {
        updatePokemon(currentPlayerPkmn.id, { status: enemyMove.statusEffect });
        addLog(`${currentPlayerPkmn.name} è ora ${enemyMove.statusEffect}!`);
      }
    }

    // --- EFFECT: Stat Changes nemico (solo mosse STATUS) ---
    if (enemyMove.category === 'status' && enemyMove.stat_changes && enemyMove.stat_changes.length > 0) {
      const STAT_MAP: Record<string, string> = {
        attack: 'attack', defense: 'defense',
        'special-attack': 'spAtk', 'special-defense': 'spDef',
        speed: 'speed', accuracy: 'accuracy', evasion: 'evasion',
      };
      let playerDebuffed = false;
      let enemyBoosted = false;
      for (const sc of enemyMove.stat_changes) {
        const statKey = STAT_MAP[sc.stat.name];
        if (!statKey) continue;
        if (sc.change < 0) {
          // Mosse status con change negativo colpiscono l'avversario (es. Ruggito, Colpo Coda)
          setPlayerStages(prev => ({ ...prev, [statKey]: Math.max(-6, (prev[statKey] ?? 0) + sc.change) }));
          playerDebuffed = true;
        } else {
          // Mosse status con change positivo potenziano chi le usa (es. Danza Spada, Agilità)
          setEnemyStages(prev => ({ ...prev, [statKey]: Math.min(6, (prev[statKey] ?? 0) + sc.change) }));
          enemyBoosted = true;
        }
      }
      if (playerDebuffed) {
        setStatChanges({ label: '↓ STAT −', positive: false });
        addLog(`Le statistiche di ${currentPlayerPkmn.name} sono diminuite!`);
      }
      if (enemyBoosted) {
        setStatChanges({ label: '↑ STAT +', positive: true });
        addLog(`Le statistiche di ${liveEnemy.name} sono aumentate!`);
      }
    }

    const newPlayerHp = Math.max(0, currentPlayerPkmn.currentHp - enemyDamage);
    updatePokemon(currentPlayerPkmn.id, { currentHp: newPlayerHp });
    if (enemyDamage > 0) {
      setPlayerTookDamage(true);
      setPlayerHitAnim(true);
      setTimeout(() => setPlayerHitAnim(false), 400);
    }

    // --- RECOIL: il nemico subisce danno di rimbalzo ---
    const enemyRecoilPct = enemyMove.meta?.recoil ?? 0;
    if (enemyRecoilPct > 0 && enemyDamage > 0) {
      const enemyRecoilDmg = Math.max(1, Math.floor(enemyDamage * enemyRecoilPct / 100));
      setEnemy((prev: any) => {
        const nextHp = Math.max(0, prev.currentHp - enemyRecoilDmg);
        const next = { ...prev, currentHp: nextHp };
        enemyRef.current = next;
        addLog(`${prev.name} subisce ${enemyRecoilDmg} danni di rimbalzo!`);
        return next;
      });
    }

    // --- DRAIN: il nemico si cura in base al valore drain di PokeAPI ---
    const enemyMetaDrain = enemyMove.meta?.drain ?? 0;
    const enemyFallbackDrain = enemyMove.name?.toLowerCase().includes('assorb') ? 0.5 : 0;
    const enemyDrainRatio = (enemyMetaDrain > 0 ? enemyMetaDrain / 100 : enemyFallbackDrain);
    const isEnemyDrain = enemyDrainRatio > 0;
    if (isEnemyDrain) {
      const drainHeal = Math.floor(enemyDamage * enemyDrainRatio);
      if (drainHeal > 0) {
        const maxHp = liveEnemy.stats?.hp ?? liveEnemy.maxHp ?? 1;
        const healedHp = Math.min(maxHp, liveEnemy.currentHp + drainHeal);
        setEnemy((prev: any) => {
          const next = { ...prev, currentHp: healedHp };
          enemyRef.current = next;
          return next;
        });
        addLog(`${liveEnemy.name} ha assorbito ${drainHeal} HP!`);
      }
    } 

    await new Promise(r => setTimeout(r, 800));

    if (newPlayerHp <= 0) {
      addLog(`${currentPlayerPkmn.name} è esausto!`);
      const nextAvailable = useStore.getState().team.findIndex((p, i) => p.currentHp > 0 && i !== activeIdx);
      if (nextAvailable === -1) {
        addLog('Hai perso la sfida...');
        
        if (isTowerBattle) {
          const { abandonBattleTower, battleTower: towerState } = useStore.getState();
          const finalFloor = towerState?.currentFloor ?? 0;
          addLog(`🗼 Scalata terminata al piano ${finalFloor}!`);
          abandonBattleTower();
        } else {
          useStore.getState().team.forEach(p => {
            updatePokemon(p.id, { currentHp: 1, moves: p.moves.map((m: any) => ({ ...m, pp: m.maxPp })) });
          });
        }
        
        if (wasMasterBattle.current) setMasterBattleResult('lose');
        if (wasLeagueBattle.current) setLeagueBattleResult('lose');
        setIsFinished(true);
      } else {
        setActiveIdx(nextAvailable);
        setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
        addLog(`Vai ${team[nextAvailable].name}!`);
      }
    }

    // --- Stat changes mosse OFFENSIVE nemico ---
    // stat_chance=0 → self-drop garantito (Zuffa, Draco Meteor, ecc.)
    // stat_chance>0 e change<0 → effetto secondario sul GIOCATORE con probabilità
    // stat_chance>0 e change>0 → self-boost secondario sul NEMICO con probabilità (Pugno Meteora)
    if (enemyMove.category !== 'status' && enemyMove.stat_changes && enemyMove.stat_changes.length > 0) {
      const STAT_MAP: Record<string, string> = {
        attack: 'attack', defense: 'defense',
        'special-attack': 'spAtk', 'special-defense': 'spDef',
        speed: 'speed', accuracy: 'accuracy', evasion: 'evasion',
      };
      let statChance: number = enemyMove.meta?.stat_chance ?? 0;
      if (SELF_DROP_MOVE_IDS.has(enemyMove.id)) statChance = 0;
      for (const sc of enemyMove.stat_changes) {
        const statKey = STAT_MAP[sc.stat.name];
        if (!statKey) continue;
        if (statChance === 0) {
          // Self-drop garantito: sempre sul nemico stesso
          setEnemyStages(prev => ({ ...prev, [statKey]: Math.min(6, Math.max(-6, (prev[statKey] ?? 0) + sc.change)) }));
          if (sc.change < 0) addLog(`Le statistiche di ${liveEnemy.name} sono diminuite!`);
          if (sc.change > 0) addLog(`Le statistiche di ${liveEnemy.name} sono aumentate!`);
        } else if (Math.random() * 100 < statChance) {
          if (sc.change < 0) {
            // Effetto secondario sul giocatore (es. Crunch -DEF, Psichica -SpDef)
            setPlayerStages(prev => ({ ...prev, [statKey]: Math.max(-6, (prev[statKey] ?? 0) + sc.change) }));
            addLog(`Le statistiche di ${currentPlayerPkmn.name} sono diminuite!`);
          } else {
            // Self-boost secondario nemico (es. Pugno Meteora +ATK)
            setEnemyStages(prev => ({ ...prev, [statKey]: Math.min(6, (prev[statKey] ?? 0) + sc.change) }));
            addLog(`Le statistiche di ${liveEnemy.name} sono aumentate!`);
          }
        }
      }
    }

    // Danno da stato al nemico a fine turno 
    if (liveEnemy.status === 'PSN') {
      const psnDmg = Math.floor((liveEnemy.stats?.hp ?? liveEnemy.maxHp ?? 100) / 8); 
      const nextHp = Math.max(0, liveEnemy.currentHp - psnDmg);
      setEnemy((prev: any) => {
        const next = { ...prev, currentHp: nextHp };
        addLog(`${prev.name} soffre del veleno!`);
        enemyRef.current = next;
        return next;
      });
      if (nextHp <= 0) {
        await new Promise(r => setTimeout(r, 800));
        await processEnemyDefeat(enemyRef.current);
        return;
      }
    }
    if (liveEnemy.status === 'BRN') {
      const brnDmg = Math.floor((liveEnemy.stats?.hp ?? liveEnemy.maxHp ?? 100) / 8); 
      const nextHp = Math.max(0, liveEnemy.currentHp - brnDmg);
      setEnemy((prev: any) => {
        const next = { ...prev, currentHp: nextHp };
        addLog(`${prev.name} soffre della scottatura!`);
        enemyRef.current = next;
        return next;
      });
      if (nextHp <= 0) {
        await new Promise(r => setTimeout(r, 800));
        await processEnemyDefeat(enemyRef.current);
        return;
      }
    }

    setTurn('player');
    setIsAnimating(false);
  };

  const handleSwitchPokemon = async (idx: number) => {
    if (idx === activeIdx || !team[idx] || team[idx].currentHp <= 0) return;
    setShowTeamOverlay(false);
    setIsAnimating(true);
    addLog(`Vai ${team[idx].name}!`);
    setActiveIdx(idx);
    setPlayerTookDamage(false);
    setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
    // Dopo il cambio il nemico attacca 
    await new Promise(r => setTimeout(r, 600));
    const freshPlayerPkmn = useStore.getState().team.find((p: any) => p.id === team[idx].id) ?? team[idx];
    await executeEnemyTurn(freshPlayerPkmn);
  };

  const handleUseItem = async (itemId: string, itemName: string) => { 
    const pkm = team[activeIdx]; 
    if (!pkm) return; 
    setShowBagOverlay(false); 
    setIsAnimating(true); 

    if (itemId === 'full_heal') { 
      updatePokemon(pkm.id, { status: null, sleepTurns: undefined }); 
      addLog(`${pkm.name} è guarito dagli effetti di stato!`); 
    } else { 
      let healed = 0; 
      if (itemId === 'potion') healed = 30; 
      if (itemId === 'superpotion') healed = 80; 
      if (itemId === 'hyperpotion') healed = 200; 
      const newHp = Math.min(pkm.stats.hp, pkm.currentHp + healed); 
      updatePokemon(pkm.id, { currentHp: newHp }); 
      addLog(`${pkm.name} recupera ${Math.min(healed, pkm.stats.hp - pkm.currentHp)} HP!`); 
    } 
    useItem(itemId); 
 
    // Turno nemico — leggi stato AGGIORNATO dallo store dopo la cura 
    setTurn('enemy'); 
    await new Promise(r => setTimeout(r, 600)); 
    const freshPkm = useStore.getState().team.find(p => p.id === pkm.id) ?? pkm; 
    await executeEnemyTurn(freshPkm); 
  }; 

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 20));
  };

  const applyPlayerMoveEffects = (move: any, currentEnemy: any, realDamage = 0): { newStatus?: any, message?: string } => { 
    // --- FLINCH ---
    if (move.meta?.flinch_chance > 0) {
      if (Math.random() * 100 < move.meta.flinch_chance) {
        setEnemyFlinch(true);
      }
    }

    // --- ACCURACY / EVASION ---
    if (move.id === '139') { // Poison Gas -> example for status
       // already handled below
    }

    // --- HEALING MOVES (cura il giocatore) --- 
    // IDs ufficiali PokéAPI delle mosse di cura 
    const HEAL_MOVES: Record<string, number> = { 
      '105': 0.5,  // recover / Recupero 
      '135': 0.5,  // soft-boiled / Uovo Morbido 
      '208': 0.5,  // milk-drink / Latte Fresco 
      '303': 0.5,  // slack-off / Posa Riposo 
      '355': 0.5,  // roost / Posariposo 
      '236': 0.5,  // moonlight / Chiaro di Luna 
      '235': 0.5,  // synthesis / Sintesi 
      '234': 0.5,  // morning-sun / Alba 
      '505': 0.5,  // heal-pulse / Pulsaguarigione 
      '392': 0.25, // aqua-ring / Goccia Vitale
      '588': 0.5,  // wish / Desiderio
      '456': 0.5,  // healing-wish semplificato (Guarigionevoto)
      '273': 0.5,  // wish alternativo
    }; 
    
    // Recupera i dati freschi del Pokémon per evitare bug di HP stale se il nemico ha attaccato prima 
    const freshPkmn = useStore.getState().team.find(p => p.id === playerPkmn.id) ?? playerPkmn;

    // Riposo: cura tutto ma addormenta 
    if (move.id === '156') { 
      const healed = Math.floor(freshPkmn.stats.hp * 0.5); 
      const newHp = Math.min(freshPkmn.stats.hp, freshPkmn.currentHp + healed); 
      updatePokemon(freshPkmn.id, { currentHp: newHp }); 
      addLog(`${freshPkmn.name} si è riposato e recupera ${newHp - freshPkmn.currentHp} HP!`); 
      return {}; 
    } 
  
    const HEAL_MOVES_BY_NAME: Record<string, number> = {
      'goccia vitale': 0.25,
      'desiderio': 0.5,
      'rigenerazione': 0.5,
    };
    const healRatio = HEAL_MOVES[move.id] ?? HEAL_MOVES_BY_NAME[move.name.toLowerCase()];
    if (healRatio || (move.category === 'status' && move.power === 0 && move.name.toLowerCase().includes('recup'))) {
      const ratio = healRatio ?? 0.5; 
      const healed = Math.floor(freshPkmn.stats.hp * ratio); 
      const newHp = Math.min(freshPkmn.stats.hp, freshPkmn.currentHp + healed); 
      const actualHeal = newHp - freshPkmn.currentHp; 
      updatePokemon(freshPkmn.id, { currentHp: newHp }); 
      addLog(`${freshPkmn.name} recupera ${actualHeal} HP!`); 
      return {}; 
    } 
  
    // --- STATUS MOVES che applicano stato al nemico --- 
    if (move.category === 'status') { 
      // Haze: resetta statistiche 
      if (move.id === '114' || move.name.toLowerCase().includes('nube')) { 
        setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 }); 
        setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 }); 
        addLog('Tutte le modifiche alle statistiche sono state resettate!'); 
        return {}; 
      } 
 
      // Aromatherapy / Heal Bell: cura il team 
      if (['312', '215'].includes(move.id) || move.name.toLowerCase().includes('aromaterapia') || move.name.toLowerCase().includes('rintoccasana')) { 
        team.forEach(p => { 
          if (p.status) updatePokemon(p.id, { status: null }); 
        }); 
        addLog('Tutta la squadra è stata guarita dagli stati alterati!'); 
        return {}; 
      } 

      // --- EFFECT: Stat Changes giocatore (solo mosse STATUS) ---
      if (move.stat_changes && move.stat_changes.length > 0) {
        const STAT_MAP: Record<string, string> = {
          attack: 'attack', defense: 'defense',
          'special-attack': 'spAtk', 'special-defense': 'spDef',
          speed: 'speed', accuracy: 'accuracy', evasion: 'evasion',
        };
        let enemyDebuffed = false;
        let playerBoosted = false;
        for (const sc of move.stat_changes) {
          const statKey = STAT_MAP[sc.stat.name];
          if (!statKey) continue;
          if (sc.change < 0) {
            // Mosse status con change negativo colpiscono l'avversario (es. Ruggito, Colpo Coda)
            setEnemyStages(prev => ({ ...prev, [statKey]: Math.max(-6, (prev[statKey] ?? 0) + sc.change) }));
            enemyDebuffed = true;
          } else {
            // Mosse status con change positivo potenziano chi le usa (es. Danza Spada, Agilità)
            setPlayerStages(prev => ({ ...prev, [statKey]: Math.min(6, (prev[statKey] ?? 0) + sc.change) }));
            playerBoosted = true;
          }
        }
        if (enemyDebuffed) {
          setStatChanges({ label: '↓ STAT −', positive: false });
          addLog(`Le statistiche di ${currentEnemy?.name} sono diminuite!`);
        }
        if (playerBoosted) {
          setStatChanges({ label: '↑ STAT +', positive: true });
          addLog(`Le statistiche di ${playerPkmn.name} sono aumentate!`);
        }
      }

      // Se non ci sono stat_changes nel meta, mantieni il comportamento esistente
      // per status effect puri (già gestito sotto)
      const statusEffect = move.statusEffect ?? (move.name?.toLowerCase().includes('fulmisguardo') ? 'PAR' : undefined);
      const effectChance = (!move.effectChance || move.effectChance === 0) ? 100 : move.effectChance ?? 100;

      if (statusEffect && currentEnemy && !currentEnemy.status) { 
        if (Math.random() * 100 < effectChance) { 
          const nomi: Record<string, string> = { 
            'SLP': 'si è addormentato', 'PSN': 'è stato avvelenato', 
            'BRN': 'si è scottato', 'PAR': 'è rimasto paralizzato', 'FRZ': 'è stato congelato' 
          }; 
          return { 
            newStatus: statusEffect, 
            message: `${currentEnemy.name} ${nomi[statusEffect as string] ?? 'è stato colpito'}!` 
          };
        } else { 
          addLog('Ma non ha avuto effetto!'); 
        } 
      } else if (statusEffect && currentEnemy.status) { 
        addLog(`${currentEnemy.name} ha già un effetto di stato!`); 
      } 
      return {}; 
    } 
  
    // --- DRAIN MOVES: cura basata sul valore drain di PokeAPI (es. 50 = 50% danno) ---
    const metaDrain = move.meta?.drain ?? 0;
    const fallbackDrain = move.name?.toLowerCase().includes('assorb') ? 0.5 : 0;
    const drainRatio = (metaDrain > 0 ? metaDrain / 100 : fallbackDrain);
    const isDrain = drainRatio > 0;
    if (isDrain) {
      const freshPkmn = useStore.getState().team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn;
      const healing = Math.floor(realDamage * drainRatio);
      if (healing > 0) {
        const newHp = Math.min(freshPkmn.stats.hp, freshPkmn.currentHp + healing);
        const actualHeal = newHp - freshPkmn.currentHp;
        if (actualHeal > 0) {
          updatePokemon(freshPkmn.id, { currentHp: newHp });
          addLog(`${freshPkmn.name} ha assorbito ${actualHeal} HP!`);
        }
      }
      return {};
    }

    // --- Stat changes mosse OFFENSIVE giocatore ---
    // stat_chance=0 → self-drop garantito (Zuffa, Draco Meteor, ecc.)
    // stat_chance>0 e change<0 → effetto secondario sul NEMICO con probabilità
    // stat_chance>0 e change>0 → self-boost secondario sul GIOCATORE con probabilità (Pugno Meteora)
    if (move.category !== 'status' && move.stat_changes && move.stat_changes.length > 0) {
      const STAT_MAP: Record<string, string> = {
        attack: 'attack', defense: 'defense',
        'special-attack': 'spAtk', 'special-defense': 'spDef',
        speed: 'speed', accuracy: 'accuracy', evasion: 'evasion',
      };
      let statChance: number = move.meta?.stat_chance ?? 0;
      if (SELF_DROP_MOVE_IDS.has(move.id)) statChance = 0;
      for (const sc of move.stat_changes) {
        const statKey = STAT_MAP[sc.stat.name];
        if (!statKey) continue;
        if (statChance === 0) {
          // Self-drop garantito: sempre sul giocatore stesso
          setPlayerStages(prev => ({ ...prev, [statKey]: Math.min(6, Math.max(-6, (prev[statKey] ?? 0) + sc.change)) }));
          if (sc.change < 0) addLog(`Le statistiche di ${playerPkmn.name} sono diminuite!`);
          if (sc.change > 0) addLog(`Le statistiche di ${playerPkmn.name} sono aumentate!`);
        } else if (Math.random() * 100 < statChance) {
          if (sc.change < 0) {
            // Effetto secondario sul nemico (es. Crunch -DEF, Psichica -SpDef)
            setEnemyStages(prev => ({ ...prev, [statKey]: Math.max(-6, (prev[statKey] ?? 0) + sc.change) }));
            addLog(`Le statistiche di ${currentEnemy?.name} sono diminuite!`);
          } else {
            // Self-boost secondario giocatore (es. Pugno Meteora +ATK)
            setPlayerStages(prev => ({ ...prev, [statKey]: Math.min(6, (prev[statKey] ?? 0) + sc.change) }));
            addLog(`Le statistiche di ${playerPkmn.name} sono aumentate!`);
          }
        }
      }
    }

    // --- MOSSE OFFENSIVE con effetto stato secondario --- 
    if (move.statusEffect && !currentEnemy.status && move.effectChance) { 
      if (Math.random() * 100 < move.effectChance) { 
        const statusNames: Record<string, string> = { 
          'SLP': 'si è addormentato', 'PSN': 'è stato avvelenato', 
          'BRN': 'si è scottato', 'PAR': 'è rimasto paralizzato', 'FRZ': 'si è congelato' 
        }; 
        return { 
          newStatus: move.statusEffect, 
          message: `${currentEnemy.name} ${statusNames[move.statusEffect] ?? ''}!` 
        };
      } 
    } 
    return {};
  }; 

  const handleMove = async (move: any) => {
    if (turn !== 'player' || isFinished || isAnimating || move.pp <= 0) return;
    console.log('[Battle] Player move:', move.name);

    // --- CHECK FLINCH ---
    if (enemyFlinch) {
      addLog(`${playerPkmn.name} ha tentennato!`);
      setEnemyFlinch(false);
      setTurn('enemy');
      const fresh = (useStore.getState() as any).team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn; 
      await executeEnemyTurn(fresh);
      return;
    }

    // --- CHECK STATUS GIOCATORE ---
    if (playerPkmn.status === 'SLP') { 
      setIsAnimating(true); 
      if (Math.random() < 0.2) { 
        updatePokemon(playerPkmn.id, { status: null, sleepTurns: undefined }); 
        addLog(`${playerPkmn.name} si è svegliato!`); 
        setIsAnimating(false); 
        // si è svegliato: può attaccare normalmente, non fare return 
      } else { 
        addLog(`${playerPkmn.name} sta dormendo profondamente...`); 
        await new Promise(r => setTimeout(r, 800)); 
        setTurn('enemy'); 
        const fresh = (useStore.getState() as any).team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn; 
        await executeEnemyTurn(fresh); 
        setIsAnimating(false); 
        return; 
      } 
    } 

    if (playerPkmn.status === 'FRZ') { 
      setIsAnimating(true); 
      if (Math.random() < 0.2) { 
        updatePokemon(playerPkmn.id, { status: null }); 
        addLog(`${playerPkmn.name} si è scongelato!`); 
        setIsAnimating(false); 
        // si è scongelato: può attaccare normalmente, non fare return 
      } else { 
        addLog(`${playerPkmn.name} è congelato e non può muoversi!`); 
        await new Promise(r => setTimeout(r, 800)); 
        setTurn('enemy'); 
        await executeEnemyTurn(playerPkmn); 
        setIsAnimating(false); 
        return; 
      } 
    } 

    if (playerPkmn.status === 'PAR' && Math.random() < 0.25) { 
      setIsAnimating(true); 
      addLog(`${playerPkmn.name} è paralizzato!`); 
      await new Promise(r => setTimeout(r, 800)); 
      setTurn('enemy'); 
      await executeEnemyTurn(playerPkmn); 
      setIsAnimating(false); 
      return; 
    } 
    // --- FINE CHECK STATUS --- 

    // Accuracy Check
    const accStage = playerStages.accuracy - enemyStages.evasion;
    const accMultiplier = accStage >= 0 ? (3 + accStage) / 3 : 3 / (3 - accStage);
    const finalAccuracy = (move.accuracy || 100) * accMultiplier;

    if (move.category !== 'status' && move.accuracy && move.accuracy < 100) { 
      if (Math.random() * 100 >= finalAccuracy) { 
        setIsAnimating(true); 
        addLog(`${playerPkmn.name} usa ${move.name}!`); 
        addLog('Ma ha mancato!'); 
        await new Promise(r => setTimeout(r, 800)); 
        setTurn('enemy'); 
        await executeEnemyTurn(playerPkmn); 
        setIsAnimating(false); 
        return; 
      } 
    } 

    setIsAnimating(true);
    setAttackAnim(true);
    setTimeout(() => setAttackAnim(false), 400);

    // Scala i PP della mossa nel team 
    const updatedMoves = playerPkmn.moves.map((m: any) =>
      m.id === move.id ? { ...m, pp: Math.max(0, m.pp - 1) } : m
    );
    updatePokemon(playerPkmn.id, { moves: updatedMoves });

    // Player Turn — order by speed 
    const liveEnemyAtStartOfMove = enemyRef.current ?? enemy;
    const effPlayer = { 
      ...playerPkmn, 
      stats: { 
        ...playerPkmn.stats, 
        attack: applyStage(playerPkmn.stats.attack, playerStages.attack), 
        spAtk: applyStage(playerPkmn.stats.spAtk, playerStages.spAtk), 
        defense: applyStage(playerPkmn.stats.defense, playerStages.defense), 
        spDef: applyStage(playerPkmn.stats.spDef, playerStages.spDef), 
      } 
    }; 
    const effEnemy = { 
      ...liveEnemyAtStartOfMove, 
      stats: { 
        ...liveEnemyAtStartOfMove.stats, 
        attack: applyStage(liveEnemyAtStartOfMove.stats.attack, enemyStages.attack), 
        spAtk: applyStage(liveEnemyAtStartOfMove.stats.spAtk, enemyStages.spAtk), 
        defense: applyStage(liveEnemyAtStartOfMove.stats.defense, enemyStages.defense), 
        spDef: applyStage(liveEnemyAtStartOfMove.stats.spDef, enemyStages.spDef), 
      } 
    }; 

    const playerFirst = effPlayer.stats.speed >= (effEnemy?.stats?.speed ?? 0) || move.priority > 0;

    if (playerFirst) {
      const isCrit = Math.random() < 0.06;
      const isMultiHit = (move.meta?.min_hits ?? 1) > 1;
      const baseDmg = BattleEngine.calculateDamage(effPlayer as any, effEnemy as any, move, isCrit);
      const hitCount = isMultiHit ? 3 : 1;
      const damage = isMultiHit ? baseDmg * hitCount : baseDmg;
      const typeMultiplier = BattleEngine.getTypeEffectiveness(move.type, effEnemy.types);
      const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
      const newEnemyHp = Math.max(0, (liveEnemyAtStartOfMove?.currentHp ?? 0) - damage);

      addLog(`${playerPkmn.name} usa ${move.name}!${damage > 0 ? ` (${damage} danni)` : ''}`);
      
      // Status e Healing logica
      const { newStatus, message } = applyPlayerMoveEffects(move, liveEnemyAtStartOfMove, damage);
      if (message) addLog(message);

      if (isCrit) addLog('Brutto colpo!');
      if (effLabel && (damage > 0 || typeMultiplier === 0)) addLog(effLabel);
      if (typeMultiplier >= 2) playSound('hitSuper');
      else if (typeMultiplier > 0 && typeMultiplier < 1) playSound('hitWeak');

      // Applica stato con immunità
      let finalStatus = liveEnemyAtStartOfMove.status;
      if (newStatus && !liveEnemyAtStartOfMove.status) {
        if (isImmuneToStatus(liveEnemyAtStartOfMove.types, newStatus)) {
          addLog(`${liveEnemyAtStartOfMove.name} è immune a ${newStatus}!`);
        } else {
          finalStatus = newStatus;
        }
      }

      if (damage > 0) {
        setEnemyHitAnim(true);
        setTimeout(() => setEnemyHitAnim(false), 400);
      }

      setEnemy((prev: any) => {
        const next = { 
          ...prev, 
          currentHp: newEnemyHp,
          status: finalStatus !== undefined ? finalStatus : prev.status
        };
        enemyRef.current = next;
        return next;
      });

      // Recoil giocatore
      const recoilPctP = move.meta?.recoil ?? 0;
      if (recoilPctP > 0 && damage > 0) {
        const recoilDmgP = Math.max(1, Math.floor(damage * recoilPctP / 100));
        const freshPkmnR = useStore.getState().team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn;
        updatePokemon(freshPkmnR.id, { currentHp: Math.max(0, freshPkmnR.currentHp - recoilDmgP) });
        addLog(`${playerPkmn.name} subisce ${recoilDmgP} danni di rimbalzo!`);
      }

      await new Promise(r => setTimeout(r, 800));

      if (newEnemyHp <= 0) { 
        await processEnemyDefeat(enemyRef.current);
        return;
      }

      setTurn('enemy');
      setEnemyFlinch(false); // Reset flinch at end of turn
      const freshForEnemyTurn = useStore.getState().team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn; 
      await executeEnemyTurn(freshForEnemyTurn);
    } else {
      // Nemico più veloce: attacca prima 
      setTurn('enemy');
      const freshForEnemyTurnPre = useStore.getState().team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn;
      await executeEnemyTurn(freshForEnemyTurnPre);
      const freshPlayerPkmn = useStore.getState().team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn;
      if (freshPlayerPkmn.currentHp <= 0) {
        setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
        // NON resettare enemyStages qui: il debuff sul nemico deve restare anche se il player cambia 
        setEnemyFlinch(false);
        setPlayerFlinch(false);
        setIsAnimating(false);
        return;
      }

      // Ricontrolla status dopo il turno nemico (può aver appena applicato SLP/PAR/FRZ)
      if (freshPlayerPkmn.status === 'SLP') {
        if (Math.random() < 0.2) {
          updatePokemon(freshPlayerPkmn.id, { status: null, sleepTurns: undefined });
          addLog(`${freshPlayerPkmn.name} si è svegliato!`);
        } else {
          addLog(`${freshPlayerPkmn.name} sta dormendo profondamente...`);
          setTurn('player');
          setIsAnimating(false);
          return;
        }
      }

      if (freshPlayerPkmn.status === 'FRZ') {
        if (Math.random() < 0.2) {
          updatePokemon(freshPlayerPkmn.id, { status: null });
          addLog(`${freshPlayerPkmn.name} si è scongelato!`);
        } else {
          addLog(`${freshPlayerPkmn.name} è congelato e non può muoversi!`);
          setTurn('player');
          setIsAnimating(false);
          return;
        }
      }

      if (freshPlayerPkmn.status === 'PAR' && Math.random() < 0.25) {
        addLog(`${freshPlayerPkmn.name} è paralizzato e non riesce a muoversi!`);
        setTurn('player');
        setIsAnimating(false);
        return;
      }

      const isCrit = Math.random() < 0.06;
      const isMultiHit2 = (move.meta?.min_hits ?? 1) > 1;
      const baseDmg2 = BattleEngine.calculateDamage(effPlayer as any, effEnemy as any, move, isCrit);
      const hitCount2 = isMultiHit2 ? 3 : 1;
      const damage = isMultiHit2 ? baseDmg2 * hitCount2 : baseDmg2;
      const typeMultiplier = BattleEngine.getTypeEffectiveness(move.type, effEnemy.types);
      const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
      const currentEnemyAfterEnemyTurn = enemyRef.current ?? liveEnemyAtStartOfMove;
      const newEnemyHp = Math.max(0, (currentEnemyAfterEnemyTurn?.currentHp ?? 0) - damage);

      addLog(`${playerPkmn.name} usa ${move.name}!${damage > 0 ? ` (${damage} danni)` : ''}`);
      
      // Status e Healing logica
      const { newStatus, message } = applyPlayerMoveEffects(move, currentEnemyAfterEnemyTurn, damage);
      if (message) addLog(message);

      if (isCrit) addLog('Brutto colpo!');
      if (effLabel && (damage > 0 || typeMultiplier === 0)) addLog(effLabel);
      if (typeMultiplier >= 2) playSound('hitSuper');
      else if (typeMultiplier > 0 && typeMultiplier < 1) playSound('hitWeak');

      // Applica stato con immunità
      let finalStatus = currentEnemyAfterEnemyTurn.status;
      if (newStatus && !currentEnemyAfterEnemyTurn.status) {
        if (isImmuneToStatus(currentEnemyAfterEnemyTurn.types, newStatus)) {
          addLog(`${currentEnemyAfterEnemyTurn.name} è immune a ${newStatus}!`);
        } else {
          finalStatus = newStatus;
        }
      }

      if (damage > 0) {
        setEnemyHitAnim(true);
        setTimeout(() => setEnemyHitAnim(false), 400);
      }

      setEnemy((prev: any) => {
        const next = { 
          ...prev, 
          currentHp: newEnemyHp,
          status: finalStatus !== undefined ? finalStatus : prev.status
        };
        enemyRef.current = next;
        return next;
      });

      // Recoil giocatore (branch lento)
      const recoilPctP2 = move.meta?.recoil ?? 0;
      if (recoilPctP2 > 0 && damage > 0) {
        const recoilDmgP2 = Math.max(1, Math.floor(damage * recoilPctP2 / 100));
        const freshPkmnR2 = useStore.getState().team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn;
        updatePokemon(freshPkmnR2.id, { currentHp: Math.max(0, freshPkmnR2.currentHp - recoilDmgP2) });
        addLog(`${playerPkmn.name} subisce ${recoilDmgP2} danni di rimbalzo!`);
      }

      await new Promise(r => setTimeout(r, 800));

      if (newEnemyHp <= 0) { 
        await processEnemyDefeat(enemyRef.current);
        return;
      }
    }
    
    setEnemyFlinch(false);
    setPlayerFlinch(false);
    const freshForEndTurn = useStore.getState().team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn; 
    let finalPlayerHp = freshForEndTurn.currentHp;

    if (freshForEndTurn.status === 'BRN') { 
      const brnDmg = Math.floor(freshForEndTurn.stats.hp / 8); 
      finalPlayerHp = Math.max(0, finalPlayerHp - brnDmg);
      updatePokemon(freshForEndTurn.id, { currentHp: finalPlayerHp }); 
      addLog(`${freshForEndTurn.name} è danneggiato dalla scottatura!`); 
    } 
    if (freshForEndTurn.status === 'PSN') { 
      const psnDmg = Math.floor(freshForEndTurn.stats.hp / 8); 
      finalPlayerHp = Math.max(0, finalPlayerHp - psnDmg);
      updatePokemon(freshForEndTurn.id, { currentHp: finalPlayerHp }); 
      addLog(`${freshForEndTurn.name} è avvelenato!`); 
    } 

    if (finalPlayerHp <= 0) {
      addLog(`${freshForEndTurn.name} è esausto!`);
      const nextAvailable = useStore.getState().team.findIndex((p, i) => p.currentHp > 0 && i !== activeIdx);
      if (nextAvailable === -1) {
        addLog('Hai perso la sfida...');
        
        if (isTowerBattle) {
          const { abandonBattleTower, battleTower: towerState } = useStore.getState();
          const finalFloor = towerState?.currentFloor ?? 0;
          addLog(`🗼 Scalata terminata al piano ${finalFloor}!`);
          abandonBattleTower();
        } else {
          useStore.getState().team.forEach(p => {
            updatePokemon(p.id, { currentHp: 1, moves: p.moves.map((m: any) => ({ ...m, pp: m.maxPp })) });
          });
        }
        
        if (wasMasterBattle.current) setMasterBattleResult('lose');
        if (wasLeagueBattle.current) setLeagueBattleResult('lose');
        setIsFinished(true);
      } else {
        setActiveIdx(nextAvailable);
        setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
        addLog(`Vai ${team[nextAvailable].name}!`);
      }
    }

    setTurn('player');
    setIsAnimating(false);
  };

  if (loading || !enemy) return (
    <div className="h-full flex items-center justify-center bg-[#0f0f1a]">
      <div className="text-white/50 animate-pulse font-bold">Caricamento battaglia...</div>
    </div>
  );

  return (
    <div 
      className="h-full flex flex-col relative overflow-hidden bg-[#87ceeb]"
      onClick={() => setActiveMoveTooltip(null)}
    >
      {apiError && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-900/90 border border-red-500/50 rounded-2xl p-3 text-center text-sm font-bold text-red-200">
          ⚠️ {apiError}
          <button onClick={() => setApiError(null)} className="ml-3 underline text-xs">Chiudi</button>
        </div>
      )}
      {/* SFONDO GLOBALE — condizionale per tipo battaglia */}
      <div className="absolute inset-0 z-0">
        
        {wasTowerBattle.current && !wasLeagueBattle.current && !wasMasterBattle.current && !isFriendBattle && (
          <div className="absolute top-4 right-4 z-20 
            bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5 
            flex items-center gap-3 border border-white/10 shadow-2xl">
            <span className="text-xs font-black text-yellow-400 uppercase tracking-tighter">
              🗼 Piano {wasTowerFloor.current}
            </span>
          </div>
        )}

        {/* NORMALE / AMICO — cielo azzurro */}
        {!wasLeagueBattle.current && !wasMasterBattle.current && !isBoss && !wasTowerBattle.current && (
          <> 
            <div className="absolute inset-0" style={{ 
              background: 'linear-gradient(180deg, #1562b8 0%, #3a9ae8 30%, #72c1f2 55%, #b0dcf5 78%, #c8efc0 100%)' 
            }} /> 
            <div className="absolute pointer-events-none" style={{ 
              top: '6%', right: '16%', width: 52, height: 52, borderRadius: '50%', 
              background: '#ffe54d', 
              boxShadow: '0 0 0 8px rgba(255,220,60,0.16), 0 0 0 20px rgba(255,200,40,0.08), 0 0 50px 20px rgba(255,180,30,0.18)', 
            }} /> 
          </> 
        )}

        {/* TORRE — cielo tecnologico/notturno */}
        {wasTowerBattle.current && !wasLeagueBattle.current && !wasMasterBattle.current && (
          <div className="absolute inset-0 bg-[#1a1a3a]">
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: 'radial-gradient(circle at 50% 20%, #4a90e2 0%, transparent 70%)'
            }} />
            {/* Piccole luci tipo stelle/data-center */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-blue-400/40 rounded-full blur-[1px]"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                style={{
                  width: 2, height: 2,
                  top: `${Math.random() * 40}%`,
                  left: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>
        )}

        {/* BOSS — cielo temporalesco viola */}
        {isBoss && (
          <> 
            <div className="absolute inset-0" style={{ 
              background: 'linear-gradient(180deg, #2d1a4a 0%, #3d1f5e 35%, #5d3a8e 60%, #7a4da8 85%)' 
            }} /> 
            <motion.div 
              animate={{ opacity: [0, 0, 0.9, 0, 0, 0, 0.6, 0] }} 
              transition={{ duration: 5, repeat: Infinity, repeatDelay: 2 }} 
              className="absolute inset-0 pointer-events-none" 
              style={{ background: 'linear-gradient(118deg, rgba(200,150,255,0.28) 0%, rgba(255,255,255,0.1) 38%, transparent 58%)' }} 
            /> 
          </> 
        )}

  {/* LEGA — cielo grigio pietra medio */}
  {wasLeagueBattle.current && !wasMasterBattle.current && (
    <div className="absolute inset-0 bg-[#34345a]">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full pointer-events-none"
          animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, repeatType: "loop", delay: Math.random() * 3, ease: "easeInOut" }}
          style={{
            width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
            top: `${Math.random() * 50}%`, left: `${Math.random() * 100}%`
          }}
        />
      ))}
    </div>
  )}

  {/* MASTER — cielo blu cosmico medio */}
  {wasMasterBattle.current && (
    <div className="absolute inset-0 bg-[#20205a]">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full pointer-events-none"
          animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, repeatType: "loop", delay: Math.random() * 3, ease: "easeInOut" }}
          style={{
            width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
            top: `${Math.random() * 50}%`, left: `${Math.random() * 100}%`
          }}
        />
      ))}
    </div>
  )}

</div>

      {/* NUVOLE — solo normale e amico */}
      {!wasLeagueBattle.current && !wasMasterBattle.current && !isBoss && !wasTowerBattle.current && (
        <div className="absolute inset-x-0 top-0 z-0 pointer-events-none" style={{ height: '22%' }}>
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ x: '-320px' }}
              animate={{ x: 'calc(100vw + 320px)' }}
              transition={{
                duration: 18 + i * 6,
                repeat: Infinity,
                repeatType: "loop",
                ease: 'linear',
                delay: i === 1 ? 0 : i * 3
              }}
              className="absolute bg-white/80 rounded-full blur-sm"
              style={{
                width: 120 + i * 50,
                height: 35 + i * 12,
                top: `${8 + i * 22}%`,
                left: -300
              }}
            />
          ))}
        </div>
      )}

      {/* NUVOLE BOSS — viola scure, veloci */}
      {isBoss && (
        <div className="absolute inset-x-0 top-0 z-0 pointer-events-none" style={{ height: '22%' }}>
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ x: -300 }}
              animate={{ x: '110vw' }}
              transition={{
                duration: 10 + i * 3,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 2
              }}
              className="absolute rounded-full blur-sm"
              style={{
                width: 120 + i * 50,
                height: 35 + i * 12,
                top: `${8 + i * 22}%`,
                left: -300,
                backgroundColor: 'rgba(90, 30, 120, 0.75)'
              }}
            />
          ))}
        </div>
      )}

      {/* TERRENO — condizionale per tipo battaglia */}
      <div className="absolute inset-x-0 bottom-0 z-0" style={{ height: '78%' }}>

        {/* NORMALE / AMICO — prato chiaro */}
        {!wasLeagueBattle.current && !wasMasterBattle.current && !isBoss && !wasTowerBattle.current && (
          <>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(180deg, #5db533 0%, #4a9a20 100%)',
            }} />
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 30px',
            }} />
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 10px)'
            }} />
            <div className="absolute top-0 left-0 right-0 h-[4px]" style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1), transparent)',
            }} />
          </>
        )}

        {/* TORRE — pavimento tecnologico/arena futuristica */}
        {wasTowerBattle.current && !wasLeagueBattle.current && !wasMasterBattle.current && (
          <>
            <div className="absolute inset-0 bg-[#252545]" />
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'linear-gradient(rgba(74, 144, 226, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 144, 226, 0.4) 1px, transparent 1px)',
              backgroundSize: '40px 30px',
            }} />
            {/* Esagoni decorativi o linee tech */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #4a90e2 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }} />
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-400/40 shadow-[0_0_15px_rgba(96,165,250,0.6)]" />
          </>
        )}

        {/* BOSS — prato scuro riconoscibile */}
        {isBoss && (
          <>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(180deg, #3d6a1b 0%, #2d4a10 100%)',
            }} />
            <div className="absolute inset-0 opacity-15" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '40px 30px',
            }} />
            <div className="absolute top-0 left-0 right-0 h-[4px]" style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.2), transparent)',
            }} />
          </>
        )}

  {/* LEGA — pavimento marmo scuro con riflessi */}
  {wasLeagueBattle.current && !wasMasterBattle.current && (
    <>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #38436b 0%, #232f55 45%, #1b2446 100%)',
      }} />
      {/* venature marmo */}
      <div className="absolute inset-0 opacity-14" style={{
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 35%, transparent 72%)',
        backgroundSize: '100% 100%'
      }} />
      {/* leggero grid per effetto arena */}
      <div className="absolute inset-0 opacity-6" style={{
        backgroundImage: 'linear-gradient(rgba(190,220,255,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(190,220,255,0.45) 1px, transparent 1px)',
        backgroundSize: '36px 26px',
      }} />
      {/* linea orizzonte dorata */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,210,120,0.82), transparent)',
      }} />
      {/* riflesso dal basso */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: '34%',
        background: 'linear-gradient(0deg, rgba(130,180,255,0.22), rgba(90,130,220,0.08) 45%, transparent)',
      }} />
    </>
  )}

  {/* MASTER — pavimento spazio profondo con costellazioni */}
  {wasMasterBattle.current && (
    <>
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #313179 0%, #23245f 42%, #171847 100%)',
      }} />
      {/* bagliore cosmico centrale */}
      <div className="absolute inset-0 opacity-16" style={{
        background: 'radial-gradient(ellipse at 50% 35%, rgba(170,145,255,0.35) 0%, rgba(120,95,230,0.16) 35%, transparent 75%)',
      }} />
      {/* linea orizzonte viola intenso */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{
        background: 'linear-gradient(90deg, transparent, rgba(210,120,255,0.74), transparent)',
      }} />
      {/* riflesso viola */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: '44%',
        background: 'linear-gradient(0deg, rgba(170,100,255,0.26), rgba(120,70,220,0.12) 48%, transparent)',
      }} />
    </>
  )}

      </div>

      {/* ARENA (Contiene i Pokémon) */} 
      <div className="relative flex-1 flex flex-col z-10 overflow-hidden"> 
        {/* Tooltip mossa (nella zona verde) */}
        <AnimatePresence> 
          {activeMoveTooltip && ( 
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 10, scale: 0.95 }} 
              className="absolute left-4 right-4 z-[60] bg-[#1a1a2e]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-sm" 
              style={{ top: '40%' }} 
              onClick={(e) => e.stopPropagation()}
            > 
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-black text-sm uppercase text-white">{activeMoveTooltip.name}</h4>
                  <div className="flex gap-2 mt-1">
                    <TypeBadge type={activeMoveTooltip.type} small />
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded uppercase font-bold text-white/70">
                      {activeMoveTooltip.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-white/50">POTENZA: {activeMoveTooltip.power || '--'}</div>
                  <div className="text-[10px] font-bold text-white/50">PRECISIONE: {activeMoveTooltip.accuracy || '--'}%</div>
                </div>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed italic">
                {activeMoveTooltip.description}
              </p>
              {activeMoveTooltip.statusEffect && (
                <div className="mt-2 pt-2 border-t border-white/5 text-[10px] font-bold text-indigo-400">
                  Effetto: {activeMoveTooltip.statusEffect} ({activeMoveTooltip.effectChance || 100}%)
                </div>
              )}
            </motion.div>
          )} 
        </AnimatePresence>

        {/* Vignetta leggera */} 
        <div className="absolute inset-0 pointer-events-none" 
          style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.15)' }} 
        /> 

        {/* Enemy Pokemon Area */}
        <div className="relative pt-4 px-4 h-[34%] flex flex-col items-center">
          <div className="w-full bg-black/40 backdrop-blur rounded-2xl p-2 mb-1 max-w-[220px] self-start"> 
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            {/* Riga 1: nome + status + livello */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-black text-xs uppercase truncate max-w-[110px]">{enemy?.name}</span>
                {enemy?.status && (
                  <span className={`text-[8px] font-black px-1 py-0.5 rounded shrink-0 ${
                    enemy.status === 'SLP' ? 'bg-purple-500/40 text-purple-300' :
                    enemy.status === 'PSN' ? 'bg-purple-700/40 text-purple-200' :
                    enemy.status === 'BRN' ? 'bg-orange-500/40 text-orange-300' :
                    enemy.status === 'PAR' ? 'bg-yellow-500/40 text-yellow-300' :
                    enemy.status === 'FRZ' ? 'bg-blue-400/40 text-blue-200' : ''
                  }`}>{enemy.status}</span>
                )}
              </div>
              <span className="text-[9px] text-white/50 font-bold shrink-0">Lv. {enemy?.level}</span>
            </div>
            {/* Riga 2: tipi */}
            <div className="flex gap-1 flex-wrap">
              {enemy?.types?.map((t: string) => (
                <TypeBadge key={t} type={t as any} small />
              ))}
            </div>
            {/* Riga 3: badge stat modificate */}
            {Object.entries(enemyStages).some(([, v]) => v !== 0) && (
              <div className="flex gap-1 flex-wrap mt-0.5">
                {Object.entries(enemyStages).filter(([, v]) => v !== 0).map(([stat, val]) => (
                  <span key={stat} className={`text-[8px] font-black px-1 py-0.5 rounded ${val > 0 ? 'bg-blue-500/30 text-blue-300' : 'bg-red-500/30 text-red-300'}`}>
                    {stat.toUpperCase()} {val > 0 ? `+${val}` : val}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Ball indicators avversario */}
          {totalEnemies > 1 && (
            <div className="flex gap-1 mt-1 mb-1">
              {Array.from({ length: totalEnemies }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full border ${
                    i < enemyPhase - 1
                      ? 'bg-gray-600 border-gray-500'
                      : 'bg-red-500 border-red-400 shadow-[0_0_4px_rgba(239,68,68,0.5)]'
                  }`}
                />
              ))}
            </div>
          )}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${((enemy?.currentHp ?? 0) / (enemy?.maxHp ?? 1)) * 100}%`,
                    backgroundColor: (enemy?.currentHp / enemy?.maxHp) > 0.5 ? '#4ade80' : (enemy?.currentHp / enemy?.maxHp) > 0.2 ? '#facc15' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-[9px] font-bold text-white/70 w-12 text-right">{enemy?.currentHp}/{enemy?.maxHp}</span>
            </div>
          </div>

          <div className="relative">
            <motion.img
              key={enemyPhase}
              initial={{ x: -50, opacity: 0 }}
              animate={enemyHitAnim 
                ? { x: [-4, 4, -4, 4, 0], opacity: [1, 0.3, 1, 0.3, 1] }
                : { x: 0, y: 0, opacity: 1 }
              }
              transition={enemyHitAnim 
                ? { duration: 0.4 }
                : { duration: 0.5 }
              }
              src={enemy?.sprites?.front_default ?? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${enemy?.pokemonId}.png`}
              className="w-56 h-56 object-contain drop-shadow-2xl"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = '1';
                  img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${enemy?.pokemonId}.png`;
                }
              }}
            />
            {lastEnemyMove && (
              <div className="absolute top-full left-1/2 mt-1 -translate-x-1/2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5 whitespace-nowrap">
                <TypeBadge type={lastEnemyMove.type as any} small />
                <span className="text-[9px] text-white/70 font-bold">{lastEnemyMove.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Player Pokemon Area */}
        <div className="relative mt-auto pb-4 pl-2 pr-2 flex items-end gap-2 h-[38%]">
          <motion.img
            key={activeIdx}
            initial={{ x: 60, opacity: 0 }}
            animate={
              attackAnim 
                ? { x: [0, 15, 0], opacity: 1 }
                : playerHitAnim
                ? { x: [-4, 4, -4, 4, 0], opacity: [1, 0.3, 1, 0.3, 1] }
                : { x: 0, opacity: 1 }
            }
            transition={{ duration: 0.4 }}
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerPkmn?.isShiny ? 'shiny/' : ''}${playerPkmn?.pokemonId}.png`}
            className="w-52 h-52 object-contain drop-shadow-2xl shrink-0"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = '1';
                img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${playerPkmn?.pokemonId}.png`;
              }
            }}
          />
          <div className="flex-1 bg-black/40 backdrop-blur rounded-2xl p-3 mb-1 min-w-0 w-full">
            <div className="flex flex-col gap-0.5">
              {/* Riga 1: nome + status + livello */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-black text-xs uppercase truncate max-w-[110px]">{playerPkmn?.name}</span>
                  {playerPkmn?.status && (
                    <span className={`text-[8px] font-black px-1 py-0.5 rounded shrink-0 ${
                      playerPkmn.status === 'SLP' ? 'bg-purple-500/40 text-purple-300' :
                      playerPkmn.status === 'PSN' ? 'bg-purple-700/40 text-purple-200' :
                      playerPkmn.status === 'BRN' ? 'bg-orange-500/40 text-orange-300' :
                      playerPkmn.status === 'PAR' ? 'bg-yellow-500/40 text-yellow-300' :
                      playerPkmn.status === 'FRZ' ? 'bg-blue-400/40 text-blue-200' : ''
                    }`}>{playerPkmn.status}</span>
                  )}
                </div>
                <span className="text-[9px] text-white/50 font-bold shrink-0">Lv. {playerPkmn?.level}</span>
              </div>
              {/* Riga 2: tipi */}
              <div className="flex gap-1 flex-wrap">
                {playerPkmn?.types?.map((t: string) => (
                  <TypeBadge key={t} type={t as any} small />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-1"> 
                {Object.entries(playerStages).filter(([, v]) => v !== 0).map(([stat, val]) => ( 
                  <span key={stat} className={`text-[8px] font-black px-1 py-0.5 rounded ${val > 0 ? 'bg-blue-500/30 text-blue-300' : 'bg-red-500/30 text-red-300'}`}> 
                    {stat.toUpperCase()} {val > 0 ? `+${val}` : val} 
                  </span> 
                ))} 
              </div> 
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${((playerPkmn?.currentHp ?? 0) / (playerPkmn?.stats?.hp ?? 1)) * 100}%`,
                    backgroundColor: (playerPkmn?.currentHp / playerPkmn?.stats?.hp) > 0.5 ? '#4ade80' : (playerPkmn?.currentHp / playerPkmn?.stats?.hp) > 0.2 ? '#facc15' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-white/70 shrink-0">{playerPkmn?.currentHp}/{playerPkmn?.stats?.hp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOG + CONTROLLI */}
      <div className="bg-[#0f0f1a]/95 backdrop-blur-md border-t border-white/5 p-4 space-y-2 relative z-20 shrink-0">
        
        {/* Log */}
        <div className="bg-[#1a1a2e] rounded-xl px-3 py-2 h-[72px] overflow-y-auto flex flex-col-reverse gap-0.5 no-scrollbar">
          {logs.map((msg, i) => {
            let icon = '▸';
            let color = i === 0 ? 'text-white/80' : 'text-white/30';
            if (msg.includes('superefficace') || msg.includes('Superefficace')) { icon = '⚡'; color = i === 0 ? 'text-green-400' : 'text-green-400/40'; }
            else if (msg.includes('Non molto efficace') || msg.includes('poco efficace')) { icon = '🔻'; color = i === 0 ? 'text-orange-400' : 'text-orange-400/40'; }
            else if (msg.includes('Non ha effetto')) { icon = '🚫'; color = i === 0 ? 'text-purple-400' : 'text-purple-400/40'; }
            else if (msg.includes('esausto') || msg.includes('KO') || msg.includes('perso')) { icon = '💀'; color = i === 0 ? 'text-red-400' : 'text-red-400/40'; }
            else if (msg.includes('Brutto colpo') || msg.includes('critico')) { icon = '💥'; color = i === 0 ? 'text-yellow-400' : 'text-yellow-400/40'; }
            else if (msg.includes('mancato')) { icon = '❌'; color = i === 0 ? 'text-white/50' : 'text-white/20'; }
            else if (msg.includes('ESP') || msg.includes('LIVELLO')) { icon = '⬆️'; color = i === 0 ? 'text-blue-400' : 'text-blue-400/40'; }
            else if (msg.includes('avvelenato') || msg.includes('PSN') || msg.includes('scottato') || msg.includes('BRN') || msg.includes('paralizzato') || msg.includes('PAR') || msg.includes('addormentato') || msg.includes('SLP') || msg.includes('congelato') || msg.includes('FRZ')) { icon = '🌀'; color = i === 0 ? 'text-indigo-400' : 'text-indigo-400/40'; }
            else if (msg.includes('guarito') || msg.includes('recupera') || msg.includes('assorbito')) { icon = '💚'; color = i === 0 ? 'text-emerald-400' : 'text-emerald-400/40'; }
            else if (msg.includes('🏅') || msg.includes('Medaglia') || msg.includes('🎁')) { icon = '🏆'; color = i === 0 ? 'text-yellow-400' : 'text-yellow-400/40'; }
            return (
              <p key={i} className={`text-[11px] font-bold leading-tight flex items-start gap-1 ${color}`}>
                <span className="shrink-0 text-[10px]">{icon}</span>
                <span>{msg}</span>
              </p>
            );
          })}
        </div>

        {isFinished ? (
          <div className="space-y-2">
            {/* TORRE: mostra riepilogo diverso per vittoria vs sconfitta */}
            {wasTowerBattle.current ? (
              <>
                {/* Controlla se è vittoria (battleTower.isActive ancora true) 
                    o sconfitta (abandonBattleTower già chiamato, isActive=false) */}
                {useStore.getState().battleTower?.isActive ? (
                  // VITTORIA piano torre
                  <>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-3 text-center">
                      <p className="text-yellow-400 font-black text-sm">
                        🗼 Piano {(useStore.getState().battleTower?.currentFloor ?? 1) - 1} completato!
                      </p>
                    </div>
                    <button
                      onClick={() => setScreen('BATTLE_TOWER_SCREEN')}
                      className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-lg shadow-lg active:scale-[0.98] transition-all"
                    >
                      PROSSIMO PIANO →
                    </button>
                    <button
                      onClick={() => { abandonBattleTower(); setScreen('BATTLE_TOWER_SCREEN'); }}
                      className="w-full bg-white/5 border border-white/10 py-3 rounded-2xl font-bold text-sm text-white/40"
                    >
                      ABBANDONA TORRE
                    </button>
                  </>
                ) : (
                  // SCONFITTA torre
                  <>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center space-y-1">
                      <p className="text-red-400 font-black text-lg">💀 SCONFITTA</p>
                      <p className="text-white/50 text-sm">
                        Scalata terminata al piano {wasTowerFloor.current}
                      </p>
                      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                        Record: Piano {useStore.getState().battleTower?.bestFloor ?? 0}
                      </p>
                    </div>
                    <button
                      onClick={() => setScreen('BATTLE_TOWER_SCREEN')}
                      className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-lg shadow-lg active:scale-[0.98] transition-all"
                    >
                      TORNA ALLA TORRE
                    </button>
                  </>
                )}
              </>
            ) : (
              // Tutte le altre battaglie — comportamento invariato
              <button
                onClick={() => { 
                  clearFriendBattleTeam(); 
                  if (isLeagueBattle) {
                    setScreen('LEAGUE_BATTLE_SCREEN');
                  } else {
                    clearLeagueBattleTeam();
                    setScreen('HUB_SCREEN'); 
                  }
                }}
                className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
              >
                TORNA ALL'HUB
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {playerPkmn?.moves?.map((move: any, idx: number) => (
                <button
                  key={`${move.id}-${idx}`}
                  onPointerDown={(_e) => {
                    longPressActive.current = false;
                    tooltipTimeout.current = setTimeout(() => {
                      longPressActive.current = true;
                      setActiveMoveTooltip(move);
                    }, 600);
                  }}
                  onPointerUp={() => {
                    clearTimeout(tooltipTimeout.current);
                  }}
                  onPointerLeave={() => {
                    clearTimeout(tooltipTimeout.current);
                    if (longPressActive.current) {
                      longPressActive.current = false;
                      setActiveMoveTooltip(null);
                    }
                  }}
                  onPointerCancel={() => {
                    clearTimeout(tooltipTimeout.current);
                    longPressActive.current = false;
                    setActiveMoveTooltip(null);
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (longPressActive.current) {
                      longPressActive.current = false;
                      return;
                    }
                    if (activeMoveTooltip) {
                      setActiveMoveTooltip(null);
                      return;
                    }
                    handleMove(move);
                  }}
                  onMouseEnter={() => {
                    if (window.matchMedia('(hover: hover)').matches) {
                      tooltipTimeout.current = setTimeout(() => {
                        longPressActive.current = true;
                        setActiveMoveTooltip(move);
                      }, 300);
                    }
                  }}
                  onMouseLeave={() => {
                    if (window.matchMedia('(hover: hover)').matches) {
                      clearTimeout(tooltipTimeout.current);
                      longPressActive.current = false;
                      setActiveMoveTooltip(null);
                    }
                  }}
                  disabled={turn !== 'player' || isAnimating || move.pp <= 0}
                  className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 flex flex-col items-start justify-between active:bg-[#e63946]/20 disabled:opacity-40 transition-colors h-16"
                >
                  <div className="flex justify-between w-full items-center">
                    <span className="font-black text-xs uppercase truncate">{move.name}</span>
                    <TypeBadge type={move.type as any} small />
                  </div>
                  <div className="flex justify-between w-full items-center mt-1">
                    <span className="text-[10px] opacity-50 uppercase font-bold">{move.category}</span>
                    <span className="text-[10px] font-bold">PP {move.pp}/{move.maxPp}</span>
                  </div>
                </button>
              ))}
              {Array.from({ length: 4 - (playerPkmn?.moves?.length ?? 0) }).map((_, i) => (
                <div key={i} className="bg-[#1a1a2e]/30 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-[10px] opacity-20 italic h-16">
                  Slot Vuoto
                </div>
              ))}
            </div>

            {/* Bottoni azione */}
            <div className="flex gap-2">
              {!isLeagueBattle && !isMasterBattle && (
                <button
                  disabled={isAnimating}
                  onClick={() => { clearFriendBattleTeam(); setScreen('HUB_SCREEN'); }}
                  className="flex-1 bg-red-600/20 border border-red-500/30 py-3 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black uppercase text-red-400"
                >
                  <ArrowLeft size={14} /> Fuga
                </button>
              )}
              <button
                disabled={isAnimating}
                onClick={() => setShowTeamOverlay(true)}
                className="flex-1 bg-indigo-600/20 border border-indigo-500/30 py-3 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black uppercase"
              >
                <ArrowLeftRight size={14} /> Squadra
              </button>
              <button
                disabled={isAnimating}
                onClick={() => setShowBagOverlay(true)}
                className="flex-1 bg-emerald-600/20 border border-emerald-500/30 py-3 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black uppercase"
              >
                <Backpack size={14} /> Zaino
              </button>
            </div>
          </>
        )}
      </div>

      {/* OVERLAY SQUADRA */}
      <AnimatePresence>
        {showTeamOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#1a1a2e] rounded-t-3xl p-6 space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-lg">CAMBIA POKÉMON</h3>
                <button onClick={() => setShowTeamOverlay(false)} className="p-2 bg-white/10 rounded-xl">
                  <X size={18} />
                </button>
              </div>
              {team.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => handleSwitchPokemon(idx)}
                  disabled={idx === activeIdx || p.currentHp <= 0}
                  className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all disabled:opacity-40 ${
                    idx === activeIdx ? 'border-[#e63946] bg-[#e63946]/10' : 'border-white/10 bg-white/5 active:bg-white/10'
                  }`}
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`}
                    className="w-12 h-12 object-contain"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-black text-sm uppercase">{p.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-white/10 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-green-400"
                          style={{ width: `${(p.currentHp / p.stats.hp) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white/50">{p.currentHp}/{p.stats.hp}</span>
                    </div>
                  </div>
                  {idx === activeIdx && <span className="text-[10px] text-[#e63946] font-bold">IN CAMPO</span>}
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAY ZAINO */}
      <AnimatePresence>
        {showBagOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col justify-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#1a1a2e] rounded-t-3xl p-6 space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-lg">ZAINO</h3>
                <button onClick={() => setShowBagOverlay(false)} className="p-2 bg-white/10 rounded-xl">
                  <X size={18} />
                </button>
              </div>
              {[ 
                { id: 'potion', name: 'Pozione', heal: 30, icon: '🧪' }, 
                { id: 'superpotion', name: 'Superpozione', heal: 80, icon: '🧪' }, 
                { id: 'hyperpotion', name: 'Iperpozione', heal: 200, icon: '💊' }, 
                { id: 'full_heal', name: 'Cura Totale', heal: 0, icon: '💊' }, 
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => handleUseItem(item.id, item.name)}
                  disabled={!inventory[item.id] || inventory[item.id] <= 0}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl border border-white/10 bg-white/5 active:bg-white/10 disabled:opacity-30 transition-all"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-black text-sm">{item.name}</div>
                    <div className="text-[10px] text-white/50">Ripristina {item.heal} HP</div>
                  </div>
                  <span className="text-sm font-bold text-white/60">x{inventory[item.id] ?? 0}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
