import {
  formatDescriptor,
  INullableTypeDescriptor,
  IStructTypeDescriptor,
  ITupleTypeDescriptor,
  ITypeDescriptor,
  IUnionTypeDescriptor,
} from './descriptors';
import { IFieldDescriptor } from './field';

type TransformFn = (desc: ITypeDescriptor<unknown>) => ITypeDescriptor<unknown> | null;

/** Perform a transformation on a type expression. Returns the same object if the type
    was not modified.
 */
export function transform(
  desc: ITypeDescriptor<unknown>,
  fn: TransformFn
): ITypeDescriptor<unknown> {
  const mapType = (t: ITypeDescriptor<unknown>): ITypeDescriptor<unknown> => fn(t) ?? t;
  const walk = (t: ITypeDescriptor<unknown>) => {
    switch (t.kind) {
      case 'boolean':
      case 'integer':
      case 'float':
      case 'string':
      case 'class':
      case 'custom':
        return mapType(desc);

      case 'optional':
      case 'nullable':
      case 'array':
      case 'record': {
        const d = t as INullableTypeDescriptor<unknown>;
        const element = mapType(d.element);
        if (element === d.element) {
          return t;
        } else {
          return { ...d, element };
        }
      }

      case 'tuple': {
        const d = t as ITupleTypeDescriptor<any[]>;
        let changed = false;
        const elements = d.elements.map(el => {
          const ne = mapType(el);
          if (ne !== el) {
            changed = true;
          }
          return ne;
        });
        return changed ? { ...d, elements } : d;
      }

      case 'union': {
        const d = t as IUnionTypeDescriptor<any[]>;
        let changed = false;
        const elements = d.elements.map(el => {
          const ne = mapType(el);
          if (ne !== el) {
            changed = true;
          }
          return ne;
        });
        return changed ? { ...d, elements } : d;
      }

      case 'struct': {
        const d = t as IStructTypeDescriptor<any>;
        let changed = false;
        const result: IStructTypeDescriptor<any> = { ...d, properties: {} };
        Object.keys(d.properties).forEach(k => {
          const f: IFieldDescriptor<unknown> = d.properties[k]!;
          const ne = mapType(f.type);
          if (ne !== f.type) {
            changed = true;
          }
          (result as any)[k] = { ...f, type: ne };
        });

        return changed ? result : d;
      }

      default:
        throw new Error(`Type not cloneable: ${formatDescriptor(desc)}`);
    }
  };
  return walk(desc);
}
