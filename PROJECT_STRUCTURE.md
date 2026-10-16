# Struttura del Progetto Pokedesk

Pokedesk è un'app web avanzata che simula l'esperienza Pokémon, sviluppata con **React 19**, **TypeScript** e **Vite**. È configurata come PWA (Progressive Web App) per un'esperienza nativa su dispositivi mobili.

## Albero del Progetto
```text
pokedesk/
├── .env.example           # Esempio di variabili d'ambiente
├── .gitignore             # File ignorati da Git
├── check_icon_sizes.js    # Verifica dimensioni icone PWA
├── index.html             # Entry HTML dell'app
├── metadata.json          # Metadati della build
├── package-lock.json      # Lockfile npm
├── package.json           # Dipendenze e script
├── PROJECT_FILE_MAP.md    # Mappa dettagliata del progetto
├── PROJECT_STRUCTURE.md    # Questa guida
├── README.md              # Documentazione principale
├── tsconfig.json           # Configurazione TypeScript
├── vite.config.ts          # Configurazione Vite
├── vitest.config.ts        # Configurazione Vitest
├── public/                # Asset statici
│   ├── audio/             # Effetti sonori e musica
│   ├── icon-192.png       # Icona PWA
│   ├── icon-512.png       # Icona PWA
│   ├── manifest.json      # Configurazione PWA
│   └── sw.js              # Service Worker
├── scripts/               # Script di utilità per build e manutenzione
│   ├── patch-sw.js
│   └── resize-icons.mjs
└── src/                   # Codice sorgente
    ├── App.tsx             # Componente root e routing
    ├── api.ts              # Client PokeAPI e caricamento mosse
    ├── BattleEngine.ts     # Motore di calcolo battaglie
    ├── CatchEngine.ts      # Algoritmi di cattura e breeding
    ├── main.tsx            # Entry point React
    ├── components/
    │   ├── screens/        # Schermate principali dell'app
    │   └── ui/             # Componenti UI riutilizzabili
    ├── data/               # Dati Lega, Master Trainer e forme
    ├── lib/                # Cache API e client Supabase
    ├── services/           # Servizi di progressione e Torre Lotta
    ├── utils/              # Helper esperienza e date locali
    └── store/              # Store Zustand attivo composto da slice
        ├── index.ts        # Entry point importato dall'app
        ├── sliced-store.ts # Composizione e persistenza
        └── slices/         # Slice per domini di gioco
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

## Documentazione aggiuntiva
- **PROJECT_FILE_MAP.md**: nuova guida completa con l'intero albero delle cartelle e una descrizione file per file.

## src/ (Codice Sorgente)

### Logica Core
- **api.ts**: Interfaccia di comunicazione con PokeAPI. Gestisce traduzioni, evoluzioni e caching LRU.
- **BattleEngine.ts**: Motore matematico per danni, efficacia, stadi, velocità effettiva, iniziativa per priorità, precisione, multi-hit, rinculo e Scontro.
- **CatchEngine.ts**: Gestisce cattura, nature, shiny e sistema di Breeding.
- **store/index.ts**: entry point usato dall'app; esporta lo store modulare.
- **store/sliced-store.ts**: compone le slice Zustand e configura IndexedDB con fallback `localStorage`.
- **store/slices/**: suddivide stato e azioni per giocatore, Pokémon, progressione, missioni, squadra, inventario, breeding, UI e achievement.
- **store.ts**: facciata compatibile che riesporta `store/index.ts` per gli import dell'app.
- **store/old-store.ts**: implementazione legacy non importata dal percorso attivo.
- **data/leagueData.ts**: contiene roster e dialoghi della Lega e dei Master Trainer. Kukui, Wallace, Iris e Mustard hanno team al livello 100 con mosse, nature e IV/EV definiti; i roster precedenti mantengono il setup standard.
- **api.ts**: `getMovesByNames` carica da PokeAPI i dati di battaglia delle mosse nominate nei roster Master.
- **utils/localDate.ts**: usa chiavi di calendario locale condivise per mostrare e registrare la ricompensa giornaliera della streak, con compatibilità per date già salvate.
- **TickSystem.ts**: Loop per rigenerazione cariche, HP e timer uova in background.
- **AudioService.ts**: Gestisce la riproduzione e il crossfade della musica tra le schermate.
- **NotificationService.ts**: Sistema centralizzato per i messaggi a schermo (toast).
- **useSoundEffects.ts**: Hook per gestire gli effetti sonori contestuali.

### Schermate (src/components/screens/)
- **HubScreen.tsx**: Hub centrale con ciclo giorno/notte e accesso rapido.
- **BattleScreen.tsx**: Orchestrazione condivisa delle lotte turn-based, selezione AI, PP, stati alterati, applicazione degli effetti e animazioni.
- **BattleTowerScreen.tsx**: Scalata della torre a piani con difficoltà crescente.
- **AchievementScreen.tsx**: Visualizzazione e riscatto degli obiettivi sbloccati.
- **IslandScreen.tsx**: Evento giornaliero per la cattura di leggendari.
- **LeagueSelectScreen.tsx / LeagueBattleScreen.tsx**: Sfide a catena contro Superquattro e Campione.
- **MasterBattleScreen.tsx**: selezione e gestione delle sfide end-game; applica i set personalizzati quando definiti e mantiene il setup standard per gli altri Master.
- **BagScreen.tsx / ShopScreen.tsx**: Gestione inventario e acquisti.
- **BoxScreen.tsx / TeamScreen.tsx**: Gestione collezione e squadra (Drag & Drop).
- **PokedexScreen.tsx**: Enciclopedia dettagliata con statistiche e mosse.
- **SafariScreen.tsx / CatchScreen.tsx**: Diverse modalità di incontro selvatico.
- **OptionsScreen.tsx**: Impostazioni audio e notifiche.
- **StartScreen.tsx / StarterDraft.tsx**: Inizializzazione profilo e scelta starter.
- **TradeScreen.tsx**: Sistema di Scambio Prodigioso casuale.
- **TradeEventScreen.tsx**: Evento di scambio speciale con offerte NPC e selezione Pokémon da team/box.
- **FriendBattleScreen.tsx**: Sfide simulate contro team di amici.
- **ProfessorIntroScreen.tsx / RegionalCatchScreen.tsx**: introduzione del Professore e modalità di cattura regionale.

### UI Components (src/components/ui/)
- **PokemonCard.tsx / PokemonDetailsModal.tsx**: Visualizzazione Pokémon.
- **PokemonSprite.tsx**: Gestione dinamica degli sprite (standard/shiny).
- **HPBar.tsx / TypeBadge.tsx**: Indicatori grafici di salute e tipi.
- **GameboyDialog.tsx**: Messaggistica in stile retro.
- **BottomNav.tsx**: Navigazione mobile-first.
- **FloatingMuteButton.tsx**: Controllo audio rapido sempre visibile.
- **NatureSelector.tsx / StatComparison.tsx**: selezione nature e confronto statistiche.

### Services (src/services/)
- **levelUpService.ts**: Logica complessa per il controllo di nuove mosse ed evoluzioni al level-up, con supporto alle forme regionali.
- **battleTowerService.ts**: Generazione configurazioni piani e ricompense per la torre.

### Test (src/*.test.ts)
- **Evolution.test.ts**: Test per i flussi di evoluzione e bug fix statistiche.
- **evolutionService.test.ts**: Test mirati per la logica di evoluzione regionale, le evoluzioni a pietra e il controllo delle evoluzioni al livello.
- **BattleMechanics.test.ts / BattleStages.test.ts / StatsFormula.test.ts**: Validazione di iniziativa, velocità, precisione, multi-hit, rinculo, Scontro, stadi e danni.
- **CatchEngine.test.ts / ExpSystem.test.ts**: Test su cattura ed esperienza.
- **TypeChart.test.ts**: Verifica correttezza debolezze e resistenze.
- **data/masterTrainers.test.ts**: verifica livelli, natura, IV, EV e mosse dei roster Master personalizzati.
- **utils/localDate.test.ts**: verifica date locali, passaggio del giorno e compatibilità del claim streak.
- **store/storeGameplaySlices.test.ts**: test delle regole di gameplay nello store a slice.

## Aggiornamenti Funzionali Recenti

- **Preset Team (BoxScreen + store)**
  - introdotti preset per generazione e categorie speciali, con validazione al salvataggio.
  - persistenza robusta: caricamento preset risolto su Pokémon posseduti (`team + box`), evitando preset "svuotati".
  - UI preset estesa con strip categorie, modal gestione, selezione fino a 4 con badge `Lv` e `IV Tot`, ordinamento (`IV/Lv/#`) e filtro preferiti.

