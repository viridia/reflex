import { createEffect } from './createEffect';
import { onCleanup } from './onCleanup';
import { createSignal } from './createSignal';
import { createRoot } from './createRoot';

describe('createEffect', () => {
  test('deduping', () => {
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

  test('onCleanup', () => {
    const [count, setCount] = createSignal(0);
    const cleanup = jest.fn();
    const effect = jest.fn().mockImplementation(() => {
      count();
      onCleanup(cleanup);
    });

    // Effect gets run first time.
    createEffect(effect);
    expect(cleanup).toHaveBeenCalledTimes(0);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(count()).toBe(0);

    // Set count, should run effect again.
    setCount(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);

    // Set count to the same thing, should not run effect again.
    setCount(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);
  });

  test('onCleanup with root', () => {
    const [count, setCount] = createSignal(0);
    const cleanup = jest.fn();
    const effect = jest.fn().mockImplementation(() => {
      count();
      onCleanup(cleanup);
    });

    // Effect gets run first time.
    let dispose: () => void;
    createRoot(d => {
      dispose = d;
      createEffect(effect);
    });

    expect(cleanup).toHaveBeenCalledTimes(0);
    expect(effect).toHaveBeenCalledTimes(1);
    expect(count()).toBe(0);

    // Set count, should run effect again.
    setCount(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);

    // Set count to the same thing, should not run effect again.
    setCount(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(count()).toBe(1);

    expect(cleanup).toHaveBeenCalledTimes(1);
    dispose!();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
