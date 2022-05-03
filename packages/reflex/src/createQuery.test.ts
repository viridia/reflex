import { TrackingScope } from './TrackingScope';
import { setContext } from './context';
import { createQuery, createQueryCache, queryCacheContext } from './createQuery';
import { runWithScope } from './scopeStack';

describe('createQuery', () => {
  test('success', async () => {
    const reaction = jest.fn();
    const scope = new TrackingScope(reaction);
    setContext(scope, queryCacheContext, createQueryCache());
    const mockQuery = jest.fn().mockResolvedValue(77);
    const result = runWithScope(scope, () => createQuery('qkey', mockQuery));
    expect(result.loading).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result()).toBeUndefined();

    await Promise.resolve();
    expect(result.loading).toBe(false);
    expect(result.error).toBeUndefined();
    expect(result()).toBe(77);
  });

  test('failure', async () => {
    const reaction = jest.fn();
    const scope = new TrackingScope(reaction);
    setContext(scope, queryCacheContext, createQueryCache());
    const mockQuery = jest.fn().mockRejectedValue(new Error('bad'));
    const result = runWithScope(scope, () => createQuery('qkey', mockQuery));
    expect(result.loading).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result()).toBeUndefined();

    await Promise.resolve();
    expect(result.loading).toBe(false);
    expect(result.error).toEqual(expect.any(Error));
    expect(result()).toBeUndefined();
  });

  // TODO: test that the tracking scope is what we think it is.
  // Note that it won't be the same after the await.

  test('caching', async () => {
    const reaction = jest.fn();
    const scope = new TrackingScope(reaction);
    setContext(scope, queryCacheContext, createQueryCache());
    const mockQuery = jest.fn().mockResolvedValue(77);
    const result = runWithScope(scope, () => createQuery('qkey', mockQuery));
    expect(result.loading).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result()).toBeUndefined();

    await Promise.resolve();
    expect(result.loading).toBe(false);
    expect(result.error).toBeUndefined();
    expect(result()).toBe(77);
  });
});
