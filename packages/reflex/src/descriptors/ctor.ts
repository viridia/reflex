/** Type constructor functions. */
import type { JsonObject } from '../json';
import type {
  IArrayTypeDescriptor,
  IBooleanTypeDescriptor,
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  IFloatTypeDescriptor,
  IIntegerTypeDescriptor,
  INullableTypeDescriptor,
  IOpaqueTypeDescriptor,
  IOptionalTypeDescriptor,
  IRecordTypeDescriptor,
  IStringTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  IUnionTypeDescriptor,
  ITypeDescriptor,
} from './descriptors';

/** Boolean type. */
export function booleanType(): IBooleanTypeDescriptor {
  return { kind: 'boolean' };
}

/** Integer types. */
export function integerType<T extends number>(
  options?: Omit<IIntegerTypeDescriptor<T>, 'kind'>
): IIntegerTypeDescriptor<T> {
  return { kind: 'integer', ...options };
}

/** Floating-point types. */
export function floatType(options?: Omit<IFloatTypeDescriptor, 'kind'>): IFloatTypeDescriptor {
  return { kind: 'float', ...options };
}

/** String types. */
export function stringType<T extends string>(
  options?: Omit<IStringTypeDescriptor<T>, 'kind'>
): IStringTypeDescriptor<T> {
  return { kind: 'string', ...options };
}

/** Optional type modifier. */
export function optionalType<T, K = NonNullable<T>>(
  element: ITypeDescriptor<K>,
  options?: Omit<IOptionalTypeDescriptor<K>, 'kind' | 'element'>
): IOptionalTypeDescriptor<K> {
  return { kind: 'optional', element, ...options };
}
export const optional = optionalType;

/** Nullable type modifier. */
export function nullableType<T, K = NonNullable<T>>(
  element: ITypeDescriptor<K>,
  options?: Omit<INullableTypeDescriptor<K>, 'kind' | 'element'>
): INullableTypeDescriptor<K> {
  return { kind: 'nullable', element, ...options };
}
export const nullable = nullableType;

/** Array type. */
export function arrayType<T>(
  element: ITypeDescriptor<T>,
  options?: Omit<IArrayTypeDescriptor<T>, 'kind' | 'element'>
): IArrayTypeDescriptor<T> {
  return { kind: 'array', element, ...options };
}

/** Tuple type. */
export function tupleType<T1, T2>(
  elements: [ITypeDescriptor<T1>, ITypeDescriptor<T2>],
  options?: Omit<ITupleTypeDescriptor<[T1, T2]>, 'kind' | 'elements'>
): ITupleTypeDescriptor<[T1, T2]>;

export function tupleType<T1, T2, T3>(
  elements: [ITypeDescriptor<T1>, ITypeDescriptor<T2>, ITypeDescriptor<T3>],
  options?: Omit<ITupleTypeDescriptor<[T1, T2, T3]>, 'kind' | 'elements'>
): ITupleTypeDescriptor<[T1, T2, T3]>;

export function tupleType<T1, T2, T3, T4>(
  elements: [ITypeDescriptor<T1>, ITypeDescriptor<T2>, ITypeDescriptor<T3>, ITypeDescriptor<T4>],
  options?: Omit<ITupleTypeDescriptor<[T1, T2, T3, T4]>, 'kind' | 'elements'>
): ITupleTypeDescriptor<[T1, T2, T3, T4]>;

export function tupleType<T extends any[]>(
  elements: ITypeDescriptor<any>[],
  options?: Omit<ITupleTypeDescriptor<T>, 'kind' | 'elements'>
): ITupleTypeDescriptor<T> {
  return { kind: 'tuple', elements, ...options };
}

/** Union type. */
export function unionType<T1, T2>(
  elements: [ITypeDescriptor<T1>, ITypeDescriptor<T2>],
  options?: Omit<IUnionTypeDescriptor<[T1, T2]>, 'kind' | 'elements'>
): IUnionTypeDescriptor<[T1, T2]>;

export function unionType<T1, T2, T3>(
  elements: [ITypeDescriptor<T1>, ITypeDescriptor<T2>, ITypeDescriptor<T3>],
  options?: Omit<IUnionTypeDescriptor<[T1, T2, T3]>, 'kind' | 'elements'>
): IUnionTypeDescriptor<[T1, T2, T3]>;

export function unionType<T1, T2, T3, T4>(
  elements: [ITypeDescriptor<T1>, ITypeDescriptor<T2>, ITypeDescriptor<T3>, ITypeDescriptor<T4>],
  options?: Omit<IUnionTypeDescriptor<[T1, T2, T3, T4]>, 'kind' | 'elements'>
): IUnionTypeDescriptor<[T1, T2, T3, T4]>;

export function unionType<T extends any[]>(
  elements: ITypeDescriptor<any>[],
  options?: Omit<IUnionTypeDescriptor<T>, 'kind' | 'elements'>
): IUnionTypeDescriptor<T> {
  return { kind: 'union', elements, ...options };
}

/** Record type. */
export function recordType<T>(
  element: ITypeDescriptor<T>,
  options?: Omit<IRecordTypeDescriptor<T>, 'kind' | 'element'>
): IRecordTypeDescriptor<T> {
  return { kind: 'record', element, ...options };
}

/** Struct type. */
export function structType<T extends object, Ser = JsonObject>(
  options: Omit<IStructTypeDescriptor<T, Ser>, 'kind'>
): IStructTypeDescriptor<T, Ser> {
  return { kind: 'struct', ...options };
}

/** Class type. A class is similar to a struct, but allows for more control over creation,
    cloning, and serialization format.
 */
export function classType<T extends object>(
  options: Omit<IClassTypeDescriptor<T>, 'kind'>
): IClassTypeDescriptor<T> {
  return { kind: 'class', ...options };
}

/** Custom type allows app-specific type extensions. */
export function customType<T>(
  options: Omit<ICustomTypeDescriptor<T>, 'kind'>
): ICustomTypeDescriptor<T> {
  return { kind: 'custom', ...options };
}

/** Type which cannot be introspected or serialized - used for internal observables. */
export function opaqueType<T>(
  name?: string,
  options?: Omit<IOpaqueTypeDescriptor<T>, 'kind'>
): IOpaqueTypeDescriptor<T> {
  return { kind: 'opaque', name, ...options };
}
