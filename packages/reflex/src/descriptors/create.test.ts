import { create } from './create';
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
import { plainIntegerType, plainStringType } from './descriptors';

// Note: This is largely compilation tests - to make sure types are inferring the way we want.
describe('descriptors.create', () => {
  test('boolean', () => {
    expect(create(booleanType())).toBe(false);
  });

  test('integer', () => {
    expect(create(integerType())).toBe(0);
    expect(create(integerType({ minVal: 2 }))).toBe(2);
  });

  test('float', () => {
    expect(create(floatType())).toBe(0);
    expect(create(floatType({ minVal: 2 }))).toBe(2);
  });

  test('string', () => {
    expect(create(stringType())).toBe('');
  });

  test('optional', () => {
    expect(create(optional(plainIntegerType))).toBe(0);
  });

  test('nullable', () => {
    expect(create(nullable(plainIntegerType))).toBe(0);
  });

  test('array', () => {
    expect(create(arrayType(plainIntegerType))).toEqual([]);
  });

  test('tuple', () => {
    expect(create(tupleType([plainIntegerType, plainIntegerType]))).toEqual([0, 0]);
    expect(create(tupleType([plainIntegerType, plainIntegerType, plainStringType]))).toEqual([
      0,
      0,
      '',
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
    expect(create(descriptor)).toEqual({ count: 0, id: '' });
  });
});
