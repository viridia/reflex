export type JsonValue = boolean | number | string | null | undefined | JsonArray | JsonObject;
export type JsonArray = JsonValue[];
export type JsonObject = { [name: string]: JsonValue };

export function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && !Array.isArray(value);
}

export function isJsonArray(value: JsonValue): value is JsonArray {
  return Array.isArray(value);
}
