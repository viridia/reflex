import { createEffect } from './createEffect';
import { createContext, withContext, withProvidedContext, withProvidedContexts } from './context';
import { createMemo } from './createMemo';

const contextA = createContext<number>();
const contextB = createContext<string>();

describe('context', () => {
  test('withProvidedContext', () => {
    let a = 0;
    createEffect(() => {
      withProvidedContext(contextA, 1, () => {
        createEffect(() => {
          a = withContext(contextA);
        });
      });
    });

    expect(a).toBe(1);
  });

  test('withProvidedContexts', () => {
    let a = 0;
    let b = '0';
    createEffect(() => {
      withProvidedContexts(
        [
          [contextA, 1],
          [contextB, 'test'],
        ],
        () => {
          createEffect(() => {
            a = withContext(contextA);
            b = withContext(contextB);
          });
        }
      );
    });

    expect(a).toBe(1);
    expect(b).toBe('test');
  });

  test('async', () => {
    let memo: () => number;
    createEffect(() => {
      withProvidedContext(contextA, 1, () => {
        memo = createMemo(() => {
          return withContext(contextA);
        });
      });
    });

    // We can call the memo even though the scope it was defined in is not the current scope.
    expect(memo!()).toBe(1);
  });
});
