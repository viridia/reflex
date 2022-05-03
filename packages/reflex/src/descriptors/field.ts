import { nullableType, optionalType } from './ctor';
import {
  ITypeDescriptor,
  plainBooleanType,
  plainFloatType,
  plainIntegerType,
  plainStringType,
} from './descriptors';

/** Options for a field. */
export interface IFieldOptions<T> {
  /** If not writable, then shown as read-only in field editor. Defaults to true. */
  writable?: boolean;

  /** If not enumerable, then will not be shown in field editor, and will not be serialized.
      Defaults to true. */
  enumerable?: boolean;

  /** If true, will not be shown in the editor but will be serialized. */
  hidden?: boolean;

  /** Used when one field contains information needed to edit another field within the same
      object. The consuming field can access the providing field by it's ref name. */
  ref?: string;

  /** Default value for this field. */
  default?: T;
}

/** A field descriptor */
export interface IFieldDescriptor<T> extends IFieldOptions<T> {
  type: ITypeDescriptor<T>;
}

export function field<T>(
  type: ITypeDescriptor<T>,
  options?: IFieldOptions<T>
): IFieldDescriptor<T> {
  return { type, writable: true, enumerable: true, ...options };
}

// Common field definitions
export const booleanField = field(plainBooleanType);
export const integerField = field(plainIntegerType);
export const floatField = field(plainFloatType);
export const stringField = field(plainStringType);

export function optionalField<T>(
  type: ITypeDescriptor<T>,
  options?: IFieldOptions<T>
): IFieldDescriptor<T | undefined> {
  return field(optionalType(type), options);
}

export function nullableField<T>(
  type: ITypeDescriptor<T>,
  options?: IFieldOptions<T>
): IFieldDescriptor<T | null> {
  return field(nullableType(type), options);
}
