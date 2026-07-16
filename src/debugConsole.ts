import { useStore } from './store';
import { REGIONAL_FORM_IDS } from './data/regionalForms';
import { MEGA_IDS } from './data/legendaryIds';

type PokeDeskDebug = {
  help: () => void;
  dumpState: () => unknown;
  summary: () => Record<string, unknown>;
  listRegionalStatus: () => { id: number; status: string }[];
  listMissingRegionals: () => number[];
  listExtraSpecialIds: () => number[];
  listCaughtIdsAbove10000: () => number[];
  listCaughtNonRegionalSpecialIds: () => number[];
  logCaughtSpecialDiagnostics: () => {
    caughtAbove10000: number[];
    nonRegionalCaught: number[];
  };
  resetTimers: () => void;
  resetRegionalTimer: () => void;
  resetIslandTimer: () => void;
  addCoins: (amount?: number) => void;
  addItem: (itemId: string, amount?: number) => void;
  markRegionalCaught: (id: number) => void;
  markRegionalSeen: (id: number) => void;
};

declare global {
  interface Window {
    PokeDeskDebug?: PokeDeskDebug;
  }
}

const getPokedex = () => useStore.getState().pokedex;

const commands: PokeDeskDebug = {
  help: () => {
    console.group('PokeDeskDebug commands');
    console.info('window.PokeDeskDebug.summary()');
    console.info('window.PokeDeskDebug.listRegionalStatus()');
    console.info('window.PokeDeskDebug.listMissingRegionals()');
    console.info('window.PokeDeskDebug.listCaughtIdsAbove10000()');
    console.info('window.PokeDeskDebug.listCaughtNonRegionalSpecialIds()');
    console.info('window.PokeDeskDebug.logCaughtSpecialDiagnostics()');
    console.info('window.PokeDeskDebug.listExtraSpecialIds()');
    console.info('window.PokeDeskDebug.resetTimers()');
    console.info('window.PokeDeskDebug.resetRegionalTimer()');
    console.info('window.PokeDeskDebug.resetIslandTimer()');
    console.info('window.PokeDeskDebug.addCoins(amount)');
    console.info('window.PokeDeskDebug.addItem(itemId, amount)');
    console.info('window.PokeDeskDebug.markRegionalCaught(id)');
    console.info('window.PokeDeskDebug.markRegionalSeen(id)');
    console.info('window.PokeDeskDebug.dumpState()');
    console.groupEnd();
  },

  dumpState: () => {
    const state = useStore.getState();
    console.log('Game store state:', state);
    return state;
  },

  summary: () => {
    const state = useStore.getState();
    const pokedex = getPokedex();
    const totalCaught = Object.values(pokedex).filter((status) => status === 'caught').length;
    const regionalCaught = REGIONAL_FORM_IDS.filter((id) => pokedex[id] === 'caught').length;
    const regionalSeen = REGIONAL_FORM_IDS.filter((id) => pokedex[id] === 'seen' || pokedex[id] === 'caught').length;
    const megaCaught = Object.entries(pokedex).filter(([id, status]) => status === 'caught' && MEGA_IDS.has(Number(id))).length;
    const extraIds = Object.entries(pokedex)
      .map(([id, status]) => Number(id))
      .filter((id) => id > 10000 && !MEGA_IDS.has(id) && !REGIONAL_FORM_IDS.includes(id));

    const result = {
      totalCaught,
      regionalCaught,
      regionalSeen,
      regionalTotal: REGIONAL_FORM_IDS.length,
      megaCaught,
      extraSpecialIds: extraIds,
    };
    console.table(result);
    return result;
  },

  listRegionalStatus: () => {
    const pokedex = getPokedex();
    const list = REGIONAL_FORM_IDS.map((id) => ({
      id,
      status: pokedex[id] ?? 'missing',
    }));
    console.table(list);
    return list;
  },

  listMissingRegionals: () => {
    const pokedex = getPokedex();
    const missing = REGIONAL_FORM_IDS.filter((id) => pokedex[id] !== 'caught');
    console.log('Missing regional IDs:', missing);
    return missing;
  },

  listCaughtIdsAbove10000: () => {
    const pokedex = getPokedex();
    const caught = Object.entries(pokedex)
      .filter(([, status]) => status === 'caught')
      .map(([id]) => Number(id))
      .filter((id) => id > 10000);
    console.log('Caught IDs > 10000:', caught);
    return caught;
  },

  listCaughtNonRegionalSpecialIds: () => {
    const pokedex = getPokedex();
    const caughtNonRegional = Object.entries(pokedex)
      .filter(([, status]) => status === 'caught')
      .map(([id]) => Number(id))
      .filter((id) => id > 10000 && !REGIONAL_FORM_IDS.includes(id));
    console.log('Caught IDs > 10000 not in REGIONAL_FORM_IDS:', caughtNonRegional);
    return caughtNonRegional;
  },

  listExtraSpecialIds: () => {
    const pokedex = getPokedex();
    const extra = Object.entries(pokedex)
      .map(([id, status]) => Number(id))
      .filter((id) => id > 10000 && !MEGA_IDS.has(id) && !REGIONAL_FORM_IDS.includes(id));
    console.log('IDs > 10000 that are not official regional forms:', extra);
    return extra;
  },

  logCaughtSpecialDiagnostics: () => {
    const pokedex = getPokedex();
    const caughtAbove10000 = Object.entries(pokedex)
      .filter(([, status]) => status === 'caught')
      .map(([id]) => Number(id))
      .filter((id) => id > 10000);
    const nonRegionalCaught = caughtAbove10000.filter((id) => !REGIONAL_FORM_IDS.includes(id));

    console.group('PokeDeskDebug diagnostics');
    console.log('Caught IDs > 10000:', caughtAbove10000);
    console.log('Caught IDs > 10000 not in REGIONAL_FORM_IDS:', nonRegionalCaught);
    console.groupEnd();

    return {
      caughtAbove10000,
      nonRegionalCaught,
    };
  },

  resetTimers: () => {
    const now = Date.now();
    useStore.setState({
      lastTickTimestamp: now,
      lastSafariTickTimestamp: now,
      lastRegionalTickTimestamp: now,
      lastIslandTickTimestamp: now,
      charges: 6,
      safariCharges: 8,
      regionalCharges: 3,
      islandCharges: 3,
    });
    console.log('Timers and charges reset to full.');
  },

  resetRegionalTimer: () => {
    const now = Date.now();
    useStore.setState({
      lastRegionalTickTimestamp: now,
      regionalCharges: 3,
    });
    console.log('Regional timer reset. Regional charges set to 3.');
  },

  resetIslandTimer: () => {
    const now = Date.now();
    useStore.setState({
      lastIslandTickTimestamp: now,
      islandCharges: 3,
    });
    console.log('Island timer reset. Island charges set to 3.');
  },

  addCoins: (amount = 1000) => {
    useStore.setState((state) => ({ coins: state.coins + amount }));
    console.log(`Added ${amount} coins.`);
  },

  addItem: (itemId: string, amount = 1) => {
    useStore.getState().addItem(itemId, amount);
    console.log(`Added ${amount} x ${itemId}.`);
  },

  markRegionalCaught: (id: number) => {
    if (!REGIONAL_FORM_IDS.includes(id)) {
      console.warn(`ID ${id} is not an official regional form.`);
      return;
    }
    useStore.getState().updatePokedex(id, 'caught');
    console.log(`Marked regional ID ${id} as caught.`);
  },

  markRegionalSeen: (id: number) => {
    if (!REGIONAL_FORM_IDS.includes(id)) {
      console.warn(`ID ${id} is not an official regional form.`);
      return;
    }
    useStore.getState().updatePokedex(id, 'seen');
    console.log(`Marked regional ID ${id} as seen.`);
  },
};

export function setupDebugConsole() {
  if (typeof window === 'undefined') return;
  window.PokeDeskDebug = commands;
  console.log('PokeDeskDebug ready. Usa window.PokeDeskDebug.help() per i comandi.');
}
