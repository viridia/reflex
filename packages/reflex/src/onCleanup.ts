import { scopeStack } from './scopeStackInternal';

export function onCleanup(cleanup: () => void): void {
  const scope = scopeStack[scopeStack.length - 1];
  if (scope) {
    if (!scope.cleanup) {
      scope.cleanup = [];
    }
    scope.cleanup.push(cleanup);
  }
}
