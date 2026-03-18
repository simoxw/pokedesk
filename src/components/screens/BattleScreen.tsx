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
  const [enemy3, setEnemy3] = useState<any>(null);
  const [activeMoveTooltip, setActiveMoveTooltip] = useState<any>(null);
  const tooltipTimeout = React.useRef<any>(null);
  const longPressActive = React.useRef(false);
  const enemyRef = React.useRef<any>(null);
  enemyRef.current = enemy;
  const [apiError, setApiError] = useState<string | null>(null);

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
      try {
        setLogs(['Inizia la battaglia!']);
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

          if (medalsCount >= 21) {
            addLog("⚔️ Capopalestra potente (3 Pokémon)!");
            const id3 = getRandomPokemonId(medalsCount);
            const data3 = await api.getPokemon(id3);
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
              name: "Capopalestra 3°",
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
        setLoading(false);
        useStore.getState().updatePokedex(id, 'seen');
      } catch (err: any) {
        setLoading(false);
        if (err.message === 'OFFLINE') {
          setApiError('Sei offline. Connettiti per continuare.');
        } else {
          setApiError('Errore di connessione. Riprova tra qualche secondo.');
        }
      }
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

    if (isBoss && enemyPhase === 2 && enemy3) {
      addLog(`⚔️ Il Capopalestra lancia il terzo Pokémon!`);
      setEnemyPhase(3);
      setEnemy(enemy3);
      enemyRef.current = enemy3;
      setPlayerStages({ attack:0, defense:0, spAtk:0, spDef:0, speed:0, accuracy:0, evasion:0 });
      setEnemyStages({ attack:0, defense:0, spAtk:0, spDef:0, speed:0, accuracy:0, evasion:0 });
      setTurn('player');
      setIsAnimating(false);
      return true;
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
    const statusChance = (!enemyMove.effectChance || enemyMove.effectChance === 0) ? 100 : enemyMove.effectChance;
    if (enemyMove.statusEffect && !currentPlayerPkmn.status && Math.random() * 100 < statusChance) {
      if (isImmuneToStatus(currentPlayerPkmn.types, enemyMove.statusEffect)) {
        addLog(`${currentPlayerPkmn.name} è immune a ${enemyMove.statusEffect}!`);
      } else {
        updatePokemon(currentPlayerPkmn.id, { status: enemyMove.statusEffect });
        addLog(`${currentPlayerPkmn.name} è ora ${enemyMove.statusEffect}!`);
      }
    }

    const newPlayerHp = Math.max(0, currentPlayerPkmn.currentHp - enemyDamage);
    updatePokemon(currentPlayerPkmn.id, { currentHp: newPlayerHp });

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
  
    const healRatio = HEAL_MOVES[move.id]; 
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
      // Usa i dati veri dalla mossa (move.stat_changes o move.meta.stat_changes). Se non ci sono, usa fallback per alcuni casi (es: Barriera).
      let statChangesData: Array<{ change: number; stat: { name: string } }> =
        move.stat_changes ?? move.meta?.stat_changes ?? [];
      if (statChangesData.length === 0) {
        const lowerName = move.name?.toLowerCase() ?? '';
        if (move.id === '112' || lowerName.includes('barriera') || lowerName.includes('barrier')) {
          statChangesData = [{ change: 2, stat: { name: 'defense' } }];
        }
      }
      const STAT_MAP: Record<string, string> = {
        attack: 'attack',
        defense: 'defense',
        'special-attack': 'spAtk',
        'special-defense': 'spDef',
        speed: 'speed',
        accuracy: 'accuracy',
        evasion: 'evasion',
      };

      let playerBoosted = false;
      let enemyDebuffed = false;

      for (const sc of statChangesData) {
        const statKey = STAT_MAP[sc.stat.name];
        if (!statKey) continue;

        if (sc.change > 0) {
          // Boost al giocatore
          setPlayerStages(prev => ({
            ...prev,
            [statKey]: Math.min(6, (prev[statKey] ?? 0) + sc.change),
          }));
          playerBoosted = true;
        } else if (sc.change < 0) {
          // Debuff al nemico
          setEnemyStages(prev => ({
            ...prev,
            [statKey]: Math.max(-6, (prev[statKey] ?? 0) + sc.change),
          }));
          enemyDebuffed = true;
        }
      }

      if (playerBoosted) {
        setStatChanges({ label: '↑ STAT +', positive: true });
        addLog(`Le statistiche di ${playerPkmn.name} sono aumentate!`);
      }
      if (enemyDebuffed) {
        setStatChanges({ label: '↓ STAT −', positive: false });
        addLog(`Le statistiche di ${currentEnemy?.name} sono diminuite!`);
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
      const healing = Math.floor(realDamage * drainRatio);
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
      let finalStatus = liveEnemyAtStartOfMove.status;
      if (newStatus && !liveEnemyAtStartOfMove.status) {
        if (isImmuneToStatus(liveEnemyAtStartOfMove.types, newStatus)) {
          addLog(`${liveEnemyAtStartOfMove.name} è immune a ${newStatus}!`);
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
      let finalStatus = currentEnemyAfterEnemyTurn.status;
      if (newStatus && !currentEnemyAfterEnemyTurn.status) {
        if (isImmuneToStatus(currentEnemyAfterEnemyTurn.types, newStatus)) {
          addLog(`${currentEnemyAfterEnemyTurn.name} è immune a ${newStatus}!`);
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
      const nextAvailable = useStore.getState().team.findIndex((p, i) => p.currentHp > 0 && i !== activeIdx);
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
      {apiError && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-900/90 border border-red-500/50 rounded-2xl p-3 text-center text-sm font-bold text-red-200">
          ⚠️ {apiError}
          <button onClick={() => setApiError(null)} className="ml-3 underline text-xs">Chiudi</button>
        </div>
      )}
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
            className="absolute bg-white/35 rounded-full blur-xl"
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
      <div className="absolute inset-x-0 bottom-0 z-0" style={{ height: '78%' }}>
        {/* Prato verde scuro/naturale */} 
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(180deg, #4d9a2a 0%, #3a7a25 100%)', 
        }} /> 
        {/* Griglia prato (molto sottile) */} 
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
          backgroundSize: '40px 30px', 
        }} /> 
        {/* Sottile texture a spighe (erba) */} 
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 10px)'
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
            className="w-48 h-48 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Player Pokemon Area */}
        <div className="relative mt-auto pb-4 pl-2 pr-2 flex items-end gap-2 h-[38%]">
          <motion.img
            animate={attackAnim ? { x: [0, 15, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerPkmn?.isShiny ? 'shiny/' : ''}${playerPkmn?.pokemonId}.png`}
            className="w-44 h-44 object-contain drop-shadow-2xl shrink-0"
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
        <div className="bg-[#1a1a2e] rounded-xl px-4 py-2 min-h-[44px] flex flex-col justify-center gap-0.5">
          <p className="text-sm font-bold text-white/80 leading-tight">{logs[0]}</p>
          {logs[1] && (
            <p className="text-xs text-white/40 leading-tight">{logs[1]}</p>
          )}
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
                  onPointerDown={(e) => {
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
