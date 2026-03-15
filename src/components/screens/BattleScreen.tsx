import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { api } from '../../api';
import { BattleEngine } from '../../BattleEngine';
import { CatchEngine } from '../../CatchEngine';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Backpack, ArrowLeftRight, Shield, ArrowLeft, X, Heart } from 'lucide-react';
import HPBar from '../ui/HPBar';
import TypeBadge from '../ui/TypeBadge';
import confetti from 'canvas-confetti';

export default function BattleScreen() {
  const { team, setScreen, incrementStat, addCoins, addItem, updatePokemon, inventory, useItem, gainExp, currentBattlePath, recordBattleWin, medals, expShareActive } = useStore();
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
  const [statChanges, setStatChanges] = useState<{ label: string; positive: boolean } | null>(null);
  const [playerStages, setPlayerStages] = useState<Record<string, number>>({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 }); 
  const [enemyStages, setEnemyStages] = useState<Record<string, number>>({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 }); 
  const [enemyFlinch, setEnemyFlinch] = useState(false);
  const [playerFlinch, setPlayerFlinch] = useState(false);
  const [enemyPhase, setEnemyPhase] = useState(1); 
  const [enemy2, setEnemy2] = useState<any>(null); 
  const [activeMoveTooltip, setActiveMoveTooltip] = useState<any>(null);
  const tooltipTimeout = React.useRef<any>(null);
  const enemyRef = React.useRef<any>(null);
  enemyRef.current = enemy;

  const playerPkmn = team[activeIdx];
  const isBoss = currentBattlePath.nextIsBoss;

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
    const s = Math.max(-6, Math.min(6, stage)); 
    return Math.floor(base * (s >= 0 ? (2 + s) / 2 : 2 / (2 - s))); 
  }; 

  const isImmuneToStatus = (pokemonTypes: string[], status: string): boolean => { 
    if (status === 'BRN' && pokemonTypes.includes('fire')) return true; 
    if (status === 'PAR' && pokemonTypes.includes('electric')) return true; 
    if (status === 'FRZ' && pokemonTypes.includes('ice')) return true; 
    if (status === 'PSN' && (pokemonTypes.includes('poison') || pokemonTypes.includes('steel'))) return true; 
    return false; 
  }; 

  useEffect(() => {
    const initBattle = async () => {
      setLoading(true);
      
      // Gen sbloccate progressivamente con le medaglie 
      const getRandomPokemonId = (medals: number): number => { 
        const ranges: Array<{min: number, max: number, weight: number}> = [ 
          { min: 1, max: 151, weight: 40 }, 
        ]; 
        if (medals >= 1)  ranges.push({ min: 152, max: 251, weight: 25 }); 
        if (medals >= 5)  ranges.push({ min: 252, max: 386, weight: 20 }); 
        if (medals >= 10) ranges.push({ min: 387, max: 493, weight: 15 }); 
        if (medals >= 20) ranges.push({ min: 494, max: 649, weight: 10 }); 
        if (medals >= 30) ranges.push({ min: 650, max: 721, weight: 5  }); 

        const totalWeight = ranges.reduce((sum, r) => sum + r.weight, 0); 
        let roll = Math.random() * totalWeight; 
        for (const range of ranges) { 
          roll -= range.weight; 
          if (roll <= 0) { 
            return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min; 
          } 
        } 
        return Math.floor(Math.random() * 151) + 1; 
      }; 
      
      const id = getRandomPokemonId(medalsCount);
                
      const data = await api.getPokemon(id);
      const species = await api.getSpecies(id);
      
      const teamAvgLevel = team.reduce((acc, p) => acc + p.level, 0) / team.length; 
      const variance = Math.floor(Math.random() * 5) - 2; // da -2 a +2 
      let level = Math.max(5, Math.floor(teamAvgLevel + variance)); 
      let enemyName = api.getItalianName(species.names);

      if (isBoss) { 
        level = playerPkmn.level + 3; 
        enemyName = "Capopalestra"; 
        addLog("⚔️ SFIDA CAPOPALESTRA! (2 Pokémon)"); 
 
        // Carica il secondo Pokémon del boss 
        const id2 = getRandomPokemonId(medalsCount); 
        const data2 = await api.getPokemon(id2); 
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
          name: "Capopalestra 2°", 
          level, 
          currentHp: stats2.hp, 
          maxHp: stats2.hp, 
          stats: stats2, 
          moves: moves2, 
          types: data2.types.map((t: any) => t.type.name), 
        }); 
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
      setLoading(false);
    };
    initBattle();
  }, []);

  const processEnemyDefeat = async (defeatedEnemy: any) => {
    const currentPkm = team[activeIdx];
    const baseExp = defeatedEnemy.base_experience || 100; 
    const exp = BattleEngine.calculateExp(baseExp, defeatedEnemy.level); 
    addLog(`${defeatedEnemy.name} è esausto! ${currentPkm.name} guadagna ${exp} ESP!`); 
    const levelBefore = currentPkm.level; 
    gainExp(currentPkm.id, exp); 
    // EV gain per il Pokémon attivo 
    const freshActive = useStore.getState().team.find((p: any) => p.id === currentPkm.id) ?? currentPkm; 
    applyEvGain(freshActive, defeatedEnemy); 
    
    if (expShareActive) { 
      const halfExp = Math.max(1, Math.floor(exp / 2)); 
      useStore.getState().team.forEach((p: any) => { 
        if (p.id !== currentPkm.id && p.currentHp > 0) gainExp(p.id, halfExp); 
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
      setEnemyPhase(2); 
      setEnemy(enemy2); 
      enemyRef.current = enemy2; 
      setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 }); 
      setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 }); 
      setTurn('player'); 
      setIsAnimating(false); 
      return true; // continue battle
    } 

    recordBattleWin(); 
    if (isBoss) { 
      addLog("🏅 Medaglia conquistata!"); 
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); 
      addCoins(Math.floor(500 + (defeatedEnemy?.level ?? 5) * 2)); 
      addItem('megaball', 1); 
      addItem('full_heal', 2); 
      addItem('superpotion', 2); 
      if (Math.random() < 0.10) addItem('rare_candy', 1); 
      if (Math.random() < 0.10) addItem('ultraball', 1); 
      // Condividi ESP: premio unico per aver completato tutte le 40 medaglie 
      const bossesWon = useStore.getState().medals.filter((m: any) => m.isUnlocked).length; 
      if (bossesWon === 40 && (useStore.getState().inventory['exp_share'] || 0) === 0) { 
        addItem('exp_share', 1); 
        addLog('🏆 Hai completato tutte le palestre! Ottieni il Condividi ESP!'); 
      } 
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
    team.forEach(p => { 
      const isActive = p.id === currentPkm.id; 
      const recoveredHp = isActive 
        ? Math.min(p.stats.hp, p.currentHp + Math.floor(p.stats.hp * 0.1)) 
        : p.currentHp; 
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
    await new Promise(r => setTimeout(r, 800));
    const liveEnemy = enemyRef.current ?? enemy;
    if (!liveEnemy || liveEnemy.currentHp <= 0) return;

    const validMoves = liveEnemy.moves.filter((m: any) => 
      m.pp > 0 && (m.category !== 'status' || !!m.statusEffect) 
    );
    
    // Costruisci pool pesato: mosse super efficaci 3x, normali 1x, non efficaci 0.5x 
    const movePool: any[] = []; 
    validMoves.forEach((m: any) => { 
      const eff = BattleEngine.getTypeEffectiveness(m.type, currentPlayerPkmn.types); 
      const weight = eff > 1 ? 3 : eff < 1 ? 1 : 2; 
      for (let i = 0; i < weight; i++) movePool.push(m); 
    }); 
    
    const enemyMove = movePool.length > 0 
      ? movePool[Math.floor(Math.random() * movePool.length)] 
      : { name: 'Lotta', type: 'normal', power: 40, category: 'physical', pp: 1, maxPp: 1, id: '0', accuracy: 100, priority: 0, description: '' };

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
    const enemyDamage = BattleEngine.calculateDamage(effEnemyAtk as any, effPlayerDef as any, enemyMove, false);
    addLog(`${liveEnemy.name} usa ${enemyMove.name}!${enemyDamage > 0 ? ` (${enemyDamage} danni)` : ''}`);
    const typeMultiplier = BattleEngine.getTypeEffectiveness(enemyMove.type, currentPlayerPkmn.types);
    const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
    if (effLabel && enemyDamage > 0) addLog(effLabel);

    // Applica effetto di stato nemico 
    if (enemyMove.statusEffect && !currentPlayerPkmn.status && Math.random() * 100 < (enemyMove.effectChance || 0)) {
      if (isImmuneToStatus(currentPlayerPkmn.types, enemyMove.statusEffect)) { 
        addLog(`${currentPlayerPkmn.name} è immune a ${enemyMove.statusEffect}!`); 
      } else { 
        updatePokemon(currentPlayerPkmn.id, { status: enemyMove.statusEffect }); 
        addLog(`${currentPlayerPkmn.name} è ora ${enemyMove.statusEffect}!`); 
      } 
    }

    const newPlayerHp = Math.max(0, currentPlayerPkmn.currentHp - enemyDamage);
    updatePokemon(currentPlayerPkmn.id, { currentHp: newPlayerHp });

    // --- DRAIN: il nemico si cura di metà del danno inflitto --- 
    const ENEMY_DRAIN_MOVES = new Set([ 
      'mega-drain', 'giga-drain', 'absorb', 'leech-life', 
      'drain-punch', 'dream-eater', 'horn-leech', 'oblivion-wing', 
    ]); 
    if ( 
      ENEMY_DRAIN_MOVES.has(enemyMove.name.toLowerCase().replace(/ /g, '-')) || 
      ENEMY_DRAIN_MOVES.has(enemyMove.id) 
    ) { 
      const drainHeal = Math.floor(enemyDamage / 2); 
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
      const nextAvailable = team.findIndex((p, i) => p.currentHp > 0 && i !== activeIdx);
      if (nextAvailable === -1) {
        addLog('Hai perso la sfida...');
        setIsFinished(true);
      } else {
        setActiveIdx(nextAvailable);
        addLog(`Vai ${team[nextAvailable].name}!`);
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
    setLogs(prev => [msg, ...prev].slice(0, 5));
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
    const HEAL_MOVES: Record<string, number> = { 
      'recover': 0.5,       // Recupero: 50% HP max 
      'soft-boiled': 0.5, 
      'milk-drink': 0.5, 
      'slack-off': 0.5, 
      'roost': 0.5, 
      'moonlight': 0.5, 
      'synthesis': 0.5, 
      'morning-sun': 0.5, 
      'shore-up': 0.5, 
      'life-dew': 0.25, 
      'heal-pulse': 0.5, 
    }; 
    
    // Riposo: cura tutto ma addormenta 
    if (move.name.toLowerCase() === 'riposo' || move.id === '156') { 
      const healedHp = playerPkmn.stats.hp; 
      updatePokemon(playerPkmn.id, { 
        currentHp: healedHp, 
        status: 'SLP', 
        sleepTurns: 2, 
      }); 
      addLog(`${playerPkmn.name} si è riposato e si è curato completamente!`); 
      addLog(`${playerPkmn.name} si è addormentato!`); 
      return {}; 
    } 
  
    const healRatio = HEAL_MOVES[move.name.toLowerCase().replace(/ /g, '-')]; 
    if (healRatio || (move.category === 'status' && move.power === 0 && move.name.toLowerCase().includes('recup'))) { 
      const ratio = healRatio ?? 0.5; 
      const healed = Math.floor(playerPkmn.stats.hp * ratio); 
      const newHp = Math.min(playerPkmn.stats.hp, playerPkmn.currentHp + healed); 
      const actualHeal = newHp - playerPkmn.currentHp; 
      updatePokemon(playerPkmn.id, { currentHp: newHp }); 
      addLog(`${playerPkmn.name} recupera ${actualHeal} HP!`); 
      return {}; 
    } 
  
    // --- STATUS MOVES che applicano stato al nemico --- 
    if (move.category === 'status') { 
      // Boost/Debuff reale
      const BOOST_IDS = new Set(['14','97','133','347','104','116','219','317']); 
      const DEBUFF_IDS = new Set(['45','43','39','246','50','186','204']); 

      if (BOOST_IDS.has(move.id)) {
        setPlayerStages(prev => ({ ...prev, attack: Math.min(6, prev.attack + 2) }));
        setStatChanges({ label: '↑ STAT +', positive: true });
        addLog(`Le statistiche di ${playerPkmn.name} sono aumentate!`);
      } else if (DEBUFF_IDS.has(move.id)) {
        setEnemyStages(prev => ({ ...prev, attack: Math.max(-6, prev.attack - 1) }));
        setStatChanges({ label: '↓ STAT −', positive: false });
        addLog(`Le statistiche di ${currentEnemy?.name} sono diminuite!`);
      }

      if (move.statusEffect && currentEnemy && !currentEnemy.status) { 
        const chance = (!move.effectChance || move.effectChance === 0) ? 100 : move.effectChance; 
        if (Math.random() * 100 < chance) { 
          const nomi: Record<string, string> = { 
            'SLP': 'si è addormentato', 'PSN': 'è stato avvelenato', 
            'BRN': 'si è scottato', 'PAR': 'è rimasto paralizzato', 'FRZ': 'si è congelato' 
          }; 
          return { 
            newStatus: move.statusEffect, 
            message: `${currentEnemy.name} ${nomi[move.statusEffect as string] ?? 'è stato colpito'}!` 
          };
        } else { 
          addLog('Ma non ha avuto effetto!'); 
        } 
      } else if (move.statusEffect && currentEnemy.status) { 
        addLog(`${currentEnemy.name} ha già un effetto di stato!`); 
      } 
      return {}; 
    } 
  
    // --- DRAIN MOVES: danno + cura metà danno --- 
    const DRAIN_MOVES = new Set([ 
      'mega-drain', 'giga-drain', 'absorb', 'leech-life', 
      'drain-punch', 'dream-eater', 'horn-leech', 'oblivion-wing', 
    ]); 
    if (DRAIN_MOVES.has(move.name.toLowerCase().replace(/ /g, '-')) || 
        DRAIN_MOVES.has(move.id)) { 
      const healing = Math.floor(realDamage / 2); 
      if (healing > 0) { 
        const newHp = Math.min(playerPkmn.stats.hp, playerPkmn.currentHp + healing); 
        const actualHeal = newHp - playerPkmn.currentHp; 
        if (actualHeal > 0) { 
          updatePokemon(playerPkmn.id, { currentHp: newHp }); 
          addLog(`${playerPkmn.name} ha assorbito ${actualHeal} HP!`); 
        } 
      } 
      return {}; 
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
      const damage = BattleEngine.calculateDamage(effPlayer as any, effEnemy as any, move, isCrit);
      const typeMultiplier = BattleEngine.getTypeEffectiveness(move.type, effEnemy.types);
      const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
      const newEnemyHp = Math.max(0, (liveEnemyAtStartOfMove?.currentHp ?? 0) - damage);

      addLog(`${playerPkmn.name} usa ${move.name}!${damage > 0 ? ` (${damage} danni)` : ''}`);
      
      // Status e Healing logica
      const { newStatus, message } = applyPlayerMoveEffects(move, liveEnemyAtStartOfMove, damage);
      if (message) addLog(message);

      if (isCrit) addLog('Brutto colpo!');
      if (effLabel && damage > 0) addLog(effLabel);

      // Applica stato con immunità
      let finalStatus = enemy.status;
      if (newStatus && !enemy.status) {
        if (isImmuneToStatus(enemy.types, newStatus)) {
          addLog(`${enemy.name} è immune a ${newStatus}!`);
        } else {
          finalStatus = newStatus;
        }
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
        setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 });
        setEnemyFlinch(false);
        setPlayerFlinch(false);
        setIsAnimating(false);
        return;
      }

      const isCrit = Math.random() < 0.06;
      const damage = BattleEngine.calculateDamage(effPlayer as any, effEnemy as any, move, isCrit);
      const typeMultiplier = BattleEngine.getTypeEffectiveness(move.type, effEnemy.types);
      const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
      const currentEnemyAfterEnemyTurn = enemyRef.current ?? liveEnemyAtStartOfMove;
      const newEnemyHp = Math.max(0, (currentEnemyAfterEnemyTurn?.currentHp ?? 0) - damage);

      addLog(`${playerPkmn.name} usa ${move.name}!${damage > 0 ? ` (${damage} danni)` : ''}`);
      
      // Status e Healing logica
      const { newStatus, message } = applyPlayerMoveEffects(move, currentEnemyAfterEnemyTurn, damage);
      if (message) addLog(message);

      if (isCrit) addLog('Brutto colpo!');
      if (effLabel && damage > 0) addLog(effLabel);

      // Applica stato con immunità
      let finalStatus = enemy.status;
      if (newStatus && !enemy.status) {
        if (isImmuneToStatus(enemy.types, newStatus)) {
          addLog(`${enemy.name} è immune a ${newStatus}!`);
        } else {
          finalStatus = newStatus;
        }
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
      const nextAvailable = team.findIndex((p, i) => p.currentHp > 0 && i !== activeIdx);
      if (nextAvailable === -1) {
        addLog('Hai perso la sfida...');
        setIsFinished(true);
      } else {
        setActiveIdx(nextAvailable);
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
      {/* SFONDO GLOBALE (Cielo Azzurro) */}
      <div className="absolute inset-0 z-0" style={{ 
        background: 'linear-gradient(180deg, #4fa8ff 0%, #87ceeb 40%, #b0e2ff 60%)' 
      }} />

      {/* Nuvole animate (Globali) */} 
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ x: -200 }}
            animate={{ x: '100vw' }}
            transition={{ duration: 25 + i * 8, repeat: Infinity, ease: 'linear', delay: i * 5 }}
            className="absolute bg-white/60 rounded-full blur-2xl"
            style={{ 
              width: 150 + i * 60, 
              height: 50 + i * 20, 
              top: `${10 + i * 15}%`,
              left: -200
            }}
          />
        ))}
      </div>

      {/* TERRENO (PRATO VERDE) GLOBALE - SOTTO TUTTO */}
      <div className="absolute inset-x-0 bottom-0 z-0" style={{ height: '75%' }}>
        {/* Prato verde scuro/naturale */} 
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(180deg, #3d7a25 0%, #2d5a1b 100%)', 
        }} /> 
        {/* Griglia prato (molto sottile) */} 
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
          backgroundSize: '40px 30px', 
        }} /> 
        {/* Linea Orizzonte (Sfumata) */}
        <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1), transparent)', 
        }} />
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
        <div className="relative pt-6 px-6 h-[40%] flex flex-col items-center">
          <div className="w-full bg-black/40 backdrop-blur rounded-2xl p-3 mb-2 max-w-[260px] self-start"> 
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase truncate max-w-[120px]">{enemy?.name}</span>
                {enemy?.status && ( 
                  <span className={`text-[8px] font-black px-1 py-0.5 rounded ${ 
                    enemy.status === 'SLP' ? 'bg-purple-500/40 text-purple-300' : 
                    enemy.status === 'PSN' ? 'bg-purple-700/40 text-purple-200' : 
                    enemy.status === 'BRN' ? 'bg-orange-500/40 text-orange-300' : 
                    enemy.status === 'PAR' ? 'bg-yellow-500/40 text-yellow-300' : 
                    enemy.status === 'FRZ' ? 'bg-blue-400/40 text-blue-200' : '' 
                  }`}>{enemy.status}</span> 
                )} 
                <div className="flex gap-1 flex-wrap"> 
                  {enemy?.types?.map((t: string) => ( 
                    <TypeBadge key={t} type={t as any} small /> 
                  ))} 
                  {Object.entries(enemyStages).filter(([, v]) => v !== 0).map(([stat, val]) => ( 
                    <span key={stat} className={`text-[8px] font-black px-1 py-0.5 rounded ${val > 0 ? 'bg-blue-500/30 text-blue-300' : 'bg-red-500/30 text-red-300'}`}> 
                      {stat.toUpperCase()} {val > 0 ? `+${val}` : val} 
                    </span> 
                  ))} 
                </div> 
              </div>
              <span className="text-[10px] text-white/50 font-bold shrink-0">Lv. {enemy?.level}</span>
            </div>
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

          <motion.img
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            src={enemy?.sprites?.front_default}
            className="w-40 h-40 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Player Pokemon Area */}
        <div className="relative mt-auto pb-6 pl-6 pr-3 flex items-end gap-3 h-[45%]">
          <motion.img
            animate={attackAnim ? { x: [0, 15, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerPkmn?.isShiny ? 'shiny/' : ''}${playerPkmn?.pokemonId}.png`}
            className="w-36 h-36 object-contain drop-shadow-2xl shrink-0"
          />
          <div className="flex-1 bg-black/40 backdrop-blur rounded-2xl p-4 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-sm uppercase truncate max-w-[140px]">{playerPkmn?.name}</span>
                {playerPkmn?.status && ( 
                  <span className={`text-[9px] font-black px-1 py-0.5 rounded ${ 
                    playerPkmn.status === 'SLP' ? 'bg-purple-500/40 text-purple-300' : 
                    playerPkmn.status === 'PSN' ? 'bg-purple-700/40 text-purple-200' : 
                    playerPkmn.status === 'BRN' ? 'bg-orange-500/40 text-orange-300' : 
                    playerPkmn.status === 'PAR' ? 'bg-yellow-500/40 text-yellow-300' : 
                    playerPkmn.status === 'FRZ' ? 'bg-blue-400/40 text-blue-200' : '' 
                  }`}>{playerPkmn.status}</span> 
                )} 
                {playerPkmn?.types?.slice(0, 1).map((t: string) => (
                  <TypeBadge key={t} type={t as any} small />
                ))}
              </div>
              <span className="text-[10px] bg-[#e63946] px-2 py-0.5 rounded-full font-bold shrink-0">Lv.{playerPkmn?.level}</span>
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
      <div className="bg-[#0f0f1a]/95 backdrop-blur-md border-t border-white/5 p-4 space-y-3 relative z-20 shrink-0">
        
        {/* Log */}
        <div className="bg-[#1a1a2e] rounded-xl px-4 py-2 min-h-[36px] flex items-center">
          <p className="text-sm font-bold text-white/80">{logs[0]}</p>
        </div>

        {isFinished ? (
          <button
            onClick={() => setScreen('HUB_SCREEN')}
            className="w-full bg-[#e63946] py-4 rounded-2xl font-black text-lg"
          >
            TORNA ALL'HUB
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {playerPkmn?.moves?.map((move: any) => (
                <button
                  key={move.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeMoveTooltip) {
                      setActiveMoveTooltip(null);
                      return;
                    }
                    handleMove(move);
                  }}
                  onMouseEnter={() => {
                    tooltipTimeout.current = setTimeout(() => setActiveMoveTooltip(move), 300);
                  }}
                  onMouseLeave={() => {
                    clearTimeout(tooltipTimeout.current);
                    setActiveMoveTooltip(null);
                  }}
                  onPointerDown={() => {
                    tooltipTimeout.current = setTimeout(() => setActiveMoveTooltip(move), 500);
                  }}
                  onPointerUp={() => {
                    clearTimeout(tooltipTimeout.current);
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
              <button
                disabled={isAnimating}
                onClick={() => setScreen('HUB_SCREEN')}
                className="flex-1 bg-red-600/20 border border-red-500/30 py-3 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black uppercase text-red-400"
              >
                <ArrowLeft size={14} /> Fuga
              </button>
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
