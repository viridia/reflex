import type { JsonObject, JsonValue } from '../json';
import type { IFieldDescriptor } from './field';

/** Kinds of types representable in this type system. */
export type TypeKind =
  | 'boolean'
  | 'integer'
  | 'float'
  | 'string'
  | 'optional'
  | 'nullable'
  | 'union'
  | 'array'
  | 'tuple'
  | 'record'
  | 'struct'
  | 'class'
  | 'opaque'
  | 'dynamic'
  | 'custom'; // Allows extending to other types.

// Potential future types:
// | 'range'

export interface ICustomTypeOptions {
  [key: string]: string | number | boolean;
}

/** Base of all type descriptors */
export interface ITypeDescriptor<T> {
  readonly kind: TypeKind;
  readonly custom?: ICustomTypeOptions;
  readonly __dummy?: T;
}

/** Boolean type. */
export interface IBooleanTypeDescriptor extends ITypeDescriptor<boolean> {
  kind: 'boolean';
}

/** For integers that represent an enumerated set of choices. */
export interface IntegerEnumValues<T extends number> {
  [key: string]: T;
}

/** Integer types. */
export interface IIntegerTypeDescriptor<T extends number = number> extends ITypeDescriptor<T> {
  kind: 'integer';
  minVal?: number;
  maxVal?: number;
  enumVals?: IntegerEnumValues<T> | (() => IntegerEnumValues<T>);
}

/** Floating-point types. */
export interface IFloatTypeDescriptor extends ITypeDescriptor<number> {
  kind: 'float';
  minVal?: number;
  maxVal?: number;
  increment?: number;
  precision?: number;
}

/** String types. */
export interface IStringTypeDescriptor<T extends string = string> extends ITypeDescriptor<T> {
  kind: 'string';
  maxLength?: number;
  enumVals?: T[] | (() => T[]);
  validate?: (str: T) => T | null;
}

/** Optional type. */
export interface IOptionalTypeDescriptor<T> extends ITypeDescriptor<T | undefined> {
  kind: 'optional';
  element: ITypeDescriptor<T>;
}

/** Nullable type. */
export interface INullableTypeDescriptor<T> extends ITypeDescriptor<T | null> {
  kind: 'nullable';
  element: ITypeDescriptor<T>;
}

/** Array type. */
export interface IArrayTypeDescriptor<T> extends ITypeDescriptor<T[]> {
  kind: 'array';
  element: ITypeDescriptor<T>;
  // maxLength?: number,
  mutable?: boolean;
}

/** Tuple type. */
export interface ITupleTypeDescriptor<T extends any[]> extends ITypeDescriptor<T> {
  kind: 'tuple';
  elements: ITypeDescriptor<unknown>[];
  mutable?: boolean;
}

/** Union type. */
export interface IUnionTypeDescriptor<T extends any[], U = never>
  extends ITypeDescriptor<T[number] | U> {
  kind: 'union';
  elements: ITypeDescriptor<unknown>[];
  /** Function to test the union value and determine what descriptor - optional */
  typeTest?: (value: unknown) => ITypeDescriptor<unknown> | undefined;
}

/** Record - an object with string keys and consistent value types. */
export interface IRecordTypeDescriptor<T> extends ITypeDescriptor<Record<string, T>> {
  kind: 'record';
  element: ITypeDescriptor<T>;
  mutable?: boolean;
}

/** Field definitions for a struct type. */
export type IPropertyDescriptors<T extends {}> = {
  [name in keyof T]?: IFieldDescriptor<T[name]>;
};

/** A named type. */
export interface INamedTypeDescriptor<T extends object> extends ITypeDescriptor<T> {
  name: string;
}

/** A struct type. */
export interface IStructTypeDescriptor<T extends object, Ser = JsonObject>
  extends ITypeDescriptor<T> {
  kind: 'struct';
  name: string;
  properties: IPropertyDescriptors<T>;
  additionalPropertes?: boolean; // Whether extra properties are allowed.

  // If these methods are not provided, marshalling is handled similarly to structs.
  marshal?: (value: T) => Ser;
  unmarshal?: (ser: Ser) => T;
}

/** Object represents a class type - meaning that it has a prototype. This can only
    be instantiated by a factory function which must be provided in the type descriptor.
    It can, however, be edited using a standard property editor.
 */
