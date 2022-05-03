/** Transform a property map containing a mix of static values and dynamic functions into
    a map where the dyanmic functions have been converted into getters. This allows consumers
    of the map to treat all properties consistently.

    So instead of having to write `props.value()` we can just use `props.value`.
 */
export function dynamicProps<Props extends {}, DynKeys extends keyof Props>(
  props: ConditionalDynamic<Props, DynKeys>,
  dynKeys: DynKeys[]
): Props {
  if (dynKeys.length > 0) {
    const result = { ...props } as unknown as Props;
    for (let i = 0; i < dynKeys.length; i++) {
      const key = dynKeys[i] as keyof Props;
      const src = result[key] as unknown as () => unknown;
      Reflect.defineProperty(result, key, {
        get() {
          return src();
        },
        enumerable: true,
      });
    }
    return result;
  } else {
    return props as unknown as Props;
  }
}

export type ConditionalDynamic<Props extends {}, DynKeys extends keyof Props> = {
  [key in keyof Props]: key extends DynKeys ? () => Props[key] : Props[key];
};
