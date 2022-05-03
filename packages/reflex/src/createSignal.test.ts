import { batchUpdate } from './batched';
import { createEffect } from './createEffect';
import { createSignal } from './createSignal';

describe('createSignal', () => {
  test('get / set', () => {
    const [count, setCount] = createSignal(0);

    expect(count()).toBe(0);
    setCount(1);
    expect(count()).toBe(1);
  });

  test('default comparator', () => {
    const [count, setCount] = createSignal(0);
    const effect = jest.fn().mockImplementation(() => count());

    // Effect gets run first time.
    createEffect(effect);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(count()).toBe(0);

    // Set count, should run effect again.
    setCount(1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);

    // Set count to the same thing, should not run effect again.
    setCount(1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);
  });

  test('comparator = false', () => {
    const [count, setCount] = createSignal(0, { equals: false });
    const effect = jest.fn().mockImplementation(() => count());

    // Effect gets run first time.
    createEffect(effect);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(count()).toBe(0);

    // Set count, should run effect again.
    setCount(1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);

    // Set count to the same thing, still runs effect
    setCount(1);
    expect(effect).toHaveBeenCalledTimes(3);
    expect(count()).toBe(1);
  });

  test('custom comparator', () => {
    const [count, setCount] = createSignal(0, {
      equals: (a, b) => Math.round(a) === Math.round(b),
    });
    const effect = jest.fn().mockImplementation(() => count());

    // Effect gets run first time.
    createEffect(effect);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(count()).toBe(0);

    // Set count, should run effect again.
    setCount(1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);

    // Set count to *approximately* the same thing
    setCount(1.1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);
  });

  test('batch', () => {
    const [count, setCount] = createSignal(0);
    const effect = jest.fn().mockImplementation(() => count());

    // Effect gets run first time.
    createEffect(effect);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(count()).toBe(0);

    // Not batched, should update effect multiple times.
    jest.clearAllMocks();
    setCount(1);
    setCount(2);
    setCount(3);
    expect(effect).toHaveBeenCalledTimes(3);
    expect(count()).toBe(3);

    jest.clearAllMocks();

    // Batched, should run effect only once.
    batchUpdate(() => {
      setCount(4);
      expect(count()).toBe(3);
      setCount(5);
      expect(count()).toBe(3);
      setCount(6);
      expect(count()).toBe(3);
    });
    expect(effect).toHaveBeenCalledTimes(1);
    expect(count()).toBe(6);
  });

  test('reducer form', () => {
    const [count, setCount] = createSignal(0);
    const effect = jest.fn().mockImplementation(() => count());

    // Effect gets run first time.
    createEffect(effect);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(count()).toBe(0);

    // Pass function as setter
    setCount(n => n + 1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);

    setCount(n => n + 1);
    expect(effect).toHaveBeenCalledTimes(3);
    expect(count()).toBe(2);
  });
});
