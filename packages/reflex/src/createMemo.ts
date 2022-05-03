import { createSignal, ISignalOptions } from './createSignal';
import { scopeStack } from './scopeStackInternal';
import { addChildScope, ITrackingScope } from './scope';
import { runWithScope } from './scopeStack';

/** Computes a derived value, and re-computes it if any of the inputs it depends on change. */
export function createMemo<T>(
  factory: (value: T) => T,
  value?: T,
  options?: ISignalOptions<T>
): () => T {
  const react = () => runWithScope(scope, () => write(factory(value!)));
  const scope: ITrackingScope = {
    react,
    dependencies: new Set(),
    debugName: 'createMemo',
  };

  if (scopeStack.length > 0) {
    addChildScope(scopeStack[scopeStack.length - 1], scope);
  }

  // Get the initial value of the signal.
  value = runWithScope(scope, () => factory(value!));
  const [read, write] = createSignal<T>(value!, options);
  return read;
}
