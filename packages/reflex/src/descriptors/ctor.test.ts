import {
  arrayType,
  booleanType,
  floatType,
  integerType,
  nullable,
  optional,
  stringType,
  structType,
  tupleType,
} from './ctor';
import { DescribesType, plainIntegerType, plainStringType } from './descriptors';

enum GreekLetters {
  ALPHA = 0,
  BETA,
  GAMMA,
}

// Note: This is largely compilation tests - to make sure types are inferring the way we want.
describe('descriptors.ctor', () => {
  test('boolean', () => {
    const descriptor = booleanType();
    let a: DescribesType<typeof descriptor> = true;
    expect(a).toBe(true);
    a = false;
    expect(a).toBe(false);
  });

  test('integer', () => {
    const descriptor = integerType();
    expect(descriptor.minVal).toBeUndefined();
    expect(descriptor.maxVal).toBeUndefined();
    let a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    a = 2;
    expect(a).toBe(2);
  });

  test('integer.options', () => {
    const descriptor = integerType({ minVal: 0, maxVal: 10 });
    expect(descriptor.minVal).toBe(0);
    expect(descriptor.maxVal).toBe(10);
    let a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    a = 2;
    expect(a).toBe(2);

    const descriptor2 = integerType({ minVal: 1 });
    expect(descriptor2.minVal).toBe(1);
    expect(descriptor2.maxVal).toBeUndefined();
  });

  test('integer.enum', () => {
    const descriptor = integerType<GreekLetters>({
      minVal: GreekLetters.ALPHA,
      maxVal: GreekLetters.BETA,
      enumVals: {
        ALPHA: GreekLetters.ALPHA,
        BETA: GreekLetters.BETA,
        GAMMA: GreekLetters.GAMMA,
      },
    });
    expect(descriptor.minVal).toBe(0);
    expect(descriptor.maxVal).toBe(1);
    let a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    a = 2;
    expect(a).toBe(2);
  });

  test('float', () => {
    const descriptor = floatType();
    expect(descriptor.minVal).toBeUndefined();
    let a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    a = 2;
    expect(a).toBe(2);
  });

  test('float.options', () => {
    const descriptor = floatType({ minVal: 5, maxVal: 10 });
    expect(descriptor.minVal).toBe(5);
    expect(descriptor.maxVal).toBe(10);
  });

  test('string', () => {
    const descriptor = stringType();
    expect(descriptor.maxLength).toBeUndefined();
    expect(descriptor.enumVals).toBeUndefined();
    expect(descriptor.validate).toBeUndefined();
    let a: DescribesType<typeof descriptor> = 'hello';
    expect(a).toBe('hello');
    a = 'goodbye';
    expect(a).toBe('goodbye');
  });

  test('string.options', () => {
    const descriptor = stringType({ maxLength: 10 });
    expect(descriptor.maxLength).toBe(10);
  });

  test('string.subtype', () => {
    type AB = 'a' | 'b';
    const descriptor = stringType<AB>();
    let b: DescribesType<typeof descriptor> = 'a';
    expect(b).toBe('a');
    b = 'b';
    expect(b).toBe('b');
    const c: AB = b;
    expect(c).toBe('b');
  });

  test('string.enum', () => {
    type AB = 'a' | 'b';
    const descriptor = stringType<AB>({ enumVals: ['a', 'b'] });
    expect(descriptor.enumVals).toEqual(['a', 'b']);
  });

  test('optional', () => {
    const descriptor = optional(plainIntegerType);
    let a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    a = undefined;
    a = 1;
    const c: number = a;
    expect(c).toBe(1);
  });

  test('nullable', () => {
    const descriptor = nullable(plainIntegerType);
    let a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    a = null;
    expect(a).toBeNull();
  });

  test('array', () => {
    const descriptor = arrayType(plainIntegerType);
    const a: DescribesType<typeof descriptor> = [1];
    expect(a).toEqual([1]);
  });

  test('tuple[2]', () => {
    const descriptor = tupleType([plainIntegerType, plainIntegerType]);
    const a: DescribesType<typeof descriptor> = [1, 1];
    expect(a).toEqual([1, 1]);
  });

  test('tuple[3]', () => {
    const descriptor = tupleType([plainIntegerType, plainIntegerType, plainStringType]);
    const a: DescribesType<typeof descriptor> = [1, 1, 'a'];
    expect(a).toEqual([1, 1, 'a']);
  });

  test('tuple[3]', () => {
    const descriptor = tupleType([nullable(plainIntegerType), plainIntegerType, plainStringType]);
    const a: DescribesType<typeof descriptor> = [1, 1, 'a'];
    expect(a).toEqual([1, 1, 'a']);
  });

  test('array of tuple', () => {
    const descriptor = arrayType(tupleType([plainIntegerType, plainStringType]));
    const a: DescribesType<typeof descriptor> = [
      [1, 'a'],
      [1, 'b'],
    ];
    expect(a).toEqual([
      [1, 'a'],
      [1, 'b'],
    ]);
  });

  test('tuple of array', () => {
    const descriptor = tupleType([arrayType(plainIntegerType), arrayType(plainStringType)]);
    const a: DescribesType<typeof descriptor> = [
      [1, 1],
      ['b', 'b'],
    ];
    expect(a).toEqual([
      [1, 1],
      ['b', 'b'],
    ]);
  });

  test('struct', () => {
    const descriptor = structType({
      name: 'Test',
      properties: {
        id: { type: plainStringType },
        count: { type: plainIntegerType },
      },
    });
    const a: DescribesType<typeof descriptor> = { id: 'a', count: 1 };
    expect(a).toEqual({ id: 'a', count: 1 });
  });
});
