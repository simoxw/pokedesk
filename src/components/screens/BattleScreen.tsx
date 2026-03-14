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
  const { team, setScreen, incrementStat, addCoins, updatePokemon, inventory, useItem, gainExp, currentBattlePath, recordBattleWin } = useStore();
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
  const [playerStages, setPlayerStages] = useState({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }); 
  const [enemyStages, setEnemyStages] = useState({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }); 
  const [activeMoveTooltip, setActiveMoveTooltip] = useState<any>(null);
  const tooltipTimeout = React.useRef<any>(null);

  const playerPkmn = team[activeIdx];
  const isBoss = currentBattlePath.nextIsBoss;

  const applyStageMultiplier = (baseStat: number, stage: number) => { 
    const mult = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage); 
    return Math.floor(baseStat * mult); 
  }; 

  const getEffectivePlayer = () => ({
    ...playerPkmn,
    stats: {
      ...playerPkmn.stats,
      attack: applyStageMultiplier(playerPkmn.stats.attack, playerStages.attack),
      defense: applyStageMultiplier(playerPkmn.stats.defense, playerStages.defense),
      spAtk: applyStageMultiplier(playerPkmn.stats.spAtk, playerStages.spAtk),
      spDef: applyStageMultiplier(playerPkmn.stats.spDef, playerStages.spDef),
      speed: applyStageMultiplier(playerPkmn.stats.speed, playerStages.speed),
    }
  });

  const getEffectiveEnemy = () => ({
    ...enemy,
    stats: {
      ...enemy.stats,
      attack: applyStageMultiplier(enemy.stats.attack, enemyStages.attack),
      defense: applyStageMultiplier(enemy.stats.defense, enemyStages.defense),
      spAtk: applyStageMultiplier(enemy.stats.spAtk, enemyStages.spAtk),
      spDef: applyStageMultiplier(enemy.stats.spDef, enemyStages.spDef),
      speed: applyStageMultiplier(enemy.stats.speed, enemyStages.speed),
    }
  });

  useEffect(() => {
    const initBattle = async () => {
      setLoading(true);
      
      // Generate random enemy trainer pkmn (Gen 1-4 weighted)
      const roll = Math.random();
      const id = roll < 0.50 ? Math.floor(Math.random() * 151) + 1    // Gen 1: 50% 
                : roll < 0.75 ? Math.floor(Math.random() * 100) + 152  // Gen 2: 25% 
                : roll < 0.90 ? Math.floor(Math.random() * 135) + 252  // Gen 3: 15% 
                :               Math.floor(Math.random() * 107) + 387; // Gen 4: 10%
                
      const data = await api.getPokemon(id);
      const species = await api.getSpecies(id);
      
      let level = Math.max(5, playerPkmn.level + Math.floor(Math.random() * 3 - 1));
      let enemyName = api.getItalianName(species.names);

      if (isBoss) {
        level = playerPkmn.level + 5;
        enemyName = "Capopalestra";
        addLog("⚔️ SFIDA CAPOPALESTRA!");
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

      setEnemy({
        ...data,
        name: enemyName,
        level,
        currentHp: stats.hp,
        maxHp: stats.hp,
        stats,
        moves,
        types: data.types.map((t: any) => t.type.name),
      });
      setLoading(false);
    };
    initBattle();
  }, []);

  const executeEnemyTurn = async (currentPlayerPkmn: any) => {
    if (!enemy || enemy.currentHp <= 0) return;
    await new Promise(r => setTimeout(r, 800));

    const validMoves = enemy.moves.filter((m: any) => m.pp > 0 && m.category !== 'status');
    const enemyMove = validMoves.length > 0 
      ? validMoves[Math.floor(Math.random() * validMoves.length)] 
      : { name: 'Lotta', type: 'normal', power: 40, category: 'physical', pp: 1, maxPp: 1, id: '0', accuracy: 100, priority: 0, description: '' };

    // PAR: 25% skip 
    if (currentPlayerPkmn.status === 'PAR' && Math.random() < 0.25) {
      addLog(`${currentPlayerPkmn.name} è paralizzato e non riesce a muoversi!`);
      setTurn('player');
      setIsAnimating(false);
      return;
    }
    // SLP: 20% chance di svegliarsi ogni turno (come FRZ) 
    if (currentPlayerPkmn.status === 'SLP') { 
      if (Math.random() < 0.2) { 
        updatePokemon(currentPlayerPkmn.id, { status: null, sleepTurns: undefined }); 
        addLog(`${currentPlayerPkmn.name} si è svegliato!`); 
      } else { 
        addLog(`${currentPlayerPkmn.name} sta dormendo profondamente...`); 
        setTurn('player'); 
        setIsAnimating(false); 
        return; 
      } 
    }
    // FRZ: 20% unfreeze else skip 
    if (currentPlayerPkmn.status === 'FRZ') {
      if (Math.random() < 0.2) {
        updatePokemon(currentPlayerPkmn.id, { status: null });
        addLog(`${currentPlayerPkmn.name} si è scongelato!`);
      } else {
        addLog(`${currentPlayerPkmn.name} è congelato!`);
        setTurn('player');
        setIsAnimating(false);
        return;
      }
    }

    addLog(`${enemy.name} usa ${enemyMove.name}!`);
    const enemyDamage = BattleEngine.calculateDamage(enemy, currentPlayerPkmn, enemyMove, false);
    const typeMultiplier = BattleEngine.getTypeEffectiveness(enemyMove.type, currentPlayerPkmn.types);
    const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
    if (effLabel) addLog(effLabel);

    // Applica effetto di stato nemico 
    if (enemyMove.statusEffect && !currentPlayerPkmn.status && Math.random() * 100 < (enemyMove.effectChance || 0)) {
      updatePokemon(currentPlayerPkmn.id, { status: enemyMove.statusEffect });
      addLog(`${currentPlayerPkmn.name} è ora ${enemyMove.statusEffect}!`);
    }

    const newPlayerHp = Math.max(0, currentPlayerPkmn.currentHp - enemyDamage);
    updatePokemon(currentPlayerPkmn.id, { currentHp: newPlayerHp });

    // BRN danno fine turno 
    if (currentPlayerPkmn.status === 'BRN') {
      const brnDmg = Math.floor(currentPlayerPkmn.stats.hp / 8);
      const brnHp = Math.max(0, newPlayerHp - brnDmg);
      updatePokemon(currentPlayerPkmn.id, { currentHp: brnHp });
      addLog(`${currentPlayerPkmn.name} è danneggiato dalla scottatura!`);
    }
    // PSN danno fine turno 
    if (currentPlayerPkmn.status === 'PSN') {
      const psnDmg = Math.floor(currentPlayerPkmn.stats.hp / 8);
      const psnHp = Math.max(0, newPlayerHp - psnDmg);
      updatePokemon(currentPlayerPkmn.id, { currentHp: psnHp });
      addLog(`${currentPlayerPkmn.name} è danneggiato dal veleno!`);
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
    if (enemy.status === 'PSN') { 
      const psnDmg = Math.floor(enemy.maxHp / 8); 
      setEnemy((prev: any) => { 
        const newHp = Math.max(0, prev.currentHp - psnDmg); 
        addLog(`${prev.name} soffre del veleno!`); 
        if (newHp <= 0) { 
          // vittoria per veleno - gestisci come sconfitta nemico normale 
          addLog(`${prev.name} è esausto per il veleno!`); 
        } 
        return { ...prev, currentHp: newHp }; 
      }); 
    } 
    if (enemy.status === 'BRN') { 
      const brnDmg = Math.floor(enemy.maxHp / 8); 
      setEnemy((prev: any) => { 
        const newHp = Math.max(0, prev.currentHp - brnDmg); 
        addLog(`${prev.name} soffre della scottatura!`); 
        return { ...prev, currentHp: newHp }; 
      }); 
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
    await executeEnemyTurn(team[idx]);
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
      if (itemId === 'potion') healed = 20; 
      if (itemId === 'superpotion') healed = 50; 
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

  const applyPlayerMoveEffects = (move: any, currentEnemy: any): { newStatus?: any, message?: string } => { 
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
        setTimeout(() => setStatChanges(null), 2500);
        addLog(`Le statistiche di ${playerPkmn.name} sono aumentate!`);
      } else if (DEBUFF_IDS.has(move.id)) {
        setEnemyStages(prev => ({ ...prev, attack: Math.max(-6, prev.attack - 1) }));
        setStatChanges({ label: '↓ STAT −', positive: false });
        setTimeout(() => setStatChanges(null), 2500);
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

    // --- CHECK STATUS GIOCATORE: blocca il turno se necessario --- 
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
        await executeEnemyTurn(useStore.getState().team.find((p: any) => p.id === playerPkmn.id) ?? playerPkmn); 
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
      addLog(`${playerPkmn.name} è paralizzato e non riesce a muoversi!`); 
      await new Promise(r => setTimeout(r, 800)); 
      setTurn('enemy'); 
      await executeEnemyTurn(playerPkmn); 
      setIsAnimating(false); 
      return; 
    } 
    // --- FINE CHECK STATUS --- 

    // Controllo accuratezza 
    if (move.category !== 'status' || move.accuracy < 100) { 
      const acc = move.accuracy ?? 100; 
      if (Math.random() * 100 >= acc) { 
        setIsAnimating(true);
        addLog(`${playerPkmn.name} usa ${move.name}!`); 
        addLog('Ma ha mancato il bersaglio!'); 
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
    const effectivePlayer = getEffectivePlayer();
    const effectiveEnemy = getEffectiveEnemy();
    const playerFirst = effectivePlayer.stats.speed >= (effectiveEnemy?.stats?.speed ?? 0) || move.priority > 0;

    if (playerFirst) {
      const isCrit = Math.random() < 0.06;
      const damage = BattleEngine.calculateDamage(effectivePlayer as any, effectiveEnemy as any, move, isCrit);
      const typeMultiplier = BattleEngine.getTypeEffectiveness(move.type, effectiveEnemy.types);
      const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
      const newEnemyHp = Math.max(0, (enemy?.currentHp ?? 0) - damage);

      addLog(`${playerPkmn.name} usa ${move.name}!`);
      const { newStatus, message } = applyPlayerMoveEffects(move, enemy);
      if (message) addLog(message);

      if (isCrit) addLog('Brutto colpo!');
      if (effLabel) addLog(effLabel);

      setEnemy((prev: any) => ({ 
        ...prev, 
        currentHp: newEnemyHp,
        status: newStatus || prev.status
      }));
      await new Promise(r => setTimeout(r, 800));

      if (newEnemyHp <= 0) {
        addLog(`${enemy.name} è esausto!`);
        recordBattleWin();
        if (isBoss) {
          addLog("🏅 Medaglia conquistata!");
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
        const baseExp = enemy.base_experience || 100; 
        const exp = BattleEngine.calculateExp(baseExp, enemy.level);
        addLog(`${playerPkmn.name} guadagna ${exp} ESP!`);
        const levelBefore = playerPkmn.level;
        gainExp(playerPkmn.id, exp);
        // Leggi lo stato aggiornato direttamente dallo store 
        const newLevel = (useStore.getState() as any).team.find((p: any) => p.id === playerPkmn.id)?.level;
        if (newLevel && newLevel > levelBefore) {
          addLog(`⬆️ ${playerPkmn.name} è salito al livello ${newLevel}!`);
        }
        addCoins(50);
        incrementStat('totalBattles');
        team.forEach(p => {
          const recoveredHp = Math.min(p.stats.hp, p.currentHp + Math.floor(p.stats.hp * 0.3));
          const recoveredMoves = p.moves.map((m: any) => ({ ...m, pp: m.maxPp }));
          updatePokemon(p.id, { currentHp: recoveredHp, moves: recoveredMoves });
        });
        setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 });
        setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 });
        setIsFinished(true);
        setIsAnimating(false);
        return;
      }

      setTurn('enemy');
      await executeEnemyTurn(playerPkmn);
    } else {
      // Nemico più veloce: attacca prima 
      setTurn('enemy');
      await executeEnemyTurn(playerPkmn);
      if (playerPkmn.currentHp <= 0) {
        setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 });
        setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 });
        setIsAnimating(false);
        return;
      }

      const isCrit = Math.random() < 0.06;
      const damage = BattleEngine.calculateDamage(effectivePlayer as any, effectiveEnemy as any, move, isCrit);
      const typeMultiplier = BattleEngine.getTypeEffectiveness(move.type, effectiveEnemy.types);
      const effLabel = BattleEngine.getTypeEffectivenessLabel(typeMultiplier);
      const newEnemyHp = Math.max(0, (enemy?.currentHp ?? 0) - damage);

      addLog(`${playerPkmn.name} usa ${move.name}!`);
      const { newStatus, message } = applyPlayerMoveEffects(move, enemy);
      if (message) addLog(message);

      if (isCrit) addLog('Brutto colpo!');
      if (effLabel) addLog(effLabel);

      setEnemy((prev: any) => ({ 
        ...prev, 
        currentHp: newEnemyHp,
        status: newStatus || prev.status
      }));
      await new Promise(r => setTimeout(r, 800));

      if (newEnemyHp <= 0) {
        addLog(`${enemy.name} è esausto!`);
        recordBattleWin();
        if (isBoss) {
          addLog("🏅 Medaglia conquistata!");
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
        const baseExp = enemy.base_experience || 100;
        const exp = BattleEngine.calculateExp(baseExp, enemy.level);
        addLog(`${playerPkmn.name} guadagna ${exp} ESP!`);
        const levelBefore = playerPkmn.level;
        gainExp(playerPkmn.id, exp);
        // Leggi lo stato aggiornato direttamente dallo store 
        const newLevel = (useStore.getState() as any).team.find((p: any) => p.id === playerPkmn.id)?.level;
        if (newLevel && newLevel > levelBefore) {
          addLog(`⬆️ ${playerPkmn.name} è salito al livello ${newLevel}!`);
        }
        addCoins(50);
        incrementStat('totalBattles');
        team.forEach(p => {
          const recoveredHp = Math.min(p.stats.hp, p.currentHp + Math.floor(p.stats.hp * 0.3));
          const recoveredMoves = p.moves.map((m: any) => ({ ...m, pp: m.maxPp }));
          updatePokemon(p.id, { currentHp: recoveredHp, moves: recoveredMoves });
        });
        setPlayerStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 });
        setEnemyStages({ attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 });
        setIsFinished(true);
        setIsAnimating(false);
        return;
      }
    }

    // BRN danno fine turno giocatore 
    if (playerPkmn.status === 'BRN') {
      const brnDmg = Math.floor(playerPkmn.stats.hp / 8);
      updatePokemon(playerPkmn.id, { currentHp: Math.max(0, playerPkmn.currentHp - brnDmg) });
      addLog(`${playerPkmn.name} è danneggiato dalla scottatura!`);
    }
    if (playerPkmn.status === 'PSN') {
      const psnDmg = Math.floor(playerPkmn.stats.hp / 8);
      updatePokemon(playerPkmn.id, { currentHp: Math.max(0, playerPkmn.currentHp - psnDmg) });
      addLog(`${playerPkmn.name} è avvelenato!`);
    }

    // PAR: 25% skip turno 
    if (playerPkmn.status === 'PAR' && Math.random() < 0.25) {
      addLog(`${playerPkmn.name} è paralizzato!`);
      setIsAnimating(false);
      setTurn('player');
      return;
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
    <div className="h-full flex flex-col relative overflow-hidden bg-[#1a1a2e]">

      {/* ARENA */} 
      <div className="relative overflow-hidden" style={{ flex: '0 0 62%' }}> 
        {/* Sfondo cielo battaglia */} 
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(180deg, #0d0d2b 0%, #1a1a5e 35%, #2d3580 60%, #1a3a5c 100%)' 
        }} /> 

        {/* Stelle animate */} 
        {Array.from({ length: 20 }).map((_, i) => ( 
          <motion.div 
            key={i} 
            animate={{ opacity: [0.1, 0.6, 0.1] }} 
            transition={{ duration: 1.5 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }} 
            className="absolute rounded-full bg-white" 
            style={{ 
              width: Math.random() * 2 + 1, 
              height: Math.random() * 2 + 1, 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 50}%`, 
            }} 
          /> 
        ))} 

        {/* Terreno — striscia orizzonte */} 
        <div className="absolute left-0 right-0" style={{ 
          bottom: '25%', 
          height: '2px', 
          background: 'linear-gradient(90deg, transparent, rgba(100,180,255,0.2), rgba(100,180,255,0.4), rgba(100,180,255,0.2), transparent)', 
        }} /> 

        {/* Suolo scuro */} 
        <div className="absolute bottom-0 left-0 right-0" style={{ 
          height: '25%', 
          background: 'linear-gradient(180deg, #0a1a0f 0%, #050d08 100%)', 
        }} /> 

        {/* Griglia suolo */} 
        <div className="absolute bottom-0 left-0 right-0" style={{ 
          height: '25%', 
          backgroundImage: 'linear-gradient(rgba(0,255,100,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.04) 1px, transparent 1px)', 
          backgroundSize: '30px 20px', 
        }} /> 

        {/* Vignetta */} 
        <div className="absolute inset-0 pointer-events-none" 
          style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }} 
        /> 

        {/* Enemy Pokemon */}
        <div className="absolute top-6 right-6 left-6">
          <div className="bg-black/40 backdrop-blur rounded-2xl p-3 mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase">{enemy?.name}</span>
                {enemy?.status && ( 
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ml-2 ${ 
                    enemy.status === 'SLP' ? 'bg-purple-500/40 text-purple-300' : 
                    enemy.status === 'PSN' ? 'bg-purple-700/40 text-purple-200' : 
                    enemy.status === 'BRN' ? 'bg-orange-500/40 text-orange-300' : 
                    enemy.status === 'PAR' ? 'bg-yellow-500/40 text-yellow-300' : 
                    enemy.status === 'FRZ' ? 'bg-blue-400/40 text-blue-200' : '' 
                  }`}>{enemy.status}</span> 
                )} 
                <div className="flex gap-1">
                  {enemy?.types?.map((t: string) => (
                    <TypeBadge key={t} type={t as any} small />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/50 font-bold">Lv. {enemy?.level}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/10 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${((enemy?.currentHp ?? 0) / (enemy?.maxHp ?? 1)) * 100}%`,
                    backgroundColor: (enemy?.currentHp / enemy?.maxHp) > 0.5 ? '#4ade80' : (enemy?.currentHp / enemy?.maxHp) > 0.2 ? '#facc15' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-white/70 w-16 text-right">{enemy?.currentHp}/{enemy?.maxHp}</span>
            </div>
          </div>

          <motion.img
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            src={enemy?.sprites?.front_default}
            className="w-44 h-44 object-contain mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Player Pokemon */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
          <motion.img
            animate={attackAnim ? { x: [0, 15, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${playerPkmn?.isShiny ? 'shiny/' : ''}${playerPkmn?.pokemonId}.png`}
            className="w-36 h-36 object-contain drop-shadow-2xl"
          />
          <div className="flex-1 bg-black/40 backdrop-blur rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-sm uppercase">{playerPkmn?.name}</span>
                {playerPkmn?.status && ( 
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ml-2 ${ 
                    playerPkmn.status === 'SLP' ? 'bg-purple-500/40 text-purple-300' : 
                    playerPkmn.status === 'PSN' ? 'bg-purple-700/40 text-purple-200' : 
                    playerPkmn.status === 'BRN' ? 'bg-orange-500/40 text-orange-300' : 
                    playerPkmn.status === 'PAR' ? 'bg-yellow-500/40 text-yellow-300' : 
                    playerPkmn.status === 'FRZ' ? 'bg-blue-400/40 text-blue-200' : '' 
                  }`}>{playerPkmn.status}</span> 
                )} 
                {playerPkmn?.types?.map((t: string) => (
                  <TypeBadge key={t} type={t as any} small />
                ))}
              </div>
              <span className="text-[10px] bg-[#e63946] px-2 py-0.5 rounded-full font-bold">Lv.{playerPkmn?.level}</span>
            </div>
            {statChanges && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-[10px] font-black px-2 py-0.5 rounded-full w-fit mb-1 ${statChanges.positive ? 'bg-blue-500/30 text-blue-300' : 'bg-red-500/30 text-red-300'}`}
              >
                {statChanges.label}
              </motion.div>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 bg-white/10 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${((playerPkmn?.currentHp ?? 0) / (playerPkmn?.stats?.hp ?? 1)) * 100}%`,
                    backgroundColor: (playerPkmn?.currentHp / playerPkmn?.stats?.hp) > 0.5 ? '#4ade80' : (playerPkmn?.currentHp / playerPkmn?.stats?.hp) > 0.2 ? '#facc15' : '#ef4444'
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-white/70">{playerPkmn?.currentHp}/{playerPkmn?.stats?.hp} HP</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOG + CONTROLLI */}
      <div className="bg-[#0f0f1a] border-t border-white/5 p-4 space-y-3 relative">
        
        {/* Tooltip mossa */}
        <AnimatePresence>
          {activeMoveTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-4 right-4 bottom-full mb-4 z-[60] bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 shadow-2xl"
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
                  onClick={() => {
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
                { id: 'potion', name: 'Pozione', heal: 20, icon: '🧪' }, 
                { id: 'superpotion', name: 'Superpozione', heal: 50, icon: '🧪' }, 
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
