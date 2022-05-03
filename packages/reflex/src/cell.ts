import { IPropertyDescriptors, ITypeDescriptor } from './descriptors';
import { createSignal } from './createSignal';

export type CellGetter<T> = () => T;
export type CellSetter<T> = (value: T) => void;
export type CellGetterTyped<T> = (() => T) & { descriptor: ITypeDescriptor<T> };
export interface CellDescriptor<T> {
  configurable?: boolean;
  enumerable?: boolean;
  value?: T;
  writable?: boolean;
  get?(): T;
  set?(v: T): void;
  type: ITypeDescriptor<T>;
}

/** Create an observable object property.
    @param obj The object upon which to define the property.
    @param key The name of the property to define.
    @param type The type descriptor for the property.
    @param value The initial value of the property
    @param enumerable Whether this property should be enumerable.
*/
export function makeCell<Cls extends {}, Key extends keyof Cls>(
  obj: Cls,
  key: Key,
  type: ITypeDescriptor<Cls[Key]>,
  value?: Cls[Key],
  enumerable?: boolean
): void {
  if (value === undefined) {
    const prop = Reflect.getOwnPropertyDescriptor(obj, key);
    if (prop && prop.value) {
      value = prop.value;
    }
  }
  const [get, set] = createSignal(value);
  (get as CellGetterTyped<Cls[Key]>).descriptor = type;
  Reflect.defineProperty(obj, key, {
    get,
    set,
    enumerable: enumerable ?? true,
    configurable: true,
  });
}

/** Make specified properties of an object observable.
    @param obj The object whose properties we want to make observable.
    @param props A map of property descriptors. An observable property will be created
      for each entry in the map.
*/
export function makeCells<Cls extends {}>(obj: Cls, props: IPropertyDescriptors<Cls>) {
  Reflect.ownKeys(props).forEach(k => {
    const prop = props[k as keyof Cls];
    if (prop) {
      let value = prop.default;
      if (value === undefined) {
        const desc = Reflect.getOwnPropertyDescriptor(obj, k);
        if (desc && desc.value !== undefined) {
          value = desc.value;
        } else if (desc && desc.get) {
          value = desc.get();
        }
      }
      const [get, set] = createSignal(value);
      (get as CellGetterTyped<any>).descriptor = prop.type;
      Reflect.defineProperty(obj, k, {
        get,
        set,
        enumerable: prop.enumerable ?? true,
        configurable: true,
      });
    }
  });
}

/** Create an observable object property which is computed from a function.
    @param obj The object upon which to define the property.
    @param key The name of the property to define.
    @param type The type descriptor for the property.
    @param getter The function which computes the value of the cell.
    @param enumerable Whether this property should be enumerable.
*/
export function makeFormulaCell<Cls extends {}, Key extends keyof Cls>(
  obj: Cls,
  key: Key,
  type: ITypeDescriptor<Cls[Key]>,
  getter: () => Cls[Key],
  enumerable?: boolean
): void {
  (getter as CellGetterTyped<Cls[Key]>).descriptor = type;
  Reflect.defineProperty(obj, key, {
    get: getter,
    set: undefined,
    enumerable: enumerable ?? true,
    configurable: true,
  });
}

/** Return the type descriptor for a cell.
    @param obj The object that contains the cell.
    @param key The name of the cell property to define.
*/
export function cellType<Cls extends {}, Key extends keyof Cls>(
  obj: Cls,
  key: Key
): ITypeDescriptor<Cls[Key]> | null {
  const prop = Reflect.getOwnPropertyDescriptor(obj, key);
  if (prop && prop.get) {
    return (
      ((prop.get as CellGetterTyped<Cls[Key]>).descriptor as ITypeDescriptor<Cls[Key]>) ?? null
    );
  }
  return null;
}

/** Return the getter function for a cell.
    @param obj The object that contains the cell.
    @param key The name of the property.
    @returns The getter function for the cell.
    @throws Error if the getter does not exist.
*/
export function cellGetter<Cls extends {}, Key extends keyof Cls>(
  obj: Cls,
  key: Key
): CellGetter<Cls[Key]> {
  const prop = Reflect.getOwnPropertyDescriptor(obj, key);
  if (prop && prop.get) {
    return prop.get;
  }
  throw new Error(`Cell getter not found for ${obj.constructor.name}:${key}`);
}

/** Return the setter function for a cell.
    @param obj The object that contains the cell.
    @param key The name of the property.
    @returns The setter function for the cell.
    @throws Error if the setter does not exist.
*/
export function cellSetter<Cls extends {}, Key extends keyof Cls>(
  obj: Cls,
  key: Key
): CellSetter<Cls[Key]> {
  const prop = Reflect.getOwnPropertyDescriptor(obj, key);
  if (prop && prop.set) {
    return prop.set;
  }
  throw new Error(`Cell setter not found for ${obj.constructor.name}:${key}`);
}

/** Return true if the given object property has a setter.
    @param obj The object that contains the cell.
    @param key The name of the property.
    @returns True if the property is mutable.
*/
export function isWritable<Cls extends {}, Key extends keyof Cls>(
  obj: Cls,
  key: Key
): boolean {
  const prop = Reflect.getOwnPropertyDescriptor(obj, key);
  return Boolean(prop && prop.set);
}

/** Return the getter and setter function for a cell.
    @param obj The object that contains the cell.
    @param key The name of the property.
    @returns A 2-tuple containing the getter and setter function for the cell.
    @throws Error if the getter or setter does not exist.
*/
export function cellAccessors<Cls extends {}, Key extends keyof Cls>(
  obj: Cls,
  key: Key
): [CellGetter<Cls[Key]>, CellSetter<Cls[Key]>] {
  const prop = Reflect.getOwnPropertyDescriptor(obj, key);
  if (prop && prop.set && prop.get) {
    return [prop.get, prop.set];
  }
  throw new Error(`Cell getter/setter not found for ${obj.constructor.name}:${key}`);
}

/** Returns a descriptor for a cell.
    @param obj The object that contains the cell.
    @param key The name of the property.
    @returns A PropertyDescriptor that also includes the property type.
    @throws Error if the property does not exist.
*/
export function getCellDescriptor<Cls extends {}, Key extends keyof Cls>(
  obj: Cls,
  key: Key
): CellDescriptor<Cls[Key]> {
  const prop = Reflect.getOwnPropertyDescriptor(obj, key);
  if (!prop) {
    throw new Error(`Cell ${obj.constructor.name}:${key} not found.`);
  }
  const descriptor = prop && (prop.get as CellGetterTyped<Cls[Key]>).descriptor;
  if (!descriptor) {
    throw new Error(`Cell ${obj.constructor.name}:${key} is missing a type descriptor.`);
  }
  return {...prop, type: descriptor }
}

/** Returns a descriptor for a cell if it exists, otherwise return null.
    @param obj The object that contains the cell.
    @param key The name of the property.
    @returns A PropertyDescriptor that also includes the property type.
    @throws Error if the property does not exist.
*/
export function findCellDescriptor<Cls extends {}, Key extends keyof Cls>(
  obj: Cls,
  key: Key
): CellDescriptor<Cls[Key]> | null {
  const prop = Reflect.getOwnPropertyDescriptor(obj, key);
  if (!prop) {
    return null
  }
  const descriptor = prop && (prop.get as CellGetterTyped<Cls[Key]>).descriptor;
  if (!descriptor) {
    return null;
  }
  return {...prop, type: descriptor }
}
