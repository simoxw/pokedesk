# Struttura del Progetto Pokedesk

Pokedesk è un'app web per browser che simula un'esperienza Pokémon, sviluppata con React, TypeScript e Vite. È configurata come PWA (Progressive Web App) per l'installazione su dispositivi mobili.

## Cartella Radice
- **index.html**: File HTML principale che serve come punto di ingresso dell'app. Include i meta tag per la PWA, il link al manifest e la registrazione del service worker.
- **metadata.json**: File contenente metadati aggiuntivi dell'app, probabilmente per configurazioni o informazioni di build.
- **package.json**: File di configurazione npm che definisce dipendenze, script (es. `dev`, `build`) e informazioni del progetto.
- **README.md**: Documentazione generale del progetto, con istruzioni per installazione e utilizzo.
- **tsconfig.json**: Configurazione TypeScript per la compilazione e controllo dei tipi.
- **vite.config.ts**: Configurazione di Vite, il bundler, con impostazioni per il base path (GitHub Pages), plugin e build.

## public/
Cartella per risorse statiche servite direttamente.
- **manifest.json**: Manifest della PWA che definisce nome, icone, start_url, display mode e altre proprietà per l'installabilità.
- **sw.js**: Service Worker che gestisce il caching offline, permettendo all'app di funzionare senza connessione.
- **icon-192.png**: Icona della PWA in formato PNG, dimensione 192x192 pixel, usata per installazione e notifiche.
- **icon-512.png**: Icona della PWA in formato PNG, dimensione 512x512 pixel, usata per schermi ad alta risoluzione.

## src/
Codice sorgente dell'app.

### File Principali
- **api.ts**: Contiene funzioni per interagire con API esterne, come l'API di Gemini per funzionalità AI.
- **App.tsx**: Componente React principale che gestisce il routing e il layout generale dell'app.
- **BattleEngine.ts**: Logica di gioco per le battaglie Pokémon, inclusi calcoli di danno, turni e regole.
- **CatchEngine.ts**: Logica per catturare Pokémon, con probabilità e meccaniche di cattura.
- **index.css**: Foglio di stile globale con Tailwind CSS per il design dell'interfaccia.
- **main.tsx**: Punto di ingresso dell'app React, dove viene renderizzato il componente App nel DOM.
- **NotificationService.ts**: Servizio per gestire notifiche push o in-app, probabilmente per eventi di gioco.
- **store.ts**: Configurazione dello stato globale usando Zustand, per gestire dati come Pokémon, utente, ecc.
- **TickSystem.ts**: Sistema che gestisce aggiornamenti periodici (tick), come rigenerazione HP o eventi temporizzati.
- **types.ts**: Definizioni di tipi TypeScript per strutture dati come Pokémon, mosse, ecc.

### components/
Componenti React riutilizzabili.

#### screens/
Schermi principali dell'app, ciascuno rappresentante una vista o sezione.
- **BagScreen.tsx**: Schermo per visualizzare e gestire l'inventario (zaino) dell'utente.
- **BattleScreen.tsx**: Interfaccia per combattimenti Pokémon, con animazioni e controlli.
- **BoxScreen.tsx**: Schermo per il PC Box, dove archiviare Pokémon catturati.
- **CatchScreen.tsx**: Schermo per tentare la cattura di Pokémon selvatici.
- **HubScreen.tsx**: Schermo centrale (hub) per navigare tra sezioni principali.
- **OptionsScreen.tsx**: Schermo impostazioni per configurare l'app (es. audio, lingua).
- **PokedexScreen.tsx**: Schermo Pokédex per visualizzare informazioni sui Pokémon.
- **ProfileScreen.tsx**: Schermo profilo utente, con statistiche e progressi.
- **ShopScreen.tsx**: Schermo negozio per acquistare oggetti o Pokémon.
- **StarterDraft.tsx**: Schermo per selezionare il Pokémon iniziale all'inizio del gioco.
- **StartScreen.tsx**: Schermo di avvio con menu principale e opzioni di gioco.
- **TeamScreen.tsx**: Schermo per gestire la squadra attiva di Pokémon.
- **TradeScreen.tsx**: Schermo per scambiare Pokémon con altri giocatori o NPC.

#### ui/
Componenti UI di base, riutilizzabili in più schermi.
- **BottomNav.tsx**: Barra di navigazione inferiore per spostarsi tra schermi principali.
- **HPBar.tsx**: Componente per visualizzare la barra di HP di un Pokémon.
- **PokemonCard.tsx**: Carta informativa per mostrare dettagli di un Pokémon (es. nome, tipo, stats).
- **PokemonDetailsModal.tsx**: Modale popup con dettagli completi di un Pokémon.
- **TypeBadge.tsx**: Badge per indicare il tipo di un Pokémon (es. Fuoco, Acqua).</content>
<parameter name="filePath">E:\Documenti Simo\Progetti\pokedesk\PROJECT_STRUCTURE.md