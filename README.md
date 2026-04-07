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
- **Isole Leggendarie**: Nuova modalità giornaliera per catturare un leggendario (sbloccata dopo una run Lega).
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

## 📝 Note Tecniche

Il progetto implementa un `TickSystem.ts` robusto per la rigenerazione dello stato in background (cariche, schiusa uova) e utilizza un sistema di routing basato su stati in `App.tsx` per una transizione fluida tra le schermate stile app nativa.
