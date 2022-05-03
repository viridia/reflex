import { createEffect } from './createEffect';
import { createMutex } from './createMutex';

describe('createMutex', () => {
  test('single', () => {
    const mutex = createMutex();
    const lock = mutex();
    expect(lock.held).toBe(true);
    lock.release();
    expect(lock.held).toBe(false);
  });

  test('multiple', () => {
    const mutex = createMutex();
    const lock1 = mutex();
    const lock2 = mutex();
    const lock3 = mutex();

    expect(lock1.held).toBe(true);
    expect(lock2.held).toBe(false);
    expect(lock3.held).toBe(false);

    lock1.release();
    expect(lock1.held).toBe(false);
    expect(lock2.held).toBe(true);
    expect(lock3.held).toBe(false);

    // Releasing again does nothing.
    lock1.release();
    expect(lock1.held).toBe(false);
    expect(lock2.held).toBe(true);
    expect(lock3.held).toBe(false);

    lock2.release();
    expect(lock1.held).toBe(false);
    expect(lock2.held).toBe(false);
    expect(lock3.held).toBe(true);

    lock3.release();
    expect(lock1.held).toBe(false);
    expect(lock2.held).toBe(false);
    expect(lock3.held).toBe(false);
  });

  test('react', () => {
    const mutex = createMutex();
    const lock1 = mutex();
    const lock2 = mutex();
    const lock3 = mutex();

    const eff1 = jest.fn();
    const eff2 = jest.fn();
    const eff3 = jest.fn();

    createEffect(() => {
      eff1(lock1.held);
    });

    createEffect(() => {
      eff2(lock2.held);
    });

    createEffect(() => {
      eff3(lock3.held);
    });

    expect(eff1).toBeCalledTimes(1);
    expect(eff2).toBeCalledTimes(1);
    expect(eff3).toBeCalledTimes(1);

    lock1.release();

    expect(eff1).toBeCalledTimes(2);
    expect(eff2).toBeCalledTimes(2);
    expect(eff3).toBeCalledTimes(1);

    // Releasing again does nothing.
    lock1.release();

    expect(eff1).toBeCalledTimes(2);
    expect(eff2).toBeCalledTimes(2);
    expect(eff3).toBeCalledTimes(1);

    lock2.release();

    expect(eff1).toBeCalledTimes(2);
    expect(eff2).toBeCalledTimes(3);
    expect(eff3).toBeCalledTimes(2);

    lock3.release();

    expect(eff1).toBeCalledTimes(2);
    expect(eff2).toBeCalledTimes(3);
    expect(eff3).toBeCalledTimes(3);
  });
});
