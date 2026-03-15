# PokéDesk - PWA Pokémon Web App

Un simulatore di battaglie e cattura Pokémon moderno, sviluppato come Progressive Web App (PWA) con React, TypeScript e Tailwind CSS. Il progetto utilizza l'API PokeAPI per i dati dei Pokémon e delle mosse.

## 🚀 Caratteristiche Principali

- **Sistema di Battaglia Completo**: Battaglie a turni con calcolo dei danni basato su statistiche, tipi, critici e modificatori di stadio (stat stages).
- **Stati Alterati**: Gestione di Sonno (SLP), Paralisi (PAR), Scottatura (BRN), Avvelenamento (PSN) e Congelamento (FRZ) con effetti reali sul combattimento.
- **Cattura Pokémon**: Meccanica di cattura con probabilità basate su HP rimanenti e tipo di Pokéball (Gen 1-4).
- **Progressione e Crescita**: Guadagno ESP, livellamento, evoluzioni automatiche e apprendimento di nuove mosse.
- **Gestione Squadra**: Team di 4 Pokémon attivi, Box per i Pokémon in eccesso e gestione strumenti (Pozioni, Caramelle Rare, ecc.).
- **Sistema di Cariche**: Meccanica di energia temporizzata per limitare le azioni (Cattura/Lotta) e incentivare il ritorno quotidiano.
- **PWA Ready**: Installabile su dispositivi mobile con supporto offline e notifiche.

## 🛠️ Tecnologie Utilizzate

- **Framework**: React 18 con Vite
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS
- **Animazioni**: Motion (framer-motion)
- **State Management**: Zustand (con persistenza in LocalStorage)
- **Icone**: Lucide React
- **API**: [PokeAPI](https://pokeapi.co/)

## 📂 Struttura del Progetto

- `src/api.ts`: Gestione chiamate API con cache LRU (200 voci).
- `src/store.ts`: Stato globale dell'app (Giocatore, Team, Inventario, Pokedex).
- `src/BattleEngine.ts`: Logica di calcolo danni e interazioni tipi.
- `src/CatchEngine.ts`: Logica di generazione IV e calcolo cattura.
- `src/components/screens/`: Tutte le schermate principali (Hub, Battle, Catch, Team, ecc.).
- `src/components/ui/`: Componenti riutilizzabili (Barre HP, Card, Modali).

## 🎮 Come Giocare

1. **Inizio**: Scegli il tuo starter e il tuo nome.
2. **Hub**: Gestisci le tue cariche. Ogni 5 minuti guadagni una carica per catturare o lottare.
3. **Cattura**: Esplora l'erba alta per trovare Pokémon delle prime 4 generazioni.
4. **Lotta**: Sfida allenatori casuali. Ogni 10 vittorie affronterai un Capopalestra per sbloccare una medaglia.
5. **Crescita**: Usa le Caramelle Rare o combatti per far evolvere i tuoi Pokémon.

## 📝 Note Tecniche

Il sistema di battaglia implementa:
- Moltiplicatori di stadio per le statistiche (da -6 a +6).
- Controllo accuratezza per ogni mossa.
- Tooltip informativi sulle mosse (Desktop: Hover, Mobile: Long Press).
- Cache delle chiamate API per minimizzare il traffico dati.
