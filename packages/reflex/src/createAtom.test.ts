import { TrackingScope } from './TrackingScope';
import { createAtom } from './createAtom';
import { runWithScope } from './scopeStack';

describe('createAtom', () => {
  test('reactions', () => {
    const react = jest.fn();
    const tc = new TrackingScope(react);
    const atom = createAtom();

    runWithScope(tc, atom.onObserved);

    expect(react).not.toHaveBeenCalled();
    atom.onChanged();
    expect(react).toHaveBeenCalledTimes(1);
    atom.onChanged();
    expect(react).toHaveBeenCalledTimes(2);
  });
});
