import { useEffect, useRef } from 'react'; 
 import { api } from './api'; 
 import { Pokemon } from './types'; 
 
 // Coda con rate limiting: max 1 richiesta ogni 150ms 
 // per non stressare PokeAPI su mobile con connessione debole 
 async function throttledQueue(tasks: (() => Promise<any>)[], delayMs = 150) { 
   for (const task of tasks) { 
     try { 
       await task(); 
     } catch { 
       // Fail silenzioso — è solo preloading, non blocca nulla 
     } 
     await new Promise(r => setTimeout(r, delayMs)); 
   } 
 } 
 
 export function usePreloader(team: Pokemon[], box: Pokemon[]) { 
   const preloadedRef = useRef<Set<number>>(new Set()); 
 
   useEffect(() => { 
     if (team.length === 0) return; 
 
     // Usa requestIdleCallback se disponibile (non blocca UI) 
     // fallback setTimeout 2s per lasciar respirare il boot 
     const startPreload = () => { 
       const toPreload = [...team, ...box.slice(0, 10)] 
         .filter(p => !preloadedRef.current.has(p.pokemonId)) 
         .map(p => p.pokemonId); 
 
       if (toPreload.length === 0) return; 
 
       const tasks = toPreload.flatMap(pokemonId => [ 
         async () => { 
           const data = await api.getPokemon(pokemonId); 
           preloadedRef.current.add(pokemonId); 
           return data; 
         }, 
         async () => { 
           const data = await api.getPokemon(pokemonId); 
           const species = await api.getSpecies(pokemonId); 
           // Precarichiamo anche le mosse al livello corrente del Pokémon 
           const pokemon = team.find(p => p.pokemonId === pokemonId) 
             ?? box.find(p => p.pokemonId === pokemonId); 
           if (pokemon) { 
             await api.getPokemonMoves(data, pokemon.level); 
           } 
           return species; 
         }, 
       ]); 
 
       throttledQueue(tasks, 200); 
     }; 
 
     if ('requestIdleCallback' in window) { 
       const id = (window as any).requestIdleCallback(startPreload, { timeout: 3000 }); 
       return () => (window as any).cancelIdleCallback(id); 
     } else { 
       const id = setTimeout(startPreload, 2000); 
       return () => clearTimeout(id); 
     } 
   }, [team.length]); // Rilancia solo se cambia la dimensione del team 
 } 
