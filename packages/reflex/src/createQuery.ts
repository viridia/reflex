import { batchUpdate } from './batched';
import { createSignal } from './createSignal';
import LRU from 'lru-cache';
import { createContext, withContext } from './context';

export interface ICreateQueryConfig<T> {
  queryFn: () => Promise<T>;
}

export type ICreateQueryResult<T> = (() => T | undefined) & {
  loading: boolean;
  error?: Error;
};

export class QueryCache {
  private queries = new LRU<string, ICreateQueryResult<any>>({ max: 100 });

  public query<T>(
    key: string,
    query: ICreateQueryConfig<T> | (() => Promise<T>)
  ): ICreateQueryResult<T> {
    const result = this.queries.get(key);
    if (result) {
      return result;
    }

    const queryFn: () => Promise<T> = typeof query === 'function' ? query : query.queryFn;
    const [data, setData] = createSignal<T | undefined>(undefined);
    const [loading, setLoading] = createSignal<boolean>(true);
    const [error, setError] = createSignal<Error | undefined>(undefined);

    Reflect.defineProperty(data, 'loading', {
      get: loading,
    });
    Reflect.defineProperty(data, 'error', {
      get: error,
    });

    queryFn().then(
      value => {
        batchUpdate(() => {
          setData(value);
          setLoading(false);
        });
      },
      error => {
        batchUpdate(() => {
          setLoading(false);
          setError(error);
        });
      }
    );

    this.queries.set(key, data as ICreateQueryResult<T>);
    return data as ICreateQueryResult<T>;
  }
}

export function createQueryCache() {
  return new QueryCache();
}

export const queryCacheContext = createContext<QueryCache>();

/** Handles an asynchronous request and reacts when it resolves. */
export function createQuery<T>(
  key: string | string[],
  query: ICreateQueryConfig<T> | (() => Promise<T>)
): ICreateQueryResult<T> {
  return withContext(queryCacheContext).query(canonicalizeKey(key), query);
}

function canonicalizeKey(key: string | string[]): string {
  if (Array.isArray(key)) {
    return JSON.stringify([...key].sort());
  } else {
    return key;
  }
}