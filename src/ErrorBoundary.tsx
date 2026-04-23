import React from 'react'; 
 
 interface State { hasError: boolean; error?: Error } 
 
 export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> { 
   state: State = { hasError: false }; 
 
   static getDerivedStateFromError(error: Error): State { 
     return { hasError: true, error }; 
   } 
 
   componentDidCatch(error: Error) { 
     console.error('[PokéDesk] Crash:', error); 
   } 
 
   render() { 
     if (!this.state.hasError) return this.props.children; 
     return ( 
       <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center p-6 gap-6 text-white"> 
         <div className="text-6xl">⚠️</div> 
         <div className="text-center"> 
           <h2 className="text-xl font-black mb-2">Qualcosa è andato storto</h2> 
           <p className="text-white/40 text-sm mb-1">Il gioco ha incontrato un errore inaspettato.</p> 
           <p className="text-white/20 text-xs">Il tuo salvataggio è al sicuro.</p> 
         </div> 
         <button 
           onClick={() => { this.setState({ hasError: false }); window.location.hash = ''; }} 
           className="bg-[#e63946] px-8 py-4 rounded-2xl font-black text-lg" 
         > 
           TORNA ALLA HOME 
         </button> 
         <button 
           onClick={() => window.location.reload()} 
           className="text-white/30 text-sm underline" 
         > 
           Ricarica l'app 
         </button> 
         {this.state.error && ( 
           <p className="text-[10px] text-white/20 font-mono text-center max-w-xs break-all"> 
             {this.state.error.message} 
           </p> 
         )} 
       </div> 
     ); 
   } 
 } 
