import { onCleanup } from './onCleanup';
import { createRoot } from './createRoot';

describe('createRoot', () => {
  test('top-level onCleanup', () => {
    const cleanup = jest.fn();
    let dispose!: () => void;
    createRoot(d => {
      dispose = d;
      onCleanup(cleanup);
    });

    expect(cleanup).toHaveBeenCalledTimes(0);
    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
