import { JsonValue } from '../json';
import {
  arrayType,
  booleanType,
  classType,
  floatType,
  integerType,
  nullable,
  optional,
  recordType,
  stringType,
  structType,
  tupleType,
} from './ctor';
import { plainFloatType, plainIntegerType, plainStringType } from './descriptors';
import { DeserializationError, unmarshal } from './unmarshal';

enum GreekLetters {
  ALPHA = 0,
  BETA,
  GAMMA,
}

class Vector2 {
  constructor(public x: number, public y: number = 0) {}
}

const vector2Descriptor = classType({
  name: 'Vector2',
  create: () => new Vector2(0, 0),
  clone: v => new Vector2(v.x, v.y),
  equal: (a, b) => a instanceof Vector2 && b instanceof Vector2 && a.x === b.x && a.y === b.y,
  properties: {
    x: { type: plainFloatType },
    y: { type: plainFloatType },
  },
});

const vector2CompactDescriptor = classType({
  name: 'Vector2',
  create: () => new Vector2(0, 0),
  clone: v => new Vector2(v.x, v.y),
  equal: (a, b) => a instanceof Vector2 && b instanceof Vector2 && a.x === b.x && a.y === b.y,
  properties: {
    x: { type: plainFloatType },
    y: { type: plainFloatType },
  },
  marshal: v => [v.x, v.y],
  unmarshal: (values: JsonValue) => {
    if (Array.isArray(values) && values.length === 2) {
      return new Vector2(...(values as [number, number]));
    }
    throw new DeserializationError(`Expected 2-tuple, got ${typeof values}`);
  },
});

