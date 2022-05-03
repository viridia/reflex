import {
  formatDescriptor,
  IArrayTypeDescriptor,
  IClassTypeDescriptor,
  ICustomTypeDescriptor,
  IIntegerTypeDescriptor,
  INullableTypeDescriptor,
  IOptionalTypeDescriptor,
  IRecordTypeDescriptor,
  IStringTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';

export type MessageStream = (msg: string) => void;

/** Convert the value into a type which can be serialized to JSON. */
export function validate<T>(
  descriptor: ITypeDescriptor<T>,
  value: T,
  path = 'input',
  out?: MessageStream
): boolean {
  const walk = (desc: ITypeDescriptor<any>, value: any, path: string): boolean => {
    switch (desc.kind) {
      case 'boolean':
        if (typeof value !== 'boolean') {
          out && out(`Expected ${path} to be boolean type, actual type was ${typeof value}`);
          return false;
        }
        return true;

      case 'integer':
        if (typeof value === 'number') {
          const d = desc as IIntegerTypeDescriptor;
          if (Math.trunc(value) !== value) {
            out && out(`Expected ${path} to be an integer, but has fractional part.`);
            return false;
          }
          if (d.minVal !== undefined && value < d.minVal) {
            out && out(`Expected ${path} to be >= ${d.minVal}, actual value is ${value}.`);
            return false;
          }
          if (d.maxVal !== undefined && value > d.maxVal) {
            out && out(`Expected ${path} to be <=> ${d.maxVal}, actual value is ${value}.`);
            return false;
          }
          return true;
        }
        out && out(`Expected ${path} to be number type, actual type was ${typeof value}`);
        return false;

      case 'float':
        if (typeof value === 'number') {
          const d = desc as IIntegerTypeDescriptor;
          if (d.minVal !== undefined && value < d.minVal) {
            out && out(`Expected ${path} to be >= ${d.minVal}, actual value is ${value}.`);
            return false;
          }
          if (d.maxVal !== undefined && value > d.maxVal) {
            out && out(`Expected ${path} to be <=> ${d.maxVal}, actual value is ${value}.`);
            return false;
          }
          return true;
        }
        out && out(`Expected ${path} to be number type, actual type was ${typeof value}`);
        return false;

      case 'string':
        if (typeof value === 'string') {
          const d = desc as IStringTypeDescriptor;
          if (d.maxLength !== undefined && value.length > d.maxLength) {
            out &&
              out(
                `Expected ${path} to have length <= ${d.maxLength}, actual length was ${value.length}`
              );
            return false;
          }
          if (d.enumVals) {
            const enumVals = typeof d.enumVals === 'function' ? d.enumVals() : d.enumVals;
            if (!enumVals.includes(value)) {
              out &&
                out(
                  `Expected ${path} to be one of [${enumVals.join(
                    ', '
                  )}], actual value was "${value}"`
                );
              return false;
            }
          }
          return true;
        }
        out && out(`Expected ${path} to be string type, actual type was ${typeof value}`);
        return false;

      case 'optional': {
        if (value === undefined) {
          return true;
        }
        const d = desc as IOptionalTypeDescriptor<any>;
        return walk(d.element, value, path);
      }

      case 'nullable': {
        if (value === null) {
          return true;
        }
        const d = desc as INullableTypeDescriptor<any>;
        return walk(d.element, value, path);
      }

      case 'array': {
        const d = desc as IArrayTypeDescriptor<any>;
        if (Array.isArray(value)) {
          return value.every((el, index) => walk(d.element, el, `${path}[${index}]`)!);
        }
        out && out(`Expected ${path} to be an array, actual type was ${typeof value}`);
        return false;
      }

      case 'tuple': {
        const d = desc as ITupleTypeDescriptor<any>;
        if (Array.isArray(value)) {
          if (value.length !== d.elements.length) {
            out &&
              out(
                `Expected ${path} to have length ${d.elements.length}, actual length was ${value.length}`
              );
            return false;
          }
          for (let i = 0, ct = d.elements.length; i < ct; i += 1) {
            if (!walk(d.elements[i], value[i], `${path}[${i}]`)) {
              return false;
            }
          }
          return true;
        }
        out && out(`Expected ${path} to be an array, actual type was ${typeof value}`);
        return false;
      }

      case 'union': {
        const d = desc as IUnionTypeDescriptor<any>;
        if (d.typeTest) {
          const typeDesc = d.typeTest(value);
          if (typeDesc) {
            return walk(typeDesc, value, path);
          }
        }
        for (let i = 0, ct = d.elements.length; i < ct; i += 1) {
          // Call `validate` rather than `walk` to suppress error message
          if (validate(d.elements[i], value)) {
            return true;
          }
        }

        // No match, print error
        out &&
          out(
            `Expected ${path} to be member of union ${formatDescriptor(
              d
            )}, actual type was ${typeof value}`
          );
        return false;
      }

      case 'record': {
        const d = desc as IRecordTypeDescriptor<any>;
        if (typeof value === 'object') {
          const keys = Object.keys(value);
          for (let i = 0, ct = keys.length; i < ct; i += 1) {
            const k = keys[i];
            if (!walk(d.element, (value as any)[k], `${path}.${k}`)) {
              return false;
            }
          }
          return true;
        }
        out && out(`Expected ${path} to be object type, actual type was ${typeof value}`);
        return false;
      }

      case 'struct': {
        const d = desc as IStructTypeDescriptor<any>;
        if (typeof value === 'object') {
          const keys = Object.keys(d.properties);
          for (let i = 0, ct = keys.length; i < ct; i += 1) {
            const k = keys[i];
            const f = d.properties[k];
            if (f && (f.enumerable ?? true)) {
              if (!(k in value)) {
                if (f.type.kind !== 'optional') {
                  out && out(`Missing key '${k}' in ${path}`);
                  return false;
                }
              } else if (!walk(f.type, (value as any)[k], `${path}.${k}`)) {
                return false;
              }
            }
          }

          if (d.additionalPropertes === false) {
            for (const key in value) {
              if (!(key in d.properties)) {
                out && out(`Extra property '${key}' not allowed in ${path}`);
                return false;
              }
            }
          }

          return true;
        }
        out && out(`Expected ${path} to be object type, actual type was ${typeof value}`);
        return false;
      }

      case 'class': {
        const d = desc as IClassTypeDescriptor<any>;
        if (typeof value === 'object') {
          if (d.validate) {
            if (!d.validate(value)) {
              out && out(`Validation failed for custom typed ${path}.`);
              return false;
            } else {
              return true;
            }
          }

          const keys = Object.keys(d.properties);
          for (let i = 0, ct = keys.length; i < ct; i += 1) {
            const k = keys[i];
            const f = d.properties[k];
            if (f && (f.enumerable ?? true)) {
              if (!(k in value)) {
                if (f.type.kind !== 'optional') {
                  out && out(`Missing key '${k}' in ${path}`);
                  return false;
                }
              } else if (!walk(f.type, (value as any)[k], `${path}.${k}`)) {
                return false;
              }
            }
          }

          if (d.additionalPropertes === false) {
            for (const key in value) {
              if (!(key in d.properties)) {
                out && out(`Extra property '${key}' not allowed in ${path}`);
                return false;
              }
            }
          }

          return true;
        }
        out && out(`Expected ${path} to be object type, actual type was ${typeof value}`);
        return false;
      }

      case 'custom': {
        const d = desc as ICustomTypeDescriptor<any>;
        if (d.validate && !d.validate(value)) {
          out && out(`Validation failed for custom typed ${path}.`);
        }
        return true;
      }

      case 'opaque':
        out && out(`Opaque type of ${path} cannot be validated.`);
        return false;

      default:
        out && out(`Unrecognized descriptor type: ${desc.kind}`);
        return false;
    }
  };

  return walk(descriptor, value, path);
}
