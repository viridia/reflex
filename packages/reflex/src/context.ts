import { scopeStack } from './scopeStackInternal';
import { ITrackingScope } from './scope';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface IContext<T> {
  key: symbol;
}

export type ContextBinding<T> = [IContext<T>, T];

/** Create a new context key. */
export function createContext<T>(): IContext<T> {
  return {
    key: Symbol(),
  };
}

/** Bind a context value directly to a scope, permanently. */
export function setContext<T>(scope: ITrackingScope, context: IContext<T>, value: T): void {
  if (!scope.contexts) {
    scope.contexts = {};
  }
  scope.contexts[context.key] = value;
}

/** Bind a context value to the current tracking scope. It will be available in all child scopes. */
export function withProvidedContext<T, R>(context: IContext<T>, value: T, fn: () => R): R {
  const scope = scopeStack[scopeStack.length - 1];
  if (!scope) {
    throw new Error('Cannot bind a context when there is no current tracking scope.');
  }
  if (!scope.contexts) {
    scope.contexts = {};
  }
  scope.contexts[context.key] = value;
  let result = fn();
  delete scope.contexts[context.key];
  return result;
}

/** Bind multiple context values to the current tracking scope.
    They will be available in all child scopes. */
export function withProvidedContexts<R>(contexts: ContextBinding<any>[], fn: () => R): R {
  const scope = scopeStack[scopeStack.length - 1];
  if (!scope) {
    throw new Error('Cannot bind a context when there is no current tracking scope.');
  }
  if (!scope.contexts) {
    scope.contexts = {};
  }
  for (let i = 0, ct = contexts.length; i < ct; i++) {
    const [ctx, value] = contexts[i];
    scope.contexts[ctx.key] = value;
  }
  let result = fn();
  for (let i = 0, ct = contexts.length; i < ct; i++) {
    const [ctx] = contexts[i];
    delete scope.contexts[ctx.key];
  }
  return result;
}

/** Consumes the context bound to the current tracking scope or one of it's parents. */
export function withContext<T>(context: IContext<T>): T {
  const scope = scopeStack[scopeStack.length - 1];
  if (!scope) {
    throw new Error('Cannot consume a context when there is no current tracking scope.');
  }
  for (let s: ITrackingScope | undefined = scope; s; s = s.parentScope) {
    if (s.contexts) {
      const ctx = s.contexts[context.key];
      if (ctx) {
        return ctx;
      }
    }
  }

  throw new Error('Context not found');
}
