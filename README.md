# PokéDesk - PWA Pokémon Web App

Un simulatore di battaglie e cattura Pokémon moderno, sviluppato come Progressive Web App (PWA) con React, TypeScript e Tailwind CSS.

## 🚀 Caratteristiche Principali

- **Sistema di Battaglia**: turni ordinati per priorità e velocità effettiva (stadi e paralisi), precisione influenzata da precisione/elusione, effetti di stato, multi-hit basati sui metadati e PP. Esauriti i PP, entrambi i lati usano Scontro con rinculo. Riposo mantiene la variante custom che cura il 50% senza addormentare.
- **Cattura e Safari**: Meccaniche di cattura dedicate, inclusa la **Zona Safari** con spawn di Pokémon di sesta generazione e oltre.
- **Progressione e Sfide**: Livellamento, evoluzioni, medaglie e sfide contro **Capopalestra**, **Lega Pokémon**, **Master Trainer** e la scalata della **Torre Lotta**.
- **Master Trainer**: sfide end-game con squadre dedicate. Kukui, Wallace, Iris e Mustard hanno team al livello 100 con mosse, nature e distribuzioni IV/EV configurate; gli altri allenatori mantengono la generazione standard.
- **Torre Lotta**: Modalità infinita a piani con difficoltà crescente e ricompense esclusive (sbloccata dopo la Lega).
- **Missioni Giornaliere**: Sistema di obiettivi quotidiani, incluse sfide specifiche per la Torre Lotta, con ricompense in monete e strumenti.
- **Achievement**: Sistema di obiettivi a lungo termine con ricompense speciali per catture, lotte e completamento Pokédex.
- **Toast di missione**: Notifica visiva al completamento missione e auto-dismiss a 3 secondi.
- **Sincronizzazione Pokédex**: Registrazione automatica delle nuove specie nel Pokédex durante l'evoluzione e il livellamento.
- **Isole Leggendarie**: Nuova modalità giornaliera per catturare un leggendario (sbloccata dopo una run Lega) con esperienza e IV corretti.
- **Dojo di Allenamento**: Nuova funzione in Hub per migliorare IV/EV dei Pokémon con costo crescente e filtri di selezione velocizzati.
- **Trade Event**: Evento speciale di scambio con un Pokémon NPC a IV alti, ricompense fisse e scelta tra team/box.
- **Breeding e Uova**: Possibilità di far accoppiare Pokémon (incluso Ditto) per ottenere uova con IV ereditati.
- **Gestione Squadra**: Team attivo (fino a 4 Pokémon), PC Box illimitato, strumenti curativi e caramelle rare.
- **Sistema di Cariche**: Energia temporizzata rigenerativa per limitare le azioni di Cattura, Lotta e Safari.
- **Ciclo Giorno/Notte**: Atmosfera dinamica nell'Hub che cambia visivamente in base all'ora reale.
- **Localizzazione**: Supporto completo alla lingua **Italiana** per nomi, mosse e descrizioni.
- **PWA Ready**: Installabile su dispositivi mobile, supporto offline e notifiche push.

## 🛠️ Tecnologie Utilizzate

