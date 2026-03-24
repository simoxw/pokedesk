# PokéDesk - PWA Pokémon Web App

Un simulatore di battaglie e cattura Pokémon moderno, sviluppato come Progressive Web App (PWA) con React, TypeScript e Tailwind CSS.

## 🚀 Caratteristiche Principali

- **Sistema di Battaglia**: Battaglie a turni con gestione tipi, stati alterati e modificatori di stadio.
- **Cattura e Safari**: Meccaniche dedicate per catturare Pokémon, inclusa la Zona Safari (spawn Gen 6+).
- **Progressione**: Livellamento, evoluzioni, medaglie e sfide contro Capopalestra.
- **Gestione Squadra**: Team attivo, PC Box e strumenti.
- **Sistema di Cariche**: Energia temporizzata per limitare le azioni (Cattura/Lotta/Safari).
- **Ciclo Giorno/Notte**: Atmosfera dinamica nell'Hub che cambia in base all'ora reale.
- **PWA Ready**: Installabile su dispositivi mobile, supporto offline e notifiche.

## 🛠️ Tecnologie Utilizzate

- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Animazioni**: Motion (framer-motion)
- **State Management**: Zustand
- **API**: [PokeAPI](https://pokeapi.co/)

## 🎮 Come Giocare

1. **Inizio**: Scegli lo starter e il nome.
2. **Hub**: Gestisci le cariche (Cattura, Lotta, Safari).
3. **Cattura**: Esplora l'erba per incontrare Pokémon.
4. **Lotta**: Sfida allenatori e Capopalestra.
5. **Crescita**: Fai evolvere il team e colleziona medaglie.

## 📂 Struttura (File principali)

- `src/store.ts`: Stato dell'app.
- `src/BattleEngine.ts`: Logica di lotta.
- `src/CatchEngine.ts`: Logica di cattura.
- `src/components/screens/`: Interfaccia utente divisa in schermate.

## 📝 Note Tecniche

Il progetto utilizza `TickSystem.ts` per gestire gli aggiornamenti temporizzati dello stato (rigenerazione cariche, ecc.) e `api.ts` per l'interazione con le risorse esterne, includendo una cache LRU per ottimizzare il traffico dati.
