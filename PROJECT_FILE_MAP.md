# PROJECT_FILE_MAP.md

Mappa completa del progetto PokéDesk con struttura cartelle e descrizioni dettagliate per ogni file.

> Questo file è un riferimento completo per sviluppatori e manutentori, con l'albero delle directory e il ruolo di ciascun file.

## Albero del Progetto
```text
pokedesk/
├── .env.example
├── .gitignore
├── check_icon_sizes.js
├── index.html
├── metadata.json
├── package-lock.json
├── package.json
├── PROJECT_FILE_MAP.md
├── PROJECT_STRUCTURE.md
├── README.md
├── public/
│   ├── audio/
│   │   ├── AlbumArtSmall.jpg
│   │   ├── Folder.jpg
│   │   ├── hit-super-effective.mp3
│   │   ├── hit-weak-not-very-effective.mp3
│   │   ├── pokemon_battle.mp3
│   │   ├── pokemon_money.mp3
│   │   ├── pokemon_red_opening.mp3
│   │   ├── pokemon_trap_mix.mp3
│   │   └── team_galactic.mp3
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── manifest.json
│   └── sw.js
├── scripts/
│   ├── patch-sw.js
│   └── resize-icons.mjs
├── src/
│   ├── api.ts
│   ├── App.tsx
│   ├── AudioService.ts
│   ├── BattleEngine.ts
│   ├── BattleStages.test.ts
│   ├── CatchEngine.test.ts
│   ├── CatchEngine.ts
│   ├── Evolution.test.ts
│   ├── evolutionService.test.ts
│   ├── ExpSystem.test.ts
│   ├── index.css
│   ├── main.tsx
│   ├── NotificationService.ts
│   ├── rarityTable.ts
│   ├── StatsFormula.test.ts
│   ├── store.ts
│   ├── store/types.ts
│   ├── TickSystem.ts
│   ├── TypeChart.test.ts
│   ├── types.ts
│   ├── useSoundEffects.ts
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── screens/
│   │   │   ├── AchievementScreen.tsx
│   │   │   ├── BagScreen.tsx
│   │   │   ├── BattleScreen.tsx
│   │   │   ├── BattleTowerScreen.tsx
│   │   │   ├── BoxScreen.tsx
│   │   │   ├── CatchScreen.tsx
│   │   │   ├── FriendBattleScreen.tsx
│   │   │   ├── HubScreen.tsx
│   │   │   ├── IslandScreen.tsx
│   │   │   ├── LeagueBattleScreen.tsx
│   │   │   ├── LeagueSelectScreen.tsx
│   │   │   ├── MasterBattleScreen.tsx
│   │   │   ├── OptionsScreen.tsx
│   │   │   ├── PokedexScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── SafariScreen.tsx
│   │   │   ├── ShopScreen.tsx
│   │   │   ├── StarterDraft.tsx
│   │   │   ├── StartScreen.tsx
│   │   │   ├── TeamScreen.tsx
│   │   │   ├── TradeEventScreen.tsx
│   │   │   └── TradeScreen.tsx
│   │   └── ui/
│   │       ├── BottomNav.tsx
│   │       ├── FloatingMuteButton.tsx
│   │       ├── GameboyDialog.tsx
│   │       ├── HPBar.tsx
│   │       ├── PokemonCard.tsx
│   │       ├── PokemonDetailsModal.tsx
│   │       ├── PokemonSprite.tsx
│   │       └── TypeBadge.tsx
│   ├── data/
│   │   ├── leagueData.ts
│   │   ├── legendaryIds.ts
│   │   └── regionalForms.ts
│   ├── services/
│   │   ├── battleTowerService.ts
│   │   └── levelUpService.ts
│   └── store/
│       ├── index.ts
│       ├── old-store.ts
│       ├── sliced-store.ts
│       ├── storeGameplaySlices.test.ts
│       ├── storePersistenceSmoke.test.ts
│       └── slices/
│           ├── achievementSlice.ts
│           ├── breedingSlice.ts
│           ├── inventorySlice.ts
│           ├── missionSlice.ts
│           ├── playerSlice.ts
│           ├── pokemonSlice.ts
│           ├── progressSlice.ts
│           ├── teamSlice.ts
│           └── uiSlice.ts
├── tsconfig.json
└── vite.config.ts
```

## Descrizione dei file principali

