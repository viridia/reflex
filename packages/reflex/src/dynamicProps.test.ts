import { createSignal } from './createSignal';
import { ConditionalDynamic, dynamicProps } from './dynamicProps';

describe('dynamicProps', () => {
  test('simple', () => {
    const [a, setA] = createSignal(false);
    const b = false;

    const condProps: ConditionalDynamic<{ a: boolean; b: boolean }, 'a'> = {
      a,
      b,
    };
    expect(condProps.a).toBe(a);
    expect(condProps.b).toBe(b);

    const dProps = dynamicProps({ a, b }, ['a']);
    expect(dProps.a).toBe(false);
    setA(true);
    expect(dProps.a).toBe(true);
  });

  test('function prop', () => {
    const [a, setA] = createSignal(false);
    const b = false;
    const c = jest.fn().mockReturnValue(0);

    const condProps: ConditionalDynamic<{ a: boolean; b: boolean; c: () => number }, 'a'> = {
      a,
      b,
      c,
    };
    expect(condProps.a).toBe(a);
    expect(condProps.b).toBe(b);
    expect(condProps.c).toBe(c);

    const dProps = dynamicProps({ a, b, c }, ['a']);
    expect(dProps.a).toBe(false);
    setA(true);
    expect(dProps.a).toBe(true);
    expect(dProps.b).toBe(false);
    expect(dProps.c).toBe(c);
    expect(dProps.c()).toBe(0);
  });
});
