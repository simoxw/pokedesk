# PokeDesk Console Debug Guide

Questa guida spiega come usare il debug helper `window.PokeDeskDebug` nella console del browser.

## Come aprire la console

1. Avvia l'app con `npm run dev`.
2. Apri il browser a `http://localhost:3000` (o il relativo indirizzo Vite).
3. Apri gli strumenti di sviluppo (`F12` o `Ctrl+Shift+I`).
4. Vai alla tab `Console`.

## Inizializzazione

Il debug helper viene registrato automaticamente all'avvio dell'app.
Quando l'app è caricata, cerca nel console log:

```text
PokeDeskDebug ready. Usa window.PokeDeskDebug.help() per i comandi.
```

Se compare, puoi usare subito `window.PokeDeskDebug`.

## Principali comandi disponibili

### 1. `window.PokeDeskDebug.help()`
Stampa in console l'elenco completo dei comandi e il loro utilizzo.

### 2. `window.PokeDeskDebug.dumpState()`
Mostra lo stato completo del store in console.
Utile quando vuoi ispezionare rapidamente valori come `coins`, `team`, `pokedex`, `charges`, `regionalCharges`, `islandCharges`, ecc.

### 3. `window.PokeDeskDebug.summary()`
Restituisce e stampa un riassunto diagnostico utile:
- `totalCaught`
- `regionalCaught`
- `regionalSeen`
- `regionalTotal`
- `megaCaught`
- `extraSpecialIds`

### 4. `window.PokeDeskDebug.listRegionalStatus()`
Stampa una tabella con tutti gli ID di forme regionali ufficiali e il loro stato nel Pokedex:
- `caught`
- `seen`
- `missing`

### 5. `window.PokeDeskDebug.listMissingRegionals()`
Stampa gli ID regionali ufficiali ancora non marcati come `caught`.

### 6. `window.PokeDeskDebug.listCaughtIdsAbove10000()`
Stampa tutti gli ID `> 10000` che sono attualmente marcati come `caught`.
Questi includono forme regionali e altre forme speciali come Mega.

### 7. `window.PokeDeskDebug.listCaughtNonRegionalSpecialIds()`
Stampa tutti gli ID `> 10000` marcati `caught` che non sono presenti in `REGIONAL_FORM_IDS`.
Questo aiuta a isolare solo le anomalie rispetto ai regionali ufficiali.

### 8. `window.PokeDeskDebug.logCaughtSpecialDiagnostics()`
Esegue un controllo diagnostico completo e raggruppa in console:
- `Caught IDs > 10000`
- `Caught IDs > 10000 not in REGIONAL_FORM_IDS`

### 9. `window.PokeDeskDebug.listExtraSpecialIds()`
Stampa tutti gli ID `> 10000` che non sono né Mega né regionali ufficiali.
Utile per capire se ci sono dati speciali non gestiti.

### 10. `window.PokeDeskDebug.resetTimers()`
Resetta i timer e imposta le cariche a massimo:
- `charges = 6`
- `safariCharges = 8`
- `regionalCharges = 3`
- `islandCharges = 3`
- tutti i timestamp di tick a ora corrente

### 11. `window.PokeDeskDebug.resetRegionalTimer()`
Resetta solo il timer regionale e ripristina `regionalCharges = 3`.

### 12. `window.PokeDeskDebug.resetIslandTimer()`
Resetta solo il timer dell'isola e ripristina `islandCharges = 3`.

### 13. `window.PokeDeskDebug.addCoins(amount)`
Aggiunge `amount` monete al saldo. Se non passi nulla, aggiunge `1000`.

### 14. `window.PokeDeskDebug.addItem(itemId, amount)`
Chiama l'azione `addItem` dello store.
Esempio:

```js
window.PokeDeskDebug.addItem('potion', 5);
```

### 15. `window.PokeDeskDebug.markRegionalCaught(id)`
Marca l'ID regionale specificato come `caught`.
Usa solo per ID presenti in `REGIONAL_FORM_IDS`.

### 16. `window.PokeDeskDebug.markRegionalSeen(id)`
Marca l'ID regionale specificato come `seen`.
Usa solo per ID presenti in `REGIONAL_FORM_IDS`.

## Diagnostica specifica per il bug regionale

Questi comandi servono per capire esattamente cosa è salvato nello stato e quali ID sono fuori posto.

### Passo 1: controlla se il debug helper è pronto

```js
window.PokeDeskDebug.help();
```

### Passo 2: visualizza il riassunto Pokédex

```js
window.PokeDeskDebug.summary();
```

Dovresti vedere:
- `regionalTotal: 54`
- `regionalCaught` e `regionalSeen`
- `extraSpecialIds`

### Passo 3: controlla le forme regionali ufficiali mancanti

```js
window.PokeDeskDebug.listMissingRegionals();
```

### Passo 4: controlla tutti gli ID `> 10000` segnati come `caught`

```js
window.PokeDeskDebug.listCaughtIdsAbove10000();
```

### Passo 5: controlla gli ID `> 10000` marcati `caught` ma non ufficiali

```js
window.PokeDeskDebug.listCaughtNonRegionalSpecialIds();
```

### Passo 6: diagnostica raggruppata

```js
window.PokeDeskDebug.logCaughtSpecialDiagnostics();
```

Questa funzione stampa due insiemi utili per isolare la discrepanza.

## Esempio di controllo passo passo

1. `window.PokeDeskDebug.help()` → verifica che il helper sia registrato.
2. `window.PokeDeskDebug.summary()` → verifica il totale regionale e gli extra.
3. `window.PokeDeskDebug.listCaughtIdsAbove10000()` → vedi tutti gli ID `> 10000` segnati `caught`.
4. `window.PokeDeskDebug.listCaughtNonRegionalSpecialIds()` → verifica se ci sono ID speciali non regionali.
5. `window.PokeDeskDebug.logCaughtSpecialDiagnostics()` → conferma i log raggruppati.

## Note finali

- Se trovi ID `> 10000` che non sono in `REGIONAL_FORM_IDS`, significa che il bug sta nel salvataggio/stato o nel conteggio che usa `id > 10000` come unico criterio.
- Se il numero correttamente riconosciuto è 54, allora il bug è probabilmente nella logica di conteggio iniziale e non nel dataset regionale.

## Uso rapido

Copia e incolla qui sotto in console:

```js
window.PokeDeskDebug.help();
window.PokeDeskDebug.summary();
window.PokeDeskDebug.listCaughtIdsAbove10000();
window.PokeDeskDebug.listCaughtNonRegionalSpecialIds();
window.PokeDeskDebug.logCaughtSpecialDiagnostics();
```

Questo ti darà subito i valori chiave per analizzare il problema.