- **Missioni GEN CHALLENGE (store + HubScreen + BattleScreen)**
  - aggiunta seconda linea missioni giornaliere separata dalle daily standard.
  - nuovo stato globale: categoria preset attiva e missioni challenge giornaliere dedicate.
  - tab dedicata in `HubScreen` con claim indipendente e messaggi guidati quando il team non è valido.
  - integrazione progresso su eventi gameplay (vittoria, cattura, evoluzione, condizioni no-faint/solo).
  - pool giornaliero missioni esteso con estrazione random senza duplicati e slot skill per categorie avanzate.

- **Dojo e Trade Event**
  - aggiunta funzione Dojo in `HubScreen` per ordinare, filtrare e allenare Pokémon con costi IV/EV.
  - aggiunta `TradeEventScreen.tsx`, evento con offerte NPC e selezione da team/box.

- **Bilanciamento e Combat**
  - fix danno immunità in `BattleEngine`: mosse `0x` non infliggono più 1 HP.
  - IA nemica in `BattleScreen` migliorata nella scelta mosse (KO, superefficace a danno atteso, meno status inutili).
  - buff team avversari Lega/Master con IV/EV più competitivi.
  - `Caramella Rara` in negozio bilanciata con costo aumentato (`4000`).

- **Persistenza e Dati (store + OptionsScreen)**
  - migrazione storage principale da `localStorage` a IndexedDB tramite `idb-keyval` nello store sliced (`src/store/sliced-store.ts`).
  - mantenuto fallback trasparente su `localStorage` e backup legacy (`pokedesk-save-legacy-backup`).
  - `OptionsScreen.tsx` aggiornato con Export/Import compatibili IndexedDB:
    - export con lookup progressivo (IndexedDB -> save locale -> backup).
    - import con validazione JSON e fallback automatico in assenza IndexedDB.

- **Breeding**
  - ridotto il tempo di schiusa per le nuove uova da `72h` a `48h` nella slice breeding (`src/store/slices/breedingSlice.ts`).
  - nessuna migrazione retroattiva sui timer già salvati (comportamento stabile per uova in incubazione).