describe('descriptors.unmarshal', () => {
  test('boolean', () => {
    const descriptor = booleanType();
    expect(unmarshal(descriptor, true)).toBe(true);
    expect(unmarshal(descriptor, false)).toBe(false);
    expect(() => unmarshal(descriptor, 1)).toThrow();
    expect(() => unmarshal(descriptor, undefined)).toThrow();
    expect(() => unmarshal(descriptor, null)).toThrow();
  });

  test('integer', () => {
    const descriptor = integerType();
    expect(unmarshal(descriptor, 1)).toBe(1);
    expect(() => unmarshal(descriptor, 'hello')).toThrow();
    expect(() => unmarshal(descriptor, undefined)).toThrow();
    expect(() => unmarshal(descriptor, null)).toThrow();
  });

  test('integer.options', () => {
    const descriptor = integerType({ minVal: 0, maxVal: 10 });
    expect(unmarshal(descriptor, 0)).toBe(0);
    expect(unmarshal(descriptor, 10)).toBe(10);
    expect(() => unmarshal(descriptor, -1)).toThrow();
    expect(() => unmarshal(descriptor, 11)).toThrow();
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
    expect(unmarshal(descriptor, GreekLetters.ALPHA)).toBe(GreekLetters.ALPHA);
  });

  test('float', () => {
    const descriptor = floatType();
    expect(unmarshal(descriptor, 1)).toBe(1);
    expect(() => unmarshal(descriptor, 'hello')).toThrow();
    expect(() => unmarshal(descriptor, undefined)).toThrow();
    expect(() => unmarshal(descriptor, null)).toThrow();
  });

  test('float.options', () => {
    const descriptor = floatType({ minVal: 5, maxVal: 10 });
    expect(unmarshal(descriptor, 5)).toBe(5);
    expect(unmarshal(descriptor, 10)).toBe(10);
    expect(() => unmarshal(descriptor, 4)).toThrow();
    expect(() => unmarshal(descriptor, 11)).toThrow();
  });

  test('string', () => {
    const descriptor = stringType();
    expect(unmarshal(descriptor, 'hello')).toBe('hello');
    expect(() => unmarshal(descriptor, 1)).toThrow();
    expect(() => unmarshal(descriptor, undefined)).toThrow();
    expect(() => unmarshal(descriptor, null)).toThrow();
  });

  test('string.options', () => {
    const descriptor = stringType({ maxLength: 5 });
    expect(unmarshal(descriptor, 'hello')).toBe('hello');
    expect(() => unmarshal(descriptor, 'hellox')).toThrow();
  });

  test('string.enum', () => {
    type AB = 'a' | 'b';
    const descriptor = stringType<AB>({ enumVals: ['a', 'b'] });
    expect(unmarshal(descriptor, 'a')).toBe('a');
    expect(() => unmarshal(descriptor, 'c')).toThrow();
  });

  test('optional', () => {
    const descriptor = optional(plainIntegerType);
    expect(unmarshal(descriptor, 1)).toBe(1);
    expect(unmarshal(descriptor, undefined)).toBeUndefined();
    expect(() => unmarshal(descriptor, null)).toThrow();
  });

  test('nullable', () => {
    const descriptor = nullable(plainIntegerType);
    expect(unmarshal(descriptor, 1)).toBe(1);
    expect(unmarshal(descriptor, null)).toBeNull();
    expect(() => unmarshal(descriptor, undefined)).toThrow();
  });

  test('array', () => {
    const descriptor = arrayType(plainIntegerType);
    expect(unmarshal(descriptor, [])).toEqual([]);
    expect(unmarshal(descriptor, [1])).toEqual([1]);
    expect(() => unmarshal(descriptor, 1)).toThrow();
    expect(() => unmarshal(descriptor, null)).toThrow();
    expect(() => unmarshal(descriptor, undefined)).toThrow();
    expect(() => unmarshal(descriptor, [false])).toThrow();
    expect(() => unmarshal(descriptor, [null])).toThrow();
    expect(() => unmarshal(descriptor, [undefined])).toThrow();
  });

  test('record', () => {
    const descriptor = recordType(plainIntegerType);
    expect(unmarshal(descriptor, {})).toEqual({});
    expect(unmarshal(descriptor, { n: 1 })).toEqual({ n: 1 });
    expect(() => unmarshal(descriptor, 1)).toThrow();
    expect(() => unmarshal(descriptor, null)).toThrow();
    expect(() => unmarshal(descriptor, undefined)).toThrow();
    expect(() => unmarshal(descriptor, [false])).toThrow();
    expect(() => unmarshal(descriptor, [null])).toThrow();
    expect(() => unmarshal(descriptor, [undefined])).toThrow();
  });

  test('tuple[2]', () => {
    const descriptor = tupleType([plainIntegerType, plainIntegerType]);
    expect(() => unmarshal(descriptor, 1)).toThrow();
    expect(() => unmarshal(descriptor, [1])).toThrow();
    expect(() => unmarshal(descriptor, [1, 1, 1])).toThrow();
    expect(() => unmarshal(descriptor, null)).toThrow();
    expect(() => unmarshal(descriptor, undefined)).toThrow();
  });

  test('tuple[3]', () => {
    const descriptor = tupleType([plainIntegerType, plainIntegerType, plainStringType]);
    expect(() => unmarshal(descriptor, 1)).toThrow();
    expect(() => unmarshal(descriptor, [1])).toThrow();
    expect(() => unmarshal(descriptor, [1, 1, 1])).toThrow();
    expect(() => unmarshal(descriptor, null)).toThrow();
    expect(() => unmarshal(descriptor, undefined)).toThrow();
  });

  test('struct', () => {
    const descriptor = structType({
      name: 'Test',
      properties: {
        id: { type: plainStringType },
        count: { type: plainIntegerType },
        selected: { type: optional(plainIntegerType) },
      },
    });
    expect(unmarshal(descriptor, { id: 'a', count: 1 })).toEqual({ id: 'a', count: 1 });
    expect(unmarshal(descriptor, { id: 'a', count: 1, selected: 2 })).toEqual({
      id: 'a',
      count: 1,
      selected: 2,
    });
  });

  test('class', () => {
    const v: Vector2 = unmarshal(vector2Descriptor, { x: 1, y: 2 });
    expect(v).toBeInstanceOf(Vector2);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(() => unmarshal(vector2Descriptor, undefined)).toThrow();
    expect(() => unmarshal(vector2Descriptor, { x: 1 })).toThrow();
  });

  test('class (custom marshalling function)', () => {
    const v: Vector2 = unmarshal(vector2CompactDescriptor, [1, 2]);
    expect(v).toBeInstanceOf(Vector2);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(() => unmarshal(vector2Descriptor, undefined)).toThrow();
    expect(() => unmarshal(vector2Descriptor, { x: 1 })).toThrow();
  });
});
