# Struttura del Progetto Pokedesk

Pokedesk è un'app web avanzata che simula l'esperienza Pokémon, sviluppata con **React 19**, **TypeScript** e **Vite**. È configurata come PWA (Progressive Web App) per un'esperienza nativa su dispositivi mobili.

## Cartella Radice
- **index.html**: Punto di ingresso dell'app. Contiene i meta tag PWA, link al manifest e script di caricamento.
- **metadata.json**: Informazioni di versione e configurazione della build.
- **package.json**: Gestione dipendenze (Zustand, Tailwind 4, Motion, GenAI) e script npm.
- **README.md**: Documentazione principale con feature e tech stack.
- **tsconfig.json**: Configurazione del compilatore TypeScript.
- **vite.config.ts**: Configurazione del bundler con plugin React e impostazioni PWA.

## public/ (Asset Statici)
- **manifest.json**: Configurazione per l'installabilità (icone, colori, orientamento).
- **sw.js**: Service Worker per il caching offline e strategia "cache-first" per PokeAPI.
- **ic_icons**: Icone dell'app in vari formati.

## src/ (Codice Sorgente)

### Logica Core
- **api.ts**: Interfaccia di comunicazione con PokeAPI. Gestisce:
    - Traduzioni automatiche in **Italiano** (nomi, mosse, descrizioni).
    - Logica di **evoluzione** (per livello, strumenti o scambio simulato).
    - Caching LRU per minimizzare il traffico dati.
- **BattleEngine.ts**: Motore matematico per le battaglie. Calcola danni, priorità, modificatori di stato e crescita delle statistiche (IV/EV).
- **CatchEngine.ts**: Gestisce le probabilità di cattura, generazione di Nature, Shiny rate e sistema di Breeding (ereditarietà IV).
- **store.ts**: Stato globale centralizzato con **Zustand**. Include:
    - Persistenza automatica sul `localStorage`.
    - Sistema di **Missioni Giornaliere** rigenerate ogni 24h.
    - Gestione energia (Cariche) e progressione (Leghe/Master).
- **TickSystem.ts**: Loop temporizzato che gestisce la rigenerazione HP, cariche e timer schiusa uova in background.

### Schermate (components/screens/)
- **HubScreen.tsx**: Hub centrale dinamico con ciclo giorno/notte e accesso rapido a tutte le funzioni.
- **BattleScreen.tsx**: Interfaccia di lotta turn-based con animazioni e feedback visivo.
- **BagScreen.tsx / ShopScreen.tsx**: Gestione inventario e acquisto strumenti/Pokémon.
- **BoxScreen.tsx / TeamScreen.tsx**: Organizzazione della propria collezione e squadra tramite Drag & Drop.
- **CatchScreen.tsx / SafariScreen.tsx**: Diverse modalità di incontro e cattura Pokémon selvatici.
- **LeagueSelectScreen.tsx / LeagueBattleScreen.tsx**: Sistema di sfide a catena basato sulle regioni classiche.
- **MasterBattleScreen.tsx**: Sfide "end-game" contro allenatori d'élite.
- **PokedexScreen.tsx**: Visualizzazione dettagliata dei Pokémon incontrati/catturati.
- **StartScreen.tsx / StarterDraft.tsx**: Flusso iniziale di creazione profilo e scelta dello starter tramite draft.

### UI Components (components/ui/)
- **PokemonCard.tsx / PokemonDetailsModal.tsx**: Visualizzazione schematica e dettagliata delle statistiche di un Pokémon.
- **HPBar.tsx / TypeBadge.tsx**: Elementi grafici per visualizzare salute e tipi con colori tematici.
- **GameboyDialog.tsx**: Sistema di messaggistica in stile retro-gaming.
- **BottomNav.tsx**: Navigazione principale ottimizzata per il pollice (mobile-first).

### Data
- **leagueData.ts**: Configurazione di tutte le squadre e regioni della Lega Pokémon.
- **rarityTable.ts**: Definizioni dei tassi di spawn per area e tipo di incontro.
