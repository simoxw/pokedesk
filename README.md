# PokéDesk - PWA Pokémon Web App

Un simulatore di battaglie e cattura Pokémon moderno, sviluppato come Progressive Web App (PWA) con React, TypeScript e Tailwind CSS.

## 🚀 Caratteristiche Principali

- **Sistema di Battaglia**: Battaglie a turni avanzate con gestione tipi, stati alterati, modificatori di stadio e priorità delle mosse.
- **Cattura e Safari**: Meccaniche di cattura dedicate, inclusa la **Zona Safari** con spawn di Pokémon di sesta generazione e oltre.
- **Progressione e Sfide**: Livellamento, evoluzioni, medaglie e sfide contro **Capopalestra**, **Lega Pokémon**, **Master Trainers** e la scalata della **Torre Lotta**.
- **Torre Lotta**: Modalità infinita a piani con difficoltà crescente e ricompense esclusive (sbloccata dopo la Lega).
- **Missioni Giornaliere**: Sistema di obiettivi quotidiani, incluse sfide specifiche per la Torre Lotta, con ricompense in monete e strumenti.
- **Achievement**: Sistema di obiettivi a lungo termine con ricompense speciali per catture, lotte e completamento Pokédex.
- **Toast di missione**: Notifica visiva al completamento missione e auto-dismiss a 3 secondi.
- **Sincronizzazione Pokédex**: Registrazione automatica delle nuove specie nel Pokédex durante l'evoluzione e il livellamento.
- **Isole Leggendarie**: Nuova modalità giornaliera per catturare un leggendario (sbloccata dopo una run Lega) con esperienza e IV corretti.
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
- **State Management**: Zustand con persistenza locale (`pokedesk-save`)
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

- `src/store.ts`: Cuore pulsante dell'app, gestisce lo stato globale e la logica di gioco complessa.
- `src/BattleEngine.ts`: Motore di calcolo per danni, statistiche e turni di lotta.
- `src/CatchEngine.ts`: Algoritmi per probabilità di cattura, nature e shiny.
- `src/api.ts`: Interfaccia verso PokeAPI con traduzioni in italiano e logica evolutiva integrata.
- `src/components/screens/`: Interfaccia utente modulare divisa in schermate funzionali.
- `PROJECT_FILE_MAP.md`: mappa completa delle cartelle e dei file del progetto con descrizioni dettagliate.

## 📝 Note Tecniche

Il progetto implementa un `TickSystem.ts` robusto per la rigenerazione dello stato in background (cariche, schiusa uova) e utilizza un sistema di routing basato su stati in `App.tsx` per una transizione fluida tra le schermate stile app nativa.

## Documentazione di progetto aggiornata
- `PROJECT_FILE_MAP.md`: nuova documentazione con l'albero completo delle cartelle del progetto e la descrizione di ciascun file.

## Aggiornamenti Recenti
- **Preset per categoria**: supporto categorie `gen1..gen8`, `legendary`, `favorite` con validazione al salvataggio.
- **Ordinamento Box per data**: aggiunto filtro `date` nel PC Box usando `caughtAt`.
- **Fix danno immunità tipo**: mosse con moltiplicatore `0x` ora infliggono correttamente `0` danni.
- **GEN CHALLENGE**: seconda linea missioni giornaliere separata dalle daily classiche, con tab dedicata in Hub.
- **Categoria attiva visiva**: etichetta in Hub (`Categoria attiva: ...`) con stato `progresso attivo/sospeso`.
- **Pool giornaliero GEN CHALLENGE**: 4 missioni pescate da pool più ampio, con slot skill garantito per `gen6+` e `legendary`.
- **Bilanciamento iniziale**:
  - costo `Caramella Rara` in shop aumentato a `4000`.
  - IA mosse nemica migliorata (preferenza KO/superefficaci a danno atteso).
  - Team avversari Lega/Master potenziati con IV/EV migliori.

## Aggiornamenti Dati e Salvataggio (Apr 2026)

- **Persistenza su IndexedDB**: lo store Zustand usa ora `idb-keyval` con storage asincrono (`createJSONStorage`) mantenendo fallback sicuro su `localStorage`.
- **Migrazione automatica**: al primo avvio utile, i dati legacy vengono copiati da `localStorage` a IndexedDB con verifica di scrittura e flag di migrazione.
- **Backup legacy**: mantenuto un backup in `localStorage` (`pokedesk-save-legacy-backup`) per resilienza durante la transizione.
- **Export/Import migliorati** (`OptionsScreen`):
  - Export: priorità IndexedDB, fallback su `localStorage`, fallback su backup legacy.
  - Import: validazione JSON, scrittura preferita in IndexedDB, fallback su `localStorage`, reload guidato app.
- **Compatibilità mobile/PWA**: comportamento più robusto su browser moderni con quota storage generalmente superiore rispetto al solo `localStorage`.

## Aggiornamento Gameplay (Apr 2026)

- **Breeding - Tempo uova**: le nuove uova richiedono ora `48 ore` (prima `72 ore`).
- **Retrocompatibilità timer**: le uova già in incubazione mantengono il timer originario salvato, evitando side-effect sui salvataggi esistenti.
