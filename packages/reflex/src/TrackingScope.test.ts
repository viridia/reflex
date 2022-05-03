import { TrackingScope } from './TrackingScope';
import { createSignal } from './createSignal';
import { runWithScope } from './scopeStack';

describe('TrackingContext', () => {
  const reaction = jest.fn();
  let tc: TrackingScope;

  beforeEach(() => {
    reaction.mockClear();
    tc = new TrackingScope(reaction);
  });

  afterEach(() => {
    tc.dispose();
  });

  test('initial state', () => {
    expect(tc.size).toBe(0);
  });

  test('track dependency', () => {
    const [getter, setter] = createSignal(false);
    runWithScope(tc, getter);
    expect(tc.size).toBe(1);
    expect(reaction).not.toHaveBeenCalled();
    setter(true);
    expect(reaction).toHaveBeenCalledTimes(1);
    setter(false);
    expect(reaction).toHaveBeenCalledTimes(2);
  });
});