### Radice del progetto
- `.env.example`: esempio di variabili d'ambiente usate per configurazioni sensibili, come chiavi API.
- `.gitignore`: lista di file e cartelle ignorate da Git, ad esempio `node_modules` e output di build.
- `check_icon_sizes.js`: script Node.js per verificare che le icone PWA abbiano le dimensioni corrette.
- `index.html`: entry point HTML dell'app, include i meta tag PWA, il link al manifest e il mount point di React.
- `metadata.json`: dati di versione o metadati della build; utile per identificare la versione corrente dell'app.
- `package.json`: dipendenze npm, script di sviluppo/build/test e metadati del progetto.
- `package-lock.json`: lockfile npm che fissa le versioni esatte delle dipendenze installate.
- `README.md`: documentazione principale del progetto con feature, tecnologie e note di architettura.
- `PROJECT_STRUCTURE.md`: descrizione ad alto livello dell'architettura e della struttura del progetto.
- `PROJECT_FILE_MAP.md`: questo file, con l'albero completo e spiegazioni dettagliate file per file.

### Cartella `public/`
- `manifest.json`: configurazione PWA, inclusi nome dell'app, colori, orientamento e icone.
- `sw.js`: service worker per caching offline e gestione delle risorse statiche.
- `icon-192.png`, `icon-512.png`: icone usate nella manifest e per l'installazione PWA.

#### `public/audio/`
- `AlbumArtSmall.jpg`, `Folder.jpg`: immagini di copertina concesse come asset visivi.
- `hit-super-effective.mp3`, `hit-weak-not-very-effective.mp3`: effetti sonori per battaglia.
- `pokemon_battle.mp3`, `pokemon_money.mp3`, `pokemon_red_opening.mp3`, `pokemon_trap_mix.mp3`, `team_galactic.mp3`: tracce di musica e colonna sonora usate nella UI e nelle schermate di gioco.

### Cartella `scripts/`
- `patch-sw.js`: script utilizzato in fase di build per applicare patch al file `sw.js` del service worker.
- `resize-icons.mjs`: script che ridimensiona e genera icone in diverse risoluzioni per il manifest PWA.

### Cartella `src/`
- `api.ts`: wrapper per PokeAPI; gestisce fetch, traduzioni in italiano, cache e risoluzione delle evoluzioni.
- `App.tsx`: componente root React. Gestisce il routing basato su stato, la transizione tra schermate e il layout globale.
- `AudioService.ts`: servizio per la riproduzione audio di sottofondo; gestisce le transizioni tra tracce e la muting.
- `BattleEngine.ts`: logica di calcolo delle battaglie, danni, tipi, priorità e gestione delle mosse.
- `CatchEngine.ts`: logica di cattura, probabilità, generazione nature, shiny e dinamiche di breeding.
- `NotificationService.ts`: motore centralizzato per notifiche, toast e messaggi in-app.
- `store.ts`: stato globale principale con Zustand. Gestisce progressi, team, box, missioni, inventory, persistence e sincronizzazione del salvataggio.
- `store/types.ts`: definizioni TypeScript condivise per lo store e le entità di gioco.
- `TickSystem.ts`: loop temporizzato per rigenerazione cariche, gestione timer uova e aggiornamento dello stato in background.
- `types.ts`: tipi globali usati in tutta l'app.
- `useSoundEffects.ts`: hook personalizzato per riprodurre effetti sonori in risposta ad azioni utente.
- `vite-env.d.ts`: dichiarazioni di tipo per Vite e import dei file statici.
- `index.css`: foglio di stile globale con reset e regole base.
- `main.tsx`: entry point React che monta l'app su DOM e configura il client Vite.

### Cartella `src/components/screens/`
- `AchievementScreen.tsx`: visualizzazione degli achievement e sblocco ricompense.
- `BagScreen.tsx`: gestione dell'inventario disponibile al giocatore.
- `BattleScreen.tsx`: UI principale della battaglia turn-based.
- `BattleTowerScreen.tsx`: schermata per la Torre Lotta con sfide a piani.
- `BoxScreen.tsx`: gestione del PC Box e dei preset di squadra.
- `CatchScreen.tsx`: interfaccia standard di cattura Pokémon.
- `FriendBattleScreen.tsx`: schermata per sfide simulate contro team amici.
- `HubScreen.tsx`: cruscotto principale con accesso rapido agli eventi giornalieri e al ciclo giorno/notte.
- `IslandScreen.tsx`: visualizzazione delle isole leggendari e relativi eventi giornalieri.
- `LeagueBattleScreen.tsx`: schermata di battaglia contro la Lega.
- `LeagueSelectScreen.tsx`: selezione dei combattimenti della Lega e Superquattro.
- `MasterBattleScreen.tsx`: schermata end-game per sfide contro master trainers.
- `OptionsScreen.tsx`: impostazioni di audio, notifiche, export/import salvataggi e preferenze.
- `PokedexScreen.tsx`: Pokédex con statistiche e dettagli delle specie.
- `ProfileScreen.tsx`: scheda profilo giocatore e informazioni personali.
- `SafariScreen.tsx`: modalità Safari con incontri a tempo e oggetti speciali.
- `ShopScreen.tsx`: negozio con acquisti di strumenti e caramelle rare.
- `StarterDraft.tsx`: selezione starter iniziale con draft e apertura della partita.
- `StartScreen.tsx`: schermata iniziale del gioco.
- `TeamScreen.tsx`: gestione del team attivo, composizione e scambi.
- `TradeEventScreen.tsx`: evento di scambio speciale con offerte NPC e selezione da team/box.
- `TradeScreen.tsx`: sistema di scambio casuale e scelte Prodigio.

### Cartella `src/components/ui/`
- `BottomNav.tsx`: barra di navigazione inferiore per mobile.
- `FloatingMuteButton.tsx`: pulsante flottante per muting audio.
- `GameboyDialog.tsx`: componente dialog in stile retro, usato per messaggi di gioco.
- `HPBar.tsx`: barra di salute dinamica per i Pokémon.
- `PokemonCard.tsx`: scheda Pokémon riutilizzabile con statistiche e informazioni rapide.
- `PokemonDetailsModal.tsx`: modal con informazioni dettagliate sul Pokémon selezionato.
- `PokemonSprite.tsx`: gestione sprite standard e shiny, animazioni e variant.
- `TypeBadge.tsx`: badge visuale per il tipo del Pokémon.

### Cartella `src/data/`
- `leagueData.ts`: dati strutturati per i team e le sfide della Lega e dei boss.
- `legendaryIds.ts`: lista di ID dei Pokémon leggendari usati nei pool speciali.
- `regionalForms.ts`: definizioni delle forme regionali, mapping delle pietre evolutive e logica di compatibilità.

### Cartella `src/services/`
- `battleTowerService.ts`: logica per la generazione dei piani e delle ricompense della Torre Lotta.
- `levelUpService.ts`: gestione delle evoluzioni, apprendimento mosse, crescita dei Pokémon e supporto alle forme regionali.

### Cartella `src/store/`
- `index.ts`: inizializzazione dello store, composizione delle slice e helper per la persistenza.
- `old-store.ts`: versione legacy dello store conservata per riferimento o migrazione.
- `sliced-store.ts`: store modulare che organizza lo stato in slice più piccoli.
- `storeGameplaySlices.test.ts`: test delle slice di gameplay e delle regole di persist.
- `storePersistenceSmoke.test.ts`: test di base per la persistenza del salvataggio del gioco.

#### `src/store/slices/`
- `achievementSlice.ts`: stato e reducers per gli achievement di gioco.
- `breedingSlice.ts`: gestione delle dinamiche di breeding e uova.
- `inventorySlice.ts`: logica di inventario e utilizzo oggetti.
- `missionSlice.ts`: stato, logic e progressione delle missioni giornaliere e challenge.
- `playerSlice.ts`: dati giocatore, profilo e stats globali.
- `pokemonSlice.ts`: stato dei Pokémon posseduti, filtri e aggiornamenti.
- `progressSlice.ts`: avanzamento storia, sblocco modalità e progressione generale.
- `teamSlice.ts`: gestione del team attivo, preset e spostamento tra team/PC.
- `uiSlice.ts`: stato dell'interfaccia, modali e notifiche.

### File di test principali
- `BattleStages.test.ts`: verifica i passaggi di fase della battaglia.
- `CatchEngine.test.ts`: test della logica di cattura e probabilità.
- `Evolution.test.ts`: verifica dei nodi di evoluzione e transizioni.
- `evolutionService.test.ts`: test mirati per la logica di evoluzione regionale, evoluzioni a pietra e controllo delle evoluzioni al livello.
- `ExpSystem.test.ts`: test del sistema di esperienza.
- `StatsFormula.test.ts`: validazione delle formule di statistica.
- `TypeChart.test.ts`: test delle relazioni di tipo e dei moltiplicatori di danno.

### Configurazione di progetto
- `tsconfig.json`: impostazioni del compilatore TypeScript, percorsi e strict mode.
- `vite.config.ts`: configurazione del bundler Vite, plugin React e eventuali personalizzazioni di build.

## Cosa contiene ogni file

Ogni file descritto in questa mappa è pensato per una specifica porzione dell'applicazione:
- i file in `src/components/screens` compongono le schermate principali dell'app e gestiscono la UX delle diverse modalità di gioco;
- i file in `src/components/ui` sono componenti visuali riutilizzabili e widget di interfaccia;
- i file `src/services` e `src/store` contengono la logica di gioco e la gestione dello stato persistente;
- i root file (`package.json`, `tsconfig.json`, `vite.config.ts`, `README.md`, `PROJECT_STRUCTURE.md`) definiscono le dipendenze, le build, la documentazione e la configurazione dell'ambiente.

Questa mappa è aggiornata per includere tutte le aggiunte correnti del progetto senza rimuovere nulla di esistente. Se viene aggiunto un nuovo file o una nuova cartella, aggiungi qui la descrizione corrispondente per mantenere la documentazione sincronizzata.