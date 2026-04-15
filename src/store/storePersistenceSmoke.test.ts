import { describe, expect, it, vi } from 'vitest';
import { useStore } from '../store';

vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => null),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}));

describe('Store Persistence Smoke', () => {
  it('creates and reads store state in test environment', () => {
    const state = useStore.getState();
    expect(state).toBeTruthy();
    expect(typeof state.addPokemon).toBe('function');
  });

  it('setState does not throw when persistence middleware runs', () => {
    expect(() => {
      useStore.setState({ coins: 321 });
    }).not.toThrow();
    expect(useStore.getState().coins).toBe(321);
  });

  it('persist rehydrate can be called safely', async () => {
    await expect((useStore as any).persist.rehydrate()).resolves.toBeUndefined();
  });
});
