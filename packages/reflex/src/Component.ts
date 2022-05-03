import { createRoot } from './createRoot';
import { getCurrentScope, setScopeName } from './scopeStack';
import { ITrackingScope } from './scope';
import { createMemo } from './createMemo';

/** Constructor function for a component. */
export type ComponentFn<Result, Props = {}> = ((props: Props) => Result) & {
  displayName?: string;
};

/** A component defines a root scope for evaluation of an expression. */
export class Component<Result, Props = {}> {
  private root: () => Result;
  private disposer!: () => void;
  protected scope!: ITrackingScope;

  constructor(public type: ComponentFn<Result, Props>, private props: Props) {
    this.root = createRoot(disposer => {
      this.disposer = disposer;
      this.scope = getCurrentScope()!;
      setScopeName(type.displayName ?? this.constructor.name);
      return createMemo(() => {
        const root = type(this.props);
        this.onCreate();
        return root;
      });
    });
  }

  public dispose() {
    this.disposer();
  }

  /** Returns the memoized, reactive root value of the component. */
  public getRoot(): Result {
    const root = this.root();
    if (!root) {
      throw new Error(`Missing root value for ${this.displayName}`);
    }
    return root;
  }

  public getProps(): Props {
    return this.props;
  }

  /** Override this method to get notified when the content is evaluated. */
  protected onCreate() {}

  /** Used for debugging. */
  public get displayName(): string {
    return this.scope.debugName!;
  }

  public setDisplayName(displayName: string) {
    this.scope.debugName = displayName;
  }
}

/** Helper function to create a component. */
export function createComponent<Result, Props = {}>(
  type: ComponentFn<Result, Props>,
  props: Props = {} as Props
): Component<Result, Props> {
  return new Component<Result, Props>(type, props);
}
