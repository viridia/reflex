import {
  IArrayTypeDescriptor,
  ICompactTypeDescriptor,
  INullableTypeDescriptor,
  IOptionalTypeDescriptor,
  IRecordTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';
import { registry } from './registry';
import { DeserializationError } from './unmarshal';

/** Transform type descriptor from a serializable form. Type names are converted back into
    references to the complete type definition.

    This is different from unmarshal, in that it deserializes the descriptor, not the value.
 */
export function decode(desc: ICompactTypeDescriptor): ITypeDescriptor<unknown> {
  if (!desc) {
    throw new DeserializationError('Invalid type descriptor');
  }

  switch (desc.kind) {
    case 'boolean':
    case 'integer':
    case 'float':
    case 'string':
      return desc;

    case 'optional':
      return {
        kind: 'optional',
        element: decode(desc.element!),
      } as IOptionalTypeDescriptor<unknown>;

    case 'nullable':
      return {
        kind: 'nullable',
        element: decode(desc.element!),
      } as INullableTypeDescriptor<unknown>;

    case 'array': {
      const { element, kind, ...rest } = desc;
      return {
        ...rest,
        kind,
        element: decode(element!),
      } as IArrayTypeDescriptor<unknown>;
    }

    case 'tuple': {
      const { elements, kind, ...rest } = desc;
      if (!Array.isArray(elements)) {
        throw new DeserializationError('Invalid tuple type params.');
      }
      return {
        ...rest,
        kind,
        elements: elements!.map(decode),
      } as ITupleTypeDescriptor<unknown[]>;
    }

    case 'union': {
      const { elements, kind, ...rest } = desc;
      if (!Array.isArray(elements)) {
        throw new DeserializationError('Invalid union type params.');
      }
      return {
        ...rest,
        kind,
        elements: elements!.map(decode),
      } as IUnionTypeDescriptor<unknown[]>;
    }

    case 'record': {
      const { element, kind, ...rest } = desc;
      return {
        ...rest,
        kind,
        element: decode(element!),
      } as IRecordTypeDescriptor<unknown>;
    }

    case 'struct': {
      const d = desc;
      if (!d.name) {
        throw new DeserializationError('Struct type descriptor requires name to be serialized.');
      }
      const result = registry.find('struct', d.name);
      if (!result) {
        throw new DeserializationError(`Unknown struct type ${d.name}.`);
      }
      return result;
    }

    case 'class': {
      const d = desc;
      if (!d.name) {
        throw new DeserializationError('Class type descriptor requires name to be serialized.');
      }
      const result = registry.find('class', d.name);
      if (!result) {
        throw new DeserializationError(`Unknown class type ${d.name}.`);
      }
      return result;
    }

    case 'opaque': {
      const d = desc;
      if (!d.name) {
        throw new DeserializationError('Opaque type descriptor requires name to be serialized.');
      }
      const result = registry.find('opaque', d.name);
      if (!result) {
        throw new DeserializationError(`Unknown opaque type ${d.name}.`);
      }
      return result;
    }

    case 'custom': {
      const d = desc;
      if (!d.name) {
        throw new DeserializationError('Custom type descriptor requires name to be serialized.');
      }
      const result = registry.find('custom', d.name);
      if (!result) {
        throw new DeserializationError(`Unknown custom type ${d.name}.`);
      }
      return result;
    }

    default:
      throw new DeserializationError(`Unknown type kind: ${desc.kind}`);
  }
}
