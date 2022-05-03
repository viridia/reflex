import {
  formatDescriptor,
  IArrayTypeDescriptor,
  IClassTypeDescriptor,
  ICompactTypeDescriptor,
  ICustomTypeDescriptor,
  INullableTypeDescriptor,
  IOpaqueTypeDescriptor,
  IOptionalTypeDescriptor,
  IRecordTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';
import { SerializationError } from './marshal';
import { registry } from './registry';

/** Transform type descriptor into a serializable form. This means recursively replacing
    complex type schemas with simple registered names.

    This is different from marshal, in that it serializes the descriptor, not the value.
 */
export function encode(desc: ITypeDescriptor<unknown>): ICompactTypeDescriptor {
  switch (desc.kind) {
    case 'boolean':
    case 'integer':
    case 'float':
    case 'string':
      return desc;

    case 'optional':
      return {
        kind: 'optional',
        element: encode((desc as IOptionalTypeDescriptor<unknown>).element),
      };

    case 'nullable':
      return {
        kind: 'nullable',
        element: encode((desc as INullableTypeDescriptor<unknown>).element),
      };

    case 'array': {
      const { element, kind, ...rest } = desc as IArrayTypeDescriptor<unknown>;
      return {
        ...rest,
        kind,
        element: encode(element),
      };
    }

    case 'tuple': {
      const { elements, kind, ...rest } = desc as ITupleTypeDescriptor<unknown[]>;
      return {
        ...rest,
        kind,
        elements: elements.map(encode),
      };
    }

    case 'union': {
      const { elements, kind, ...rest } = desc as IUnionTypeDescriptor<unknown[]>;
      return {
        ...rest,
        kind,
        elements: elements.map(encode),
      };
    }

    case 'record': {
      const { element, kind, ...rest } = desc as IRecordTypeDescriptor<unknown>;
      return {
        ...rest,
        kind,
        element: encode(element),
      };
    }

    case 'struct': {
      const d = desc as IStructTypeDescriptor<{}>;
      if (!d.name) {
        throw new SerializationError('Struct type descriptor requires name to be encoded.');
      }
      if (!registry.find('struct', d.name)) {
        throw new SerializationError(`Struct type ${d.name} is not registered.`);
      }
      return {
        kind: 'struct',
        name: d.name,
      };
    }

    case 'class': {
      const d = desc as IClassTypeDescriptor<object>;
      if (!d.name) {
        throw new SerializationError('Class type descriptor requires name to be encoded.');
      }
      if (!registry.find('class', d.name)) {
        throw new SerializationError(`Class type ${d.name} is not registered.`);
      }
      return {
        kind: 'class',
        name: d.name,
      };
    }

    case 'opaque': {
      const d = desc as IOpaqueTypeDescriptor<unknown>;
      if (!d.name) {
        throw new SerializationError('Opaque type descriptor requires name to be encoded.');
      }
      if (!registry.find('opaque', d.name)) {
        throw new SerializationError(`Opaque type ${d.name} is not registered.`);
      }
      return {
        kind: 'opaque',
        name: d.name,
      };
    }

    case 'custom': {
      const d = desc as ICustomTypeDescriptor<unknown>;
      if (!d.name) {
        throw new SerializationError('Custom type descriptor requires name to be encoded.');
      }
      if (!registry.find('custom', d.name)) {
        throw new SerializationError(`Custom type ${d.name} is not registered.`);
      }
      return {
        kind: 'custom',
        name: d.name,
      };
    }

    default:
      throw new SerializationError(`Unknown type descriptor: ${formatDescriptor(desc)}`);
  }
}
