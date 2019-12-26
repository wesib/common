import {
  ArraySet,
  BootstrapWindow,
  ComponentContext,
  ContentRoot,
  DefaultNamespaceAliaser,
  RenderScheduler,
  ShadowContentRoot,
} from '@wesib/wesib';
import { ContextKey, ContextKey__symbol, SingleContextKey } from 'context-values';
import { EventSupply } from 'fun-events';
import { produceBasicStyle, StypOptions, StypRender, StypRules, StypSelector } from 'style-producer';
import { ComponentStypRender } from './component-styp-render';
import { ElementIdClass } from './element-id-class.impl';

const ComponentStyleProducer__key =
    (/*#__PURE__*/ new SingleContextKey<ComponentStyleProducer>('component-style-producer:impl'));

const hostSelector: StypSelector.Normalized = [{ e: ':host' }];

/**
 * @internal
 */
export class ComponentStyleProducer {

  static get [ContextKey__symbol](): ContextKey<ComponentStyleProducer> {
    return ComponentStyleProducer__key;
  }

  constructor(
      private readonly _context: ComponentContext,
      private readonly _produce = produceBasicStyle,
  ) {}

  produce(rules: StypRules, options: StypOptions = {}): EventSupply {

    const context = this._context;
    const shadowRoot = context.get(ShadowContentRoot, { or: null });

    return this._produce(rules, {
      ...options,
      document: options.document || context.get(BootstrapWindow).document,
      parent: options.parent || context.get(ContentRoot),
      rootSelector: options.rootSelector || buildRootSelector(),
      schedule: options.schedule || buildScheduler(),
      nsAlias: options.nsAlias || context.get(DefaultNamespaceAliaser),
      render: buildRender(),
    });

    function buildScheduler(): (operation: () => void) => void {

      const scheduler = context.get(RenderScheduler);

      return operation => scheduler.newSchedule().schedule(operation);
    }

    function buildRootSelector(): StypSelector {
      return shadowRoot ? hostSelector : [];
    }

    function buildRender(): StypRender | readonly StypRender[] | undefined {

      const { render } = options;
      const renders = new ArraySet<StypRender>(render)
          .add(...context.get(ComponentStypRender));

      if (!shadowRoot) {
        renders.add(noShadowRender(context.get(ElementIdClass)));
      }

      return renders.value;
    }
  }

}

function noShadowRender(idClass: ElementIdClass): StypRender {
  return {
    order: -100,
    render(producer, properties) {
      producer.render(properties, {
        selector: [{ c: [idClass] }, ...producer.selector],
      });
    },
  };
}
