import {
  formatDescriptor,
  IArrayTypeDescriptor,
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  IOptionalTypeDescriptor,
  IRecordTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';
import { JsonArray, JsonObject, JsonValue } from '../json';
import { istype } from './istype';

export class SerializationError extends Error {}

/** Convert the value into a type which can be serialized to JSON. */
export function marshal(desc: ITypeDescriptor<any>, value: any): JsonValue {
  switch (desc.kind) {
    case 'boolean':
    case 'integer':
    case 'float':
    case 'string':
      return value;

    case 'optional': {
      if (value === undefined) {
        return value;
      }
      const d = desc as IOptionalTypeDescriptor<any>;
      return marshal(d.element, value);
    }

    case 'nullable': {
      if (value === null) {
        return value;
      }
      const d = desc as IOptionalTypeDescriptor<any>;
      return marshal(d.element, value);
    }

    case 'array': {
      const d = desc as IArrayTypeDescriptor<any>;
      if (Array.isArray(value)) {
        return value.map(el => marshal(d.element, el)!);
      }
      throw new SerializationError(`Expected array, got ${typeof value}`);
    }

    case 'tuple': {
      const d = desc as ITupleTypeDescriptor<any>;
      if (Array.isArray(value)) {
        const result: JsonArray = [];
        for (let i = 0, ct = d.elements.length; i < ct; i += 1) {
          result.push(marshal(d.elements[i], value[i]));
        }
        return result;
      }
      throw new SerializationError(`Expected array, got ${typeof value}`);
    }

    case 'union': {
      const d = desc as IUnionTypeDescriptor<any>;
      if (d.typeTest) {
        const typeDesc = d.typeTest(value);
        if (typeDesc) {
          return marshal(typeDesc, value);
        }
        throw new SerializationError(
          `Expected member of union ${formatDescriptor(d)}, got ${typeof value}`
        );
      }
      const ud = d.elements.find(elt => istype(elt, value));
      if (!ud) {
        throw new SerializationError(
          `Expected member of union ${formatDescriptor(d)}, got ${typeof value}`
        );
      }
      return marshal(ud, value);
    }

    case 'record': {
      const d = desc as IRecordTypeDescriptor<any>;
      if (typeof value === 'object') {
        const keys = Object.keys(value);
        const result: JsonObject = {};
        for (let i = 0, ct = keys.length; i < ct; i += 1) {
          const k = keys[i];
          result[k] = marshal(d.element, value[k]);
        }
        return result;
      }
      throw new SerializationError(`Expected object, got ${typeof value}`);
    }

    case 'struct': {
      const d = desc as IStructTypeDescriptor<any>;
      if (typeof value === 'object') {
        if (d.marshal) {
          return d.marshal(value);
        }
        const keys = Object.keys(d.properties);
        const result: JsonObject = {};
        for (let i = 0, ct = keys.length; i < ct; i += 1) {
          const k = keys[i];
          const f = d.properties[k];
          if (f && (f.enumerable ?? true)) {
            result[k] = marshal(f.type, value[k]);
          }
        }
        return result;
      }
      throw new SerializationError(`Expected object, got ${typeof value}`);
    }

    case 'class': {
      const d = desc as IClassTypeDescriptor<any>;
      if (typeof value === 'object') {
        if (d.marshal) {
          return d.marshal(value);
        }
        const keys = Object.keys(d.properties);
        const result: JsonObject = {};
        for (let i = 0, ct = keys.length; i < ct; i += 1) {
          const k = keys[i];
          const f = d.properties[k];
          if (f && (f.enumerable ?? true)) {
            result[k] = marshal(f.type, value[k]);
          }
        }
        return result;
      }
      throw new SerializationError(`Expected object, got ${typeof value}`);
    }

    case 'custom': {
      const d = desc as ICustomTypeDescriptor<any>;
      if (d.marshal) {
        return d.marshal(value);
      }

      throw new SerializationError(`Custom type ${d.name} does not support serialization`);
    }

    default:
      throw new SerializationError(
        `Type kind ${formatDescriptor(desc)} does not support serialization`
      );
  }
}
