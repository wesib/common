import { InControl, InStyledElement, inValue } from '@frontmeans/input-aspects';
import { afterSupplied, EventEmitter, eventSupply, EventSupply, eventSupplyOf, trackValue } from '@proc7ts/fun-events';
import { bootstrapComponents, Component, ComponentContext, ComponentMount } from '@wesib/wesib';
import { HierarchyContext } from '../hierarchy';
import { ConvertInput, ConvertInputDef } from './convert-input.decorator';
import { InputFromControl, inputFromControl, NoInputFromControl } from './input-from-control';

describe('input', () => {
  describe('@ConvertInput', () => {

    let root: Element;
    let element: Element;

    beforeEach(() => {
      root = document.body.appendChild(document.createElement('root-input'));
      element = root.appendChild(document.createElement('converted-input'));
    });
    afterEach(() => {
      root.remove();
    });

    let rootControl: InControl<string>;

    beforeEach(() => {
      rootControl = inValue('test');
    });

    it('converts enclosing input control', async () => {

      const [{ control }] = await bootstrap(
          ({ control, aspects }) => control.control.convert(
              InStyledElement.to(element),
              aspects,
          ),
      );

      expect(control?.aspect(InStyledElement)).toBe(element);
    });
    it('does not convert enclosing input control when nothing returned', async () => {

      const [{ control }] = await bootstrap(
          () => null,
      );

      expect(control).toBe(rootControl);
    });
    it('converts enclosing input control when keeper returned', async () => {

      const converted = inValue('converted');
      const converter = trackValue(converted);
      const [{ control }] = await bootstrap(
          () => converter,
      );

      expect(control).toBe(converted);
    });
    it('detaches unused converted control', async () => {

      const converted = inValue('converted');
      const converter = trackValue<InControl<any> | undefined>(converted);

      await bootstrap(
          () => converter,
      );

      converter.it = undefined;

      expect(eventSupplyOf(converted).isOff).toBe(true);
    });
    it('cuts off provided supply when control unused', async () => {

      const converted = inValue('converted');
      const supply = eventSupply();
      const converter = new EventEmitter<[InControl<any>?, EventSupply?]>();

      await bootstrap(
          () => afterSupplied<[InControl<any>?, EventSupply?]>(
              converter,
              () => [converted, supply],
          ),
      );

      converter.send();

      expect(supply.isOff).toBe(true);
      expect(eventSupplyOf(converted).isOff).toBe(false);
    });

    async function bootstrap(
        convert: ConvertInputDef,
    ): Promise<[InputFromControl | NoInputFromControl, ComponentMount]> {

      @Component()
      class RootInput {

        constructor(context: ComponentContext) {
          inputFromControl(context, rootControl);
        }

      }

      @ConvertInput(convert)
      class ConvertedInput {}

      const bsContext = await bootstrapComponents(RootInput, ConvertedInput).whenReady();
      const [rootDefContext, defContext] = await Promise.all(([
        bsContext.whenDefined(RootInput),
        bsContext.whenDefined(ConvertedInput),
      ]));

      rootDefContext.mountTo(root);

      const mount = defContext.mountTo(element);
      const control = await mount.context.get(HierarchyContext).get(InputFromControl);

      return [control as InputFromControl, mount];
    }
  });
});
