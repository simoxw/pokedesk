import { useEffect, useRef } from 'react'; 
 import { useStore } from './store'; 
 
 export function useLoadingWatchdog(isLoading: boolean, timeoutMs = 35000) { 
   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); 
   const setScreen = useStore(s => s.setScreen); 
 
   useEffect(() => { 
     if (!isLoading) { 
       if (timerRef.current) clearTimeout(timerRef.current); 
       return; 
     } 
     timerRef.current = setTimeout(() => { 
       console.warn('[PokéDesk] Watchdog: schermata bloccata, torno alla home'); 
       setScreen('HUB_SCREEN'); 
     }, timeoutMs); 
     return () => { 
       if (timerRef.current) clearTimeout(timerRef.current); 
     }; 
   }, [isLoading]); 
 } 