export interface IClassTypeDescriptor<Cls extends object> extends ITypeDescriptor<Cls> {
  kind: 'class';
  name: string;
  properties: IPropertyDescriptors<Cls>;
  additionalPropertes?: boolean; // Whether extra properties are allowed - default true.
  supertypes?: IClassTypeDescriptor<object>[];
  clone?: <T extends Cls>(obj: T) => Cls;
  create?: () => Cls;
  equal?: <T extends Cls>(a: T, b: T) => boolean; // Defaults to reference equality.
  validate?: <T extends Cls>(a: T) => boolean;
  // isInstance: (obj: Cls) => boolean;

  // If these methods are not provided, marshaling is handled via reflection.
  marshal?: <T extends Cls>(value: T) => JsonValue;
  unmarshal?: (ser: JsonValue) => Cls;
}

/** Custom primitive type - an app-specific type which is known by name. Editing requires
    the app to supply an editor component.
 */
export interface ICustomTypeDescriptor<T> extends ITypeDescriptor<T> {
  kind: 'custom';
  name: string;
  clone: (value: T) => T;
  create: (name?: string) => T;
  equal: (a: T | undefined | null, b: T | undefined | null) => boolean;
  validate?: (a: T) => boolean;
  marshal?: (value: T) => JsonValue;
  unmarshal?: (ser: JsonValue) => T;
}

/** Opaque type - a type that is not serializable or introspectable. Not intended to be
    editable. Used for keeping internal state that is observable.

    Opaque types are often used when we want to have an observable that doesn't
    need reflection support - observables require a type descriptor, but it won't be used
    in that case.
 */
export interface IOpaqueTypeDescriptor<T> extends ITypeDescriptor<T> {
  kind: 'opaque';
  name?: string;
  supertypes?: IOpaqueTypeDescriptor<unknown>[];
}

/** Compact form of type descriptor for encoding, has no methods. */
export interface ICompactTypeDescriptor {
  kind: TypeKind;
  name?: string;
  element?: ICompactTypeDescriptor;
  elements?: ICompactTypeDescriptor[];
  minVal?: number;
  maxVal?: number;
  increment?: number;
  precision?: number;
  maxLength?: number;
}

export type DescribesType<T> = T extends IOptionalTypeDescriptor<infer R>
  ? R | undefined
  : T extends ITypeDescriptor<infer R>
  ? R
  : never;

// Static instances of plain types
export const plainBooleanType: IBooleanTypeDescriptor = { kind: 'boolean' };
export const plainIntegerType: IIntegerTypeDescriptor = { kind: 'integer' };
export const plainFloatType: IFloatTypeDescriptor = { kind: 'float' };
export const plainStringType: IStringTypeDescriptor = { kind: 'string' };
export const dynamicType: ITypeDescriptor<unknown> = { kind: 'dynamic' };

export function formatDescriptor(desc: ITypeDescriptor<unknown>): string {
  if (!desc) {
    return `<invalid-descriptor: ${desc}>`;
  }
  switch (desc.kind) {
    case 'boolean':
    case 'integer':
    case 'float':
    case 'string':
      return desc.kind;
    case 'optional':
      return `optional(${formatDescriptor((desc as IOptionalTypeDescriptor<unknown>).element)})`;
    case 'nullable':
      return `nullable(${formatDescriptor((desc as INullableTypeDescriptor<unknown>).element)})`;
    case 'array':
      return `${formatDescriptor((desc as IArrayTypeDescriptor<unknown>).element)}[]`;
    case 'tuple':
      return `[${(desc as ITupleTypeDescriptor<unknown[]>).elements
        .map(formatDescriptor)
        .join(', ')}]`;
    case 'union':
      return `(${(desc as IUnionTypeDescriptor<unknown[]>).elements
        .map(formatDescriptor)
        .join(' | ')})`;
    case 'record':
      return `Record<${formatDescriptor((desc as IRecordTypeDescriptor<unknown>).element)}>`;
    case 'struct':
      return (desc as IStructTypeDescriptor<{}>).name;
    case 'class':
      return (desc as IClassTypeDescriptor<object>).name;
    case 'custom':
      return (desc as ICustomTypeDescriptor<unknown>).name;
    case 'opaque':
      return (desc as IOpaqueTypeDescriptor<unknown>).name || 'opaque';
    case 'dynamic':
      return 'dynamic';
    default:
      return `<invalid-type: ${desc.kind}>`;
  }
}

/** Get the names of all properties for a struct or class descriptor for type T, and cast them to
    `keyof T`.
 */
export function propertyNames<T extends object>(
  descriptor: IStructTypeDescriptor<T> | IClassTypeDescriptor<T>
) {
  return Object.keys(descriptor.properties) as Array<keyof T>;
}
