import { assignable } from './assignable';
import {
  arrayType,
  booleanType,
  floatType,
  integerType,
  nullable,
  opaqueType,
  optional,
  recordType,
  stringType,
  tupleType,
  unionType,
} from './ctor';

describe('descriptors.assignable', () => {
  test('boolean', () => {
    expect(assignable(booleanType(), booleanType())).toBe(true);

    expect(assignable(booleanType(), integerType())).toBe(false);
    expect(assignable(booleanType(), floatType())).toBe(false);
    expect(assignable(booleanType(), stringType())).toBe(false);
  });

  test('integer', () => {
    expect(assignable(integerType(), integerType())).toBe(true);

    expect(assignable(integerType(), booleanType())).toBe(false);
    expect(assignable(integerType(), floatType())).toBe(false);
    expect(assignable(integerType(), stringType())).toBe(false);

    expect(assignable(integerType({ minVal: 1 }), integerType())).toBe(false);
    expect(assignable(integerType(), integerType({ minVal: 1 }))).toBe(true);
    expect(assignable(integerType({ minVal: 1 }), integerType({ minVal: 2 }))).toBe(false);
    expect(assignable(integerType({ minVal: 1 }), integerType({ minVal: 1 }))).toBe(true);

    expect(assignable(integerType({ maxVal: 1 }), integerType())).toBe(false);
    expect(assignable(integerType(), integerType({ maxVal: 1 }))).toBe(true);
    expect(assignable(integerType({ maxVal: 1 }), integerType({ maxVal: 2 }))).toBe(false);
    expect(assignable(integerType({ maxVal: 1 }), integerType({ maxVal: 1 }))).toBe(true);
  });

  test('float', () => {
    expect(assignable(floatType(), floatType())).toBe(true);

    expect(assignable(floatType(), integerType())).toBe(true);
    expect(assignable(floatType(), booleanType())).toBe(false);
    expect(assignable(floatType(), stringType())).toBe(false);

    expect(assignable(floatType({ minVal: 1 }), floatType())).toBe(false);
    expect(assignable(floatType(), floatType({ minVal: 1 }))).toBe(true);
    expect(assignable(floatType({ minVal: 1 }), floatType({ minVal: 2 }))).toBe(false);
    expect(assignable(floatType({ minVal: 1 }), floatType({ minVal: 1 }))).toBe(true);

    expect(assignable(floatType({ maxVal: 1 }), floatType())).toBe(false);
    expect(assignable(floatType(), floatType({ maxVal: 1 }))).toBe(true);
    expect(assignable(floatType({ maxVal: 1 }), floatType({ maxVal: 2 }))).toBe(false);
    expect(assignable(floatType({ maxVal: 1 }), floatType({ maxVal: 1 }))).toBe(true);
  });

  test('string', () => {
    expect(assignable(stringType(), stringType())).toBe(true);

    expect(assignable(stringType(), booleanType())).toBe(false);
    expect(assignable(stringType(), floatType())).toBe(false);
    expect(assignable(stringType(), integerType())).toBe(false);

    expect(assignable(stringType({ maxLength: 1 }), stringType())).toBe(false);
    expect(assignable(stringType(), stringType({ maxLength: 1 }))).toBe(true);
    expect(assignable(stringType({ maxLength: 1 }), stringType({ maxLength: 2 }))).toBe(false);
    expect(assignable(stringType({ maxLength: 1 }), stringType({ maxLength: 1 }))).toBe(true);
  });

  test('optional', () => {
    expect(assignable(optional(stringType()), stringType())).toBe(true);
    expect(assignable(optional(stringType()), optional(stringType()))).toBe(true);
    expect(assignable(optional(stringType()), nullable(stringType()))).toBe(false);
    expect(assignable(optional(stringType()), integerType())).toBe(false);
    expect(assignable(optional(stringType()), optional(integerType()))).toBe(false);
  });

  test('nullable', () => {
    expect(assignable(nullable(stringType()), stringType())).toBe(true);
    expect(assignable(nullable(stringType()), nullable(stringType()))).toBe(true);
    expect(assignable(nullable(stringType()), optional(stringType()))).toBe(false);
    expect(assignable(nullable(stringType()), integerType())).toBe(false);
    expect(assignable(nullable(stringType()), nullable(integerType()))).toBe(false);
  });

  test('array', () => {
    expect(assignable(arrayType(stringType()), arrayType(stringType()))).toBe(true);
    expect(assignable(arrayType(stringType()), arrayType(integerType()))).toBe(false);
    expect(assignable(arrayType(stringType()), stringType())).toBe(false);
  });

  test('tuple', () => {
    expect(
      assignable(tupleType([stringType(), integerType()]), tupleType([stringType(), integerType()]))
    ).toBe(true);
    expect(
      assignable(tupleType([stringType(), integerType()]), tupleType([stringType(), stringType()]))
    ).toBe(false);
    expect(
      assignable(
        tupleType([stringType(), integerType(), integerType()]),
        tupleType([stringType(), integerType()])
      )
    ).toBe(false);
    expect(
      assignable(
        tupleType([stringType(), integerType()]),
        tupleType([stringType(), integerType(), integerType()])
      )
    ).toBe(false);
  });

  test('union', () => {
    expect(assignable(unionType([stringType(), integerType()]), stringType())).toBe(true);
    expect(assignable(unionType([stringType(), integerType()]), integerType())).toBe(true);
    expect(assignable(unionType([stringType(), integerType()]), booleanType())).toBe(false);
    expect(
      assignable(unionType([stringType(), integerType()]), unionType([stringType(), integerType()]))
    ).toBe(true);
    expect(
      assignable(unionType([stringType(), integerType()]), unionType([stringType(), booleanType()]))
    ).toBe(false);
    expect(
      assignable(
        unionType([stringType(), integerType(), booleanType()]),
        unionType([stringType(), booleanType()])
      )
    ).toBe(true);
    expect(
      assignable(
        unionType([stringType(), integerType()]),
        unionType([stringType(), integerType(), booleanType()])
      )
    ).toBe(false);
  });

  test('record', () => {
    expect(assignable(recordType(stringType()), recordType(stringType()))).toBe(true);
    expect(assignable(recordType(stringType()), recordType(integerType()))).toBe(false);
    expect(assignable(recordType(stringType()), stringType())).toBe(false);
  });

  // TODO: struct, class, custom - need shared test data

  test('opaque', () => {
    expect(assignable(opaqueType('X'), opaqueType('X'))).toBe(true);
    expect(assignable(opaqueType('X'), opaqueType('Y'))).toBe(false);
    expect(assignable(opaqueType('X'), opaqueType())).toBe(false);
    expect(assignable(opaqueType(), opaqueType('Y'))).toBe(false);
    expect(assignable(opaqueType(), opaqueType())).toBe(false);
  });
});
