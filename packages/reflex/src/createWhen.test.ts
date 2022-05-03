import { createSignal } from './createSignal';
import { createWhen } from './createWhen';

describe('createWhen', () => {
  test('initially false', () => {
    const [condition, setCondition] = createSignal(false);
    const action = jest.fn();

    // Effect gets run first time.
    createWhen(condition, action);
    expect(action).not.toHaveBeenCalled();

    // Action gets called once condition is true.
    setCondition(true);
    expect(action).toHaveBeenCalledTimes(1);

    // It's no longer reactive once called
    setCondition(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  test('initially true', () => {
    const [condition, setCondition] = createSignal(true);
    const action = jest.fn();

    // Action gets called right away.
    createWhen(condition, action);
    expect(action).toHaveBeenCalledTimes(1);

    setCondition(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  test('early dispose', () => {
    const [condition, setCondition] = createSignal(false);
    const action = jest.fn();

    const dispose = createWhen(condition, action);
    expect(action).not.toHaveBeenCalled();

    // No longer reacts when disposed.
    dispose();
    setCondition(true);
    expect(action).not.toHaveBeenCalled();
  });
});
