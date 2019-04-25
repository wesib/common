import { ComponentContext, ComponentFactory, ElementAdapter } from '@wesib/wesib';
import { ContextKey, SingleContextKey } from 'context-values';
import { Mount } from './mount.decorator';

const AutoMounter__key = /*#__PURE__*/ new SingleContextKey<AutoMounter>('auto-mounter');

export class AutoMounter {

  private _adapters: ElementAdapter[] = [];

  static get key(): ContextKey<AutoMounter> {
    return AutoMounter__key;
  }

  register(factory: ComponentFactory, opts: Mount.Opts | Mount.Opts['to']) {
    this._adapters.push(mountAdapter(factory, opts));
  }

  adapt(element: Element): ComponentContext<any> | undefined {
    for (const adapter of this._adapters) {

      const context = adapter(element);

      if (context) {
        return context;
      }
    }

    return;
  }

}

function mountAdapter(factory: ComponentFactory, opts: Mount.Opts | Mount.Opts['to']): ElementAdapter {

  const matches = elementMatcher(opts);

  return (element: Element) => {
    if (!matches(element)) {
      return;
    }
    return factory.mountTo(element).context;
  };
}

function elementMatcher(opts: Mount.Opts | Mount.Opts['to']): (element: Element) => boolean {

  const to = typeof opts === 'object' ? opts.to : opts;

  if (typeof to === 'function') {
    return to;
  }

  return element => element.matches(to);
}