- **Framework**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS 4
- **Animazioni**: Motion (framer-motion) & Canvas Confetti
- **State Management**: Zustand con store composto da slice e persistenza (`pokedesk-save`) su IndexedDB con fallback `localStorage`
- **AI Integration**: Google Generative AI (Gemini) per quiz e contenuti dinamici
- **Drag & Drop**: @dnd-kit per la gestione della squadra e del box
- **API**: [PokeAPI](https://pokeapi.co/) con sistema di cache LRU personalizzato

## 🎮 Come Giocare

1. **Inizio**: Scegli lo starter nel Draft iniziale e imposta il tuo profilo.
2. **Hub**: Gestisci le tue cariche e controlla le **Missioni Giornaliere**.
3. **Cattura**: Esplora l'erba alta o avventurati nel Safari per espandere il Pokédex.
4. **Lotta**: Scala la gerarchia sconfiggendo Capopalestra per sbloccare la Lega e i Master Trainers.
5. **Crescita**: Usa strumenti, Caramelle Rare e il Breeding per creare il team perfetto.

## 📂 Struttura (File principali)

- `src/store/index.ts` e `src/store/sliced-store.ts`: punto d'ingresso e composizione dello store Zustand attivo; lo stato è organizzato in slice sotto `src/store/slices/`.
- `src/store/old-store.ts`: implementazione legacy, non importata dal percorso attivo dell'app.
- `src/BattleEngine.ts`: Motore di calcolo per danni, statistiche e turni di lotta.
- `src/CatchEngine.ts`: Algoritmi per probabilità di cattura, nature e shiny.
- `src/api.ts`: Interfaccia verso PokeAPI con cache, traduzioni in italiano e caricamento delle mosse nominate per le squadre Master.
- `src/data/leagueData.ts`: dati della Lega e roster dei Master Trainer.
- `src/components/screens/`: Interfaccia utente modulare divisa in schermate funzionali.
- `PROJECT_FILE_MAP.md`: mappa completa delle cartelle e dei file del progetto con descrizioni dettagliate.

## 📝 Note Tecniche

Il progetto implementa un `TickSystem.ts` robusto per la rigenerazione dello stato in background (cariche, schiusa uova) e utilizza un sistema di routing basato su stati in `App.tsx` per una transizione fluida tra le schermate stile app nativa.

Le date della ricompensa giornaliera della streak sono calcolate con una chiave di calendario locale condivisa tra Hub e store; le missioni giornaliere mantengono il proprio ciclo indipendente.

## Documentazione di progetto aggiornata
- `PROJECT_FILE_MAP.md`: mappa di riferimento con l'albero delle cartelle e la descrizione dei file del progetto.

## Aggiornamenti Recenti
- **Master Trainer con squadre dedicate**: aggiunti Kukui, Wallace, Iris e Mustard con sprite Pokémon Showdown, quattro Pokémon al livello 100, mosse specifiche caricate da PokeAPI, nature e spread IV/EV espliciti, dialoghi e ricompense. La configurazione è opzionale e non modifica i roster preesistenti.
- **Ricompensa giornaliera streak**: allineato il controllo di disponibilità e il claim alla data locale, mantenendo compatibilità con le date già salvate e proteggendo i claim duplicati.
- **Test aggiunti**: `src/data/masterTrainers.test.ts` verifica i roster dei Master configurati; `src/utils/localDate.test.ts` verifica le chiavi data locali e la compatibilità delle date salvate.
- **Preset per categoria**: supporto categorie per generazione e categorie speciali, con validazione al salvataggio.
- **Ordinamento Box per data**: aggiunto filtro `date` nel PC Box usando `caughtAt`.
- **Fix danno immunità tipo**: mosse con moltiplicatore `0x` ora infliggono correttamente `0` danni.
- **Risoluzione mosse**: priorità confrontata per entrambi i combattenti, spareggio casuale a velocità pari, precisione modificata dagli stadi, multi-hit con interruzione al KO, immunità status specifiche e tentennamento solo quando il bersaglio sopravvive.
- **Falsofinale**: mossa apprendibile che lascia il bersaglio a 1 PS quando il colpo sarebbe letale.
- **PP esauriti**: Scontro è uniforme per giocatore e avversario, ignora immunità Spettro e STAB e applica rinculo pari a un quarto dei PS massimi.
- **Riposo**: comportamento intenzionalmente semplificato; cura il 50% dei PS e non applica sonno.
- **GEN CHALLENGE**: seconda linea missioni giornaliere separata dalle daily classiche, con tab dedicata in Hub.
- **Categoria attiva visiva**: etichetta in Hub (`Categoria attiva: ...`) con stato `progresso attivo/sospeso`.
- **Pool giornaliero GEN CHALLENGE**: 4 missioni pescate da pool più ampio, con slot skill garantito per `gen6+` e `legendary`.
- **Bilanciamento iniziale**:
  - costo `Caramella Rara` in shop aumentato a `4000`.
  - IA mosse nemica migliorata (preferenza KO/superefficaci a danno atteso).
  - Team avversari Lega/Master potenziati con IV/EV migliori.
  - **Forme Regionali**: introdotto supporto alle evoluzioni regionali e pulsante `REGIONALI` in Hub con layout quadrato compatto per `ISOLE` e `REGIONALI`.
  - **Copertura test evolutive**: aggiunti test mirati per evoluzioni a pietra, evoluzioni a livello e gestione delle forme regionali in `src/evolutionService.test.ts`.
- **Migrazione automatica**: al primo avvio utile, i dati legacy vengono copiati da `localStorage` a IndexedDB con verifica di scrittura e flag di migrazione.
- **Backup legacy**: mantenuto un backup in `localStorage` (`pokedesk-save-legacy-backup`) per resilienza durante la transizione.
- **Export/Import migliorati** (`OptionsScreen`):
  - Export: priorità IndexedDB, fallback su `localStorage`, fallback su backup legacy.
  - Import: validazione JSON, scrittura preferita in IndexedDB, fallback su `localStorage`, reload guidato app.
- **Compatibilità mobile/PWA**: comportamento più robusto su browser moderni con quota storage generalmente superiore rispetto al solo `localStorage`.

## Aggiornamento Gameplay (Apr 2026)

- **Dojo**: implementato un nuovo sistema di allenamento per migliorare IV/EV dei Pokémon, con costi di addestramento progressivi.
- **Trade Event**: nuova schermata evento con Pokémon offerta NPC ad IV alti e selezione del Pokémon da scambiare dal team o dal box.
- **Breeding - Tempo uova**: le nuove uova richiedono ora `48 ore` (prima `72 ore`).
- **Retrocompatibilità timer**: le uova già in incubazione mantengono il timer originario salvato, evitando side-effect sui salvataggi esistenti.
