import {
  formatDescriptor,
  IArrayTypeDescriptor,
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  INullableTypeDescriptor,
  IOptionalTypeDescriptor,
  IRecordTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';
import { JsonObject, JsonValue } from '../json';
import { registry } from './registry';
import { validate } from './validate';
import { istype } from './istype';

export class DeserializationError extends Error {}

const errorCallback = (msg: string) => {
  throw new DeserializationError(msg);
};

/** Convert the value from a JsonObject into the described type. */
export function unmarshal(desc: ITypeDescriptor<any>, value: JsonValue): any {
  switch (desc.kind) {
    case 'boolean':
    case 'integer':
    case 'float':
    case 'string':
      // Note: for integers, we don't validate enum values because it's expensive...
      validate(desc, value, 'input', errorCallback);
      return value;

    case 'optional': {
      if (value === undefined) {
        return value;
      }
      const d = desc as IOptionalTypeDescriptor<any>;
      return unmarshal(d.element, value);
    }

    case 'nullable': {
      if (value === null) {
        return value;
      }
      const d = desc as INullableTypeDescriptor<any>;
      return unmarshal(d.element, value);
    }

    case 'array': {
      const d = desc as IArrayTypeDescriptor<any>;
      if (Array.isArray(value)) {
        return value.map(el => unmarshal(d.element, el));
      }
      throw new DeserializationError(`Expected array, got ${typeof value}`);
    }

    case 'tuple': {
      const d = desc as ITupleTypeDescriptor<any>;
      if (Array.isArray(value)) {
        if (value.length !== d.elements.length) {
          throw new DeserializationError(
            `Expected ${d.elements.length} tuple elements, got ${value.length}`
          );
        }
        const result: any[] = [];
        for (let i = 0, ct = d.elements.length; i < ct; i += 1) {
          result.push(unmarshal(d.elements[i], value[i]));
        }
        return result;
      }
      throw new DeserializationError(`Expected array, got ${typeof value}`);
    }

    case 'union': {
      const d = desc as IUnionTypeDescriptor<any>;
      // TODO: This isn't quite right, as istype is not expected to work on serialized values.
      const ud = d.elements.find(elt => istype(elt, value));
      if (!ud) {
        throw new DeserializationError(
          `Expected member of union ${formatDescriptor(d)}, got ${typeof value}`
        );
      }
      return unmarshal(ud, value);
    }

    case 'record': {
      const d = desc as IRecordTypeDescriptor<any>;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const keys = Object.keys(value);
        const result: any = {};
        for (let i = 0, ct = keys.length; i < ct; i += 1) {
          const k = keys[i];
          const v = (value as JsonObject)[k];
          result[k] = unmarshal(d.element, v);
        }
        return result;
      }
      throw new DeserializationError(`Expected object, got ${typeof value}`);
    }

    case 'struct': {
      const d = desc as IStructTypeDescriptor<any>;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (d.unmarshal) {
          return d.unmarshal(value);
        }
        const keys = Object.keys(d.properties);
        const result: any = {};
        for (let i = 0, ct = keys.length; i < ct; i += 1) {
          const k = keys[i];
          const f = d.properties[k];
          if (f && (f.enumerable ?? true)) {
            const v = (value as JsonObject)[k];
            if (v === undefined) {
              if (f.type.kind !== 'optional') {
                throw new DeserializationError(`Missing key: ${k}`);
              }
            } else {
              result[k] = unmarshal(f.type, (value as JsonObject)[k]);
            }
          }
        }
        return result;
      }
      throw new DeserializationError(`Expected object, got ${typeof value}`);
    }

    case 'class': {
      const d = desc as IClassTypeDescriptor<any>;
      if (value && typeof value === 'object') {
        if (d.unmarshal) {
          return d.unmarshal(value);
        }

        // Replace with canonical type, if one exists.
        const d2 = registry.find('class', d.name) || d;
        if (d2 && d2.unmarshal) {
          return d2.unmarshal(value);
        }

        if (Array.isArray(value)) {
          throw new DeserializationError(`Expected object, got array`);
        } else if (!d2.create) {
          throw new DeserializationError(`Class ${d.name} is not creatable`);
        }

        const keys = Object.keys(d2.properties);
        const result: any = d2.create();
        for (let i = 0, ct = keys.length; i < ct; i += 1) {
          const k = keys[i];
          const f = d.properties[k];
          if (f && (f.enumerable ?? true)) {
            const v = (value as JsonObject)[k];
            if (v === undefined) {
              if (f.type.kind !== 'optional') {
                throw new DeserializationError(`Missing key: ${k}`);
              }
            } else {
              result[k] = unmarshal(f.type, (value as JsonObject)[k]);
            }
          }
        }
        return result;
      }
      throw new DeserializationError(`Expected object, got ${typeof value}`);
    }

    case 'custom': {
      const d = desc as ICustomTypeDescriptor<any>;
      if (d.unmarshal) {
        return d.unmarshal(value);
      } else {
        const d2 = registry.get('custom', d.name);
        if (d2 && d2.unmarshal) {
          return d2.unmarshal(value);
        }
      }
      throw new DeserializationError(`Custom type ${d.name} does not support deserialization`);
    }

    default:
      throw new DeserializationError(
        `Type kind ${formatDescriptor(desc)} does not support deserialization`
      );
  }
}
