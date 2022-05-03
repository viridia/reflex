import { createSignal } from './createSignal';
import { createMemo } from './createMemo';
import { batchUpdate } from './batched';
import { createEffect } from './createEffect';

describe('createMemo', () => {
  test('basic', () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    const memoFn = jest.fn().mockImplementation(() => a() + b());

    // Initial computation of the memo.
    const sum = createMemo(memoFn);
    expect(memoFn).toHaveBeenCalledTimes(1);
    expect(sum()).toBe(0);

    // Set to the same value, should not run again.
    setA(0);
    expect(memoFn).toHaveBeenCalledTimes(1);
    expect(sum()).toBe(0);

    // Set one of the dependencies, should run again.
    setA(1);
    expect(memoFn).toHaveBeenCalledTimes(2);
    expect(sum()).toBe(1);

    // Set the other dependency, should run again.
    setB(2);
    expect(memoFn).toHaveBeenCalledTimes(3);
    expect(sum()).toBe(3);

    // Set both in batch, should run only once.
    batchUpdate(() => {
      setA(4);
      setB(5);
    });
    expect(memoFn).toHaveBeenCalledTimes(4);
    expect(sum()).toBe(9);
  });

  test('should not react when no change in input', () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    const memoFn = jest.fn().mockImplementation(() => a() + b());
    const effect = jest.fn();

    // Initial computation of the memo.
    const sum = createMemo(memoFn);
    createEffect(() => {
      sum();
      effect();
    });
    expect(sum()).toBe(0);
    expect(sum()).toBe(0);
    expect(memoFn).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledTimes(1);

    setA(0);
    setB(0);
    expect(sum()).toBe(0);
    expect(sum()).toBe(0);
    expect(memoFn).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('should not react when no change in output', () => {
    const [a, setA] = createSignal(0);
    const [b] = createSignal(0);
    const memoFn = jest.fn().mockImplementation(() => a() * b());
    const effect = jest.fn();

    // Initial computation of the memo.
    const sum = createMemo(memoFn);
    createEffect(() => {
      sum();
      effect();
    });
    expect(sum()).toBe(0);
    expect(sum()).toBe(0);
    expect(memoFn).toHaveBeenCalledTimes(1);
    expect(effect).toHaveBeenCalledTimes(1);

    batchUpdate(() => {
      setA(1);
    });
    expect(sum()).toBe(0);
    expect(sum()).toBe(0);
    expect(memoFn).toHaveBeenCalledTimes(2);
    expect(effect).toHaveBeenCalledTimes(1);
  });

  test('in batch', () => {
    const memoFn = jest.fn().mockImplementation(() => 1 + 2);

    // Make sure that initial value of memo gets set even if we are in a batch.
    const sum = batchUpdate(() => createMemo(memoFn));
    expect(memoFn).toHaveBeenCalledTimes(1);
    expect(sum()).toBe(3);
  });

  test('with value', () => {
    // Call memo with initial value.
    const sum = createMemo(value => value + 1, 1);
    expect(sum()).toBe(2);
  });
});
