import {
  DescribesType,
  IArrayTypeDescriptor,
  IBooleanTypeDescriptor,
  IFloatTypeDescriptor,
  IIntegerTypeDescriptor,
  INullableTypeDescriptor,
  IOptionalTypeDescriptor,
  IRecordTypeDescriptor,
  IStringTypeDescriptor,
  ITupleTypeDescriptor,
  IUnionTypeDescriptor,
  plainBooleanType,
  plainFloatType,
  plainIntegerType,
  plainStringType,
} from './descriptors';

// Note: This is mostly compilation tests - to make sure types are inferring the way we want.
describe('descriptors.type', () => {
  test('boolean', () => {
    const descriptor: IBooleanTypeDescriptor = { kind: 'boolean' };
    const a: DescribesType<typeof descriptor> = true;
    expect(a).toBe(true);
    const b: DescribesType<typeof plainBooleanType> = true;
    expect(b).toBe(true);
  });

  test('integer', () => {
    const descriptor: IIntegerTypeDescriptor = { kind: 'integer' };
    const a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    const b: DescribesType<typeof plainIntegerType> = 1;
    expect(b).toBe(1);
  });

  test('float', () => {
    const descriptor: IFloatTypeDescriptor = { kind: 'float' };
    const a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    const b: DescribesType<typeof plainFloatType> = 1;
    expect(b).toBe(1);
  });

  test('string', () => {
    const descriptor: IStringTypeDescriptor = { kind: 'string' };
    const a: DescribesType<typeof descriptor> = 'hello';
    expect(a).toBe('hello');
  });

  test('string.subtype', () => {
    type AB = 'a' | 'b';
    const descriptor3: IStringTypeDescriptor<AB> = { kind: 'string' };
    const b: DescribesType<typeof descriptor3> = 'a';
    const c: AB = b;
    expect(b).toBe('a');
    expect(c).toBe(b);
  });

  test('optional', () => {
    const descriptor: IOptionalTypeDescriptor<number> = {
      kind: 'optional',
      element: plainIntegerType,
    };
    let a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    a = undefined;
    expect(a).toBeUndefined();
  });

  test('nullable', () => {
    const descriptor: INullableTypeDescriptor<number> = {
      kind: 'nullable',
      element: plainIntegerType,
    };
    let a: DescribesType<typeof descriptor> = 1;
    expect(a).toBe(1);
    a = null;
    expect(a).toBeNull();
  });

  test('array', () => {
    const descriptor: IArrayTypeDescriptor<number> = {
      kind: 'array',
      element: plainIntegerType,
    };
    const a: DescribesType<typeof descriptor> = [1];
    expect(a).toEqual([1]);
  });

  test('tuple', () => {
    const descriptor: ITupleTypeDescriptor<[number, string]> = {
      kind: 'tuple',
      elements: [plainIntegerType, plainStringType],
    };
    const a: DescribesType<typeof descriptor> = [1, 'a'];
    expect(a).toEqual([1, 'a']);
  });

  test('union', () => {
    const descriptor: IUnionTypeDescriptor<[number, string]> = {
      kind: 'union',
      elements: [plainIntegerType, plainStringType],
    };
    const a: DescribesType<typeof descriptor> = 1;
    const b: DescribesType<typeof descriptor> = 'a';
    expect(a).toEqual(1);
    expect(b).toEqual('a');
  });

  test('record', () => {
    const descriptor: IRecordTypeDescriptor<number> = {
      kind: 'record',
      element: plainIntegerType,
    };
    const a: DescribesType<typeof descriptor> = { name: 1 };
    expect(a).toEqual({ name: 1 });
  });

  // | 'struct'
  // | 'class'
  // | 'opaque'
  // | 'custom'; // Allows extending to other types.
});
