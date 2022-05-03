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
import { marshal, SerializationError } from './marshal';

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
    throw new SerializationError(`Expected 2-tuple, got ${typeof values}`);
  },
});

describe('descriptors.marshal', () => {
  test('boolean', () => {
    const descriptor = booleanType();
    expect(marshal(descriptor, true)).toBe(true);
    expect(marshal(descriptor, false)).toBe(false);
  });

  test('integer', () => {
    const descriptor = integerType();
    expect(marshal(descriptor, 1)).toBe(1);
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
    expect(marshal(descriptor, GreekLetters.ALPHA)).toBe(GreekLetters.ALPHA);
  });

  test('float', () => {
    const descriptor = floatType();
    expect(marshal(descriptor, 1)).toBe(1);
  });

  test('string', () => {
    const descriptor = stringType();
    expect(marshal(descriptor, 'hello')).toBe('hello');
  });

  test('optional', () => {
    const descriptor = optional(plainIntegerType);
    expect(marshal(descriptor, 1)).toBe(1);
    expect(marshal(descriptor, undefined)).toBeUndefined();
  });

  test('nullable', () => {
    const descriptor = nullable(plainIntegerType);
    expect(marshal(descriptor, 1)).toBe(1);
    expect(marshal(descriptor, null)).toBeNull();
  });

  test('array', () => {
    const descriptor = arrayType(plainIntegerType);
    expect(marshal(descriptor, [])).toEqual([]);
    expect(marshal(descriptor, [1])).toEqual([1]);
  });

  test('tuple[2]', () => {
    const descriptor = tupleType([plainIntegerType, plainIntegerType]);
    expect(marshal(descriptor, [1, 1])).toEqual([1, 1]);
    expect(marshal(descriptor, [1, 1])).toEqual([1, 1]);
  });

  test('tuple[3]', () => {
    const descriptor = tupleType([plainIntegerType, plainIntegerType, plainStringType]);
    expect(marshal(descriptor, [1, 1, 'a'])).toEqual([1, 1, 'a']);
    expect(marshal(descriptor, [1, 1, 'a'])).toEqual([1, 1, 'a']);
  });

  test('record', () => {
    const descriptor = recordType(plainStringType);
    expect(marshal(descriptor, { id: 'a', count: 'a' })).toEqual({ id: 'a', count: 'a' });
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
    expect(marshal(descriptor, { id: 'a', count: 1 })).toEqual({ id: 'a', count: 1 });
    expect(marshal(descriptor, { id: 'a', count: 1, selected: 2 })).toEqual({
      id: 'a',
      count: 1,
      selected: 2,
    });
  });

  test('class', () => {
    const v = new Vector2(1, 1);
    expect(marshal(vector2Descriptor, v)).toEqual({ x: 1, y: 1 });
  });

  test('class (custom marshalling function)', () => {
    const v = new Vector2(1, 1);
    expect(marshal(vector2CompactDescriptor, v)).toEqual([1, 1]);
  });
});
