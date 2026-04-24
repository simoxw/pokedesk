import { useEffect, useRef } from 'react'; 
 import { Pokemon } from './types'; 
 
 function preloadImage(url: string): Promise<void> { 
   return new Promise((resolve) => { 
     // Se già in cache browser, resolve immediato 
     const img = new Image(); 
     img.onload = () => resolve(); 
     img.onerror = () => resolve(); // Fail silenzioso 
     img.src = url; 
   }); 
 } 
 
 function getSpriteUrls(pokemon: Pokemon): string[] { 
   const id = pokemon.pokemonId; 
   const urls: string[] = []; 
 
   // Sprite back (battaglia) — priorità massima 
   urls.push( 
     `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png` 
   ); 
   if (pokemon.isShiny) { 
     urls.push( 
       `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/${id}.png` 
     ); 
   } 
 
   // Sprite front (UI) 
   urls.push( 
     `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png` 
   ); 
   if (pokemon.isShiny) { 
     urls.push( 
       `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png` 
     ); 
   } 
 
   return urls; 
 } 
 
 async function throttledImageQueue(urls: string[], delayMs = 100) { 
   for (const url of urls) { 
     await preloadImage(url); 
     await new Promise(r => setTimeout(r, delayMs)); 
   } 
 } 
 
 export function useImagePreloader(team: Pokemon[], box: Pokemon[]) { 
   const preloadedRef = useRef<Set<number>>(new Set()); 
 
   useEffect(() => { 
     if (team.length === 0) return; 
 
     const startPreload = () => { 
       // Team prima — sprite batch e back sprite 
       const teamUrls = team 
         .filter(p => !preloadedRef.current.has(p.pokemonId)) 
         .flatMap(p => { 
           preloadedRef.current.add(p.pokemonId); 
           return getSpriteUrls(p); 
         }); 
 
       // Box: solo sprite front dei primi 20, bassa priorità 
       const boxUrls = box 
         .slice(0, 20) 
         .filter(p => !preloadedRef.current.has(p.pokemonId)) 
         .flatMap(p => { 
           preloadedRef.current.add(p.pokemonId); 
           return [ 
             `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png` 
           ]; 
         }); 
 
       // Team in parallelo (sono pochi, max 4) 
       // Box in sequenza throttled per non stressare la rete 
       if (teamUrls.length > 0 || boxUrls.length > 0) {
         console.log(`[ImagePreloader] Preloading ${teamUrls.length} team sprites and ${boxUrls.length} box sprites`);
         Promise.all(teamUrls.map(preloadImage)).catch(() => {}); 
         throttledImageQueue(boxUrls, 150).then(() => console.log('[ImagePreloader] Finished')); 
       }
     }; 
 
     if ('requestIdleCallback' in window) { 
       const id = (window as any).requestIdleCallback(startPreload, { timeout: 4000 }); 
       return () => (window as any).cancelIdleCallback(id); 
     } else { 
       const id = setTimeout(startPreload, 2500); 
       return () => clearTimeout(id); 
     } 
   }, [team.length]); 
 } 
