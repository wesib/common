import { inFormElement, inGroup } from '@frontmeans/input-aspects';
import { ContextBuilder } from '@proc7ts/context-values';
import { EventKeeper } from '@proc7ts/fun-events';
import { BootstrapContext, Component, ComponentContext, ComponentSlot, DefinitionContext } from '@wesib/wesib';
import { ComponentShare, ComponentShare__symbol } from '../share';
import { ComponentShareRegistry } from '../share/component-share-registry.impl';
import { SharedByComponent$ContextBuilder } from '../share/component-share.impl';
import { testDefinition, testElement } from '../spec/test-element';
import { FieldShare } from './field.share';
import { Form } from './form';
import { FormShare } from './form.share';

describe('forms', () => {
  describe('FormShare', () => {

    let formShare: FormShare;
    let fieldShare: FieldShare;

    beforeEach(() => {
      formShare = FormShare[ComponentShare__symbol]();
      fieldShare = FieldShare[ComponentShare__symbol]();
    });

    describe('addSharer', () => {

      let bsContext: BootstrapContext;
      let defContext: DefinitionContext;
      let registry: ComponentShareRegistry;

      beforeEach(async () => {

        @Component('test-component')
        class TestComponent {
        }

        defContext = await testDefinition(TestComponent);
        bsContext = defContext.get(BootstrapContext);
        registry = bsContext.get(ComponentShareRegistry);
      });

      it('registers form sharer', async () => {

        const supply = formShare.addSharer(defContext);

        expect([...await registry.sharers(formShare)]).toEqual(['test-component']);

        supply.off();
        expect([...await registry.sharers(formShare)]).toHaveLength(0);
      });
      it('registers field sharer', async () => {

        const supply = formShare.addSharer(defContext);

        expect([...await registry.sharers(fieldShare)]).toEqual(['test-component']);

        supply.off();
        expect([...await registry.sharers(fieldShare)]).toHaveLength(0);
      });
    });

    describe('shareValue', () => {

      let defContext: DefinitionContext;
      let context: ComponentContext;

      beforeEach(async () => {

        @Component({
          name: 'test-component',
          extend: { type: Object },
        })
        class TestComponent {
        }

        const element = new (await testElement(TestComponent))();

        context = await ComponentSlot.of(element).whenReady;
        defContext = context.get(DefinitionContext);
      });

      let form: Form;

      beforeEach(() => {

        const group = inGroup({});

        form = new Form(
            group,
            inFormElement(document.createElement('form'), { form: group }),
        );
        defContext.perComponent(shareValue(formShare, () => form));
      });

      it('shares form', async () => {
        expect(await context.get(formShare)).toBe(form);
      });
      it('shares field', async () => {
        expect(await context.get(fieldShare)).toBe(form);
      });
    });

    function shareValue<T, TComponent extends object>(
        share: ComponentShare<T>,
        provider: (context: ComponentContext<TComponent>) => T | EventKeeper<[T?]>,
        priority?: number,
    ): ContextBuilder<ComponentContext<TComponent>> {
      return SharedByComponent$ContextBuilder(share, provider, priority);
    }
  });
});