import { Component, ComponentFn, createComponent } from './Component';
import { createEffect } from './createEffect';
import { createSignal } from './createSignal';
import { dynamicProps } from './dynamicProps';

interface ITestComponent {
  act(): string | boolean;
  name: string;
}

const Constant: ComponentFn<ITestComponent, { value: string | boolean }> = props => {
  return {
    act() {
      return props.value;
    },
    name: 'constant',
  };
};
Constant.displayName = 'Constant';

const Once: ComponentFn<ITestComponent, { value: string | boolean }> = props => {
  const [satisfied, setSatisfied] = createSignal(false);
  return {
    act() {
      const result = satisfied() || props.value;
      setSatisfied(true);
      return result;
    },

    name: 'once',
  };
};
Once.displayName = 'Once';

const Toggle: ComponentFn<ITestComponent, {}> = () => {
  const [toggled, setToggled] = createSignal(false);

  return {
    act() {
      setToggled(toggled => !toggled);
      return toggled() ? 'toggled' : false;
    },

    name: 'toggle',
  };
};
Toggle.displayName = 'Toggle';

const Repeat: ComponentFn<ITestComponent, { child: Component<ITestComponent, any> }> = props => {
  return {
    act() {
      return props.child.getRoot().act();
    },

    name: 'repeat',
  };
};
Repeat.displayName = 'Repeat';

const Sequence: ComponentFn<
  ITestComponent,
  { children: Component<ITestComponent, any>[] }
> = props => {
  const [index, setIndex] = createSignal(0);
  return {
    act() {
      const children = props.children;
      let i = index();
      while (i < children.length) {
        const result = children[index()].getRoot().act();
        if (result !== true) {
          return result;
        }
        i = setIndex(i + 1);
      }

      return true;
    },

    name: 'sequence',
  };
};
Sequence.displayName = 'Sequence';

describe('Component', () => {
  test('construct', () => {
    const toggle = createComponent(Toggle);

    expect(toggle.displayName).toBe('Toggle');
    expect(toggle.getRoot().name).toBe('toggle');

    expect(toggle.getRoot().act()).toBe('toggled');
    expect(toggle.getRoot().act()).toBe(false);
    expect(toggle.getRoot().act()).toBe('toggled');
    expect(toggle.getRoot().act()).toBe(false);
    toggle.dispose();
  });

  test('static child prop', () => {
    const rep = createComponent(Repeat, { child: createComponent(Toggle) });

    expect(rep.displayName).toBe('Repeat');
    expect(rep.getRoot().name).toBe('repeat');

    expect(rep.getRoot().act()).toBe('toggled');
    expect(rep.getRoot().act()).toBe(false);

    rep.dispose();
  });

  test('dynamic child prop', () => {
    const [child, setChild] = createSignal<Component<ITestComponent, any>>(createComponent(Toggle));
    const rep = createComponent(Repeat, dynamicProps({ child }, ['child']));
    expect(rep.displayName).toBe('Repeat');
    expect(rep.getRoot().name).toBe('repeat');

    expect(rep.getRoot().act()).toBe('toggled');
    expect(rep.getRoot().act()).toBe(false);

    setChild(createComponent(Constant, { value: 'one' }));
    expect(rep.getRoot().act()).toBe('one');

    rep.dispose();
  });

  test('reactivity', () => {
    const [value, setValue] = createSignal('a');
    const child = createComponent(Constant, dynamicProps({ value }, ['value']));
    const rep = createComponent(Repeat, { child });

    expect(rep.getRoot().act()).toBe('a');
    expect(rep.getRoot().act()).toBe('a');

    setValue('b');
    expect(rep.getRoot().act()).toBe('b');

    let v: string | boolean = '';
    createEffect(() => {
      v = rep.getRoot().act();
    });

    expect(v).toBe('b');
    setValue('c');
    expect(v).toBe('c');

    rep.dispose();
  });

  test('sequence', () => {
    const rep = createComponent(Sequence, {
      children: [
        createComponent(Once, { value: 'first' }),
        createComponent(Once, { value: 'second' }),
        createComponent(Once, { value: 'third' }),
      ],
    });
    expect(rep.displayName).toBe('Sequence');
    expect(rep.getRoot().name).toBe('sequence');

    expect(rep.getRoot().act()).toBe('first');
    expect(rep.getRoot().act()).toBe('second');
    expect(rep.getRoot().act()).toBe('third');
    expect(rep.getRoot().act()).toBe(true);
    expect(rep.getRoot().act()).toBe(true);

    rep.dispose();
  });
});
