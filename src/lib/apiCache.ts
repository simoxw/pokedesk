import { get, set } from 'idb-keyval';

const CACHE_PREFIX = 'pokeapi-cache:';
const MAX_MEMORY_CACHE = 200;
const memoryCache = new Map<string, any>();

function getStorageKey(key: string) {
  return `${CACHE_PREFIX}${key}`;
}

function memoryCacheSet(key: string, value: any) {
  if (memoryCache.size >= MAX_MEMORY_CACHE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey !== undefined) {
      memoryCache.delete(firstKey);
    }
  }
  memoryCache.set(key, value);
}

export const apiCache = {
  async get<T = any>(key: string): Promise<T | undefined> {
    const memoryKey = getStorageKey(key);
    if (memoryCache.has(memoryKey)) {
      return memoryCache.get(memoryKey);
    }

    try {
      const stored = await get<T>(memoryKey);
      if (stored !== undefined) {
        memoryCacheSet(memoryKey, stored);
      }
      return stored;
    } catch (err) {
      console.warn('[PokéDesk] apiCache read fallita', err);
      return undefined;
    }
  },

  async set<T = any>(key: string, value: T): Promise<void> {
    const memoryKey = getStorageKey(key);
    memoryCacheSet(memoryKey, value);
    try {
      await set(memoryKey, value);
    } catch (err) {
      console.warn('[PokéDesk] apiCache write fallita', err);
    }
  },
};
