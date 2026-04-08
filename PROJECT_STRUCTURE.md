# Struttura del Progetto Pokedesk

Pokedesk è un'app web avanzata che simula l'esperienza Pokémon, sviluppata con **React 19**, **TypeScript** e **Vite**. È configurata come PWA (Progressive Web App) per un'esperienza nativa su dispositivi mobili.

## Albero del Progetto
```text
pokedesk/
├── public/                 # Asset statici
│   ├── audio/              # Effetti sonori e musica
│   ├── icon-192.png        # Icona PWA
│   ├── icon-512.png        # Icona PWA
│   ├── manifest.json       # Configurazione PWA
│   └── sw.js               # Service Worker
├── scripts/                # Script di utilità per build e manutenzione
│   ├── patch-sw.js
│   └── resize-icons.mjs
├── src/                    # Codice sorgente
│   ├── components/
│   │   ├── screens/        # Schermate principali dell'app
│   │   └── ui/             # Componenti UI riutilizzabili
│   ├── data/               # Dati statici (Lega, spawn, ecc.)
│   ├── services/           # Servizi logici (Livelli, Torre Lotta)
│   ├── App.tsx             # Componente root e routing
│   ├── AudioService.ts     # Gestione musica globale
│   ├── BattleEngine.ts     # Motore di calcolo battaglie
│   ├── CatchEngine.ts      # Algoritmi di cattura e breeding
│   ├── NotificationService.ts # Gestione notifiche app
│   ├── store.ts            # Stato globale (Zustand)
│   ├── types.ts            # Definizioni TypeScript
│   ├── api.ts              # Interfaccia PokeAPI
│   └── TickSystem.ts       # Loop temporizzato background
├── README.md               # Documentazione principale
├── PROJECT_STRUCTURE.md    # Questa guida
├── package.json            # Dipendenze e script
├── tsconfig.json           # Configurazione TypeScript
└── vite.config.ts          # Configurazione Vite
```

## Cartella Radice
- **index.html**: Punto di ingresso dell'app. Contiene i meta tag PWA, link al manifest e script di caricamento.
- **metadata.json**: Informazioni di versione e configurazione della build.
- **package.json**: Gestione dipendenze (Zustand, Tailwind 4, Vitest, Motion, GenAI) e script npm.
- **README.md**: Documentazione principale con feature e tech stack.
- **PROJECT_STRUCTURE.md**: Descrizione dettagliata dell'architettura e dei file.
- **tsconfig.json**: Configurazione del compilatore TypeScript.
- **vite.config.ts**: Configurazione del bundler con plugin React e impostazioni PWA.
- **.env.example**: Esempio di variabili d'ambiente (es. GEMINI_API_KEY).
- **check_icon_sizes.js**: Script di verifica per le icone PWA.

## public/ (Asset Statici)
- **manifest.json**: Configurazione per l'installabilità (icone, colori, orientamento).
- **sw.js**: Service Worker per il caching offline e strategia "cache-first" per PokeAPI.
- **audio/**: Contiene tutti i file .mp3 per la musica di sottofondo e gli effetti sonori.

## scripts/
- **patch-sw.js**: Applica patch al Service Worker durante la build.
- **resize-icons.mjs**: Genera automaticamente le icone di varie dimensioni per il manifest.

## src/ (Codice Sorgente)

### Logica Core
- **api.ts**: Interfaccia di comunicazione con PokeAPI. Gestisce traduzioni, evoluzioni e caching LRU.
- **BattleEngine.ts**: Motore matematico per le battaglie (danni, priorità, IV/EV).
- **CatchEngine.ts**: Gestisce cattura, nature, shiny e sistema di Breeding.
- **store.ts**: Stato globale con Zustand. Gestisce missioni, achievement, progressione e persistenza.
- **TickSystem.ts**: Loop per rigenerazione cariche, HP e timer uova in background.
- **AudioService.ts**: Gestisce la riproduzione e il crossfade della musica tra le schermate.
- **NotificationService.ts**: Sistema centralizzato per i messaggi a schermo (toast).
- **useSoundEffects.ts**: Hook per gestire gli effetti sonori contestuali.

### Schermate (src/components/screens/)
- **HubScreen.tsx**: Hub centrale con ciclo giorno/notte e accesso rapido.
- **BattleScreen.tsx**: Interfaccia di lotta turn-based con animazioni.
- **BattleTowerScreen.tsx**: Scalata della torre a piani con difficoltà crescente.
- **AchievementScreen.tsx**: Visualizzazione e riscatto degli obiettivi sbloccati.
- **IslandScreen.tsx**: Evento giornaliero per la cattura di leggendari.
- **LeagueSelectScreen.tsx / LeagueBattleScreen.tsx**: Sfide a catena contro Superquattro e Campione.
- **MasterBattleScreen.tsx**: Sfide end-game contro allenatori leggendari (Red, Blue, ecc.).
- **BagScreen.tsx / ShopScreen.tsx**: Gestione inventario e acquisti.
- **BoxScreen.tsx / TeamScreen.tsx**: Gestione collezione e squadra (Drag & Drop).
- **PokedexScreen.tsx**: Enciclopedia dettagliata con statistiche e mosse.
- **SafariScreen.tsx / CatchScreen.tsx**: Diverse modalità di incontro selvatico.
- **OptionsScreen.tsx**: Impostazioni audio e notifiche.
- **StartScreen.tsx / StarterDraft.tsx**: Inizializzazione profilo e scelta starter.
- **TradeScreen.tsx**: Sistema di Scambio Prodigioso casuale.
- **FriendBattleScreen.tsx**: Sfide simulate contro team di amici.

### UI Components (src/components/ui/)
- **PokemonCard.tsx / PokemonDetailsModal.tsx**: Visualizzazione Pokémon.
- **PokemonSprite.tsx**: Gestione dinamica degli sprite (standard/shiny).
- **HPBar.tsx / TypeBadge.tsx**: Indicatori grafici di salute e tipi.
- **GameboyDialog.tsx**: Messaggistica in stile retro.
- **BottomNav.tsx**: Navigazione mobile-first.
- **FloatingMuteButton.tsx**: Controllo audio rapido sempre visibile.

### Services (src/services/)
- **levelUpService.ts**: Logica complessa per il controllo di nuove mosse ed evoluzioni al level-up.
- **battleTowerService.ts**: Generazione configurazioni piani e ricompense per la torre.

### Test (src/*.test.ts)
- **Evolution.test.ts**: Test per i flussi di evoluzione e bug fix statistiche.
- **BattleStages.test.ts / StatsFormula.test.ts**: Validazione calcoli motore di lotta.
- **CatchEngine.test.ts / ExpSystem.test.ts**: Test su cattura ed esperienza.
- **TypeChart.test.ts**: Verifica correttezza debolezze e resistenze.
