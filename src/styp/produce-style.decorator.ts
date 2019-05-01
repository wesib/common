import { ComponentClass, ComponentDef } from '@wesib/wesib';
import { StypRules } from 'style-producer';
import { ComponentStypOptions } from './component-styp-options';
import { StyleProducerSupport } from './style-producer-support.feature';

/**
 * A decorator of component property returning CSS rules to produce.
 *
 * Decorated property value should either contain a CSS rules source of type `StypRules.Source` or be a method
 * returning it.
 *
 * This decorator automatically enables `StyleProducerSupport` feature.
 *
 * Utilizes `ComponentStypOptions.produce()` function to produce CSS stylesheets.
 *
 * @param options Non-mandatory CSS style production options.
 *
 * @returns Component property decorator.
 */
export function ProduceStyle<T extends ComponentClass>(options?: ComponentStypOptions):
    <V extends StypRules.Source | (() => StypRules.Source)>(
        target: InstanceType<T>,
        propertyKey: string | symbol,
        descriptor?: TypedPropertyDescriptor<V>) => any | void {
  return (target: InstanceType<T>, propertyKey: string | symbol) => {

    const componentType = target.constructor as T;

    ComponentDef.define(
        componentType,
        {
          define(defContext) {
            defContext.onComponent(componentContext => {
              componentContext.whenReady(() => {

                const component = componentContext.component;
                const property = component[propertyKey];

                ComponentStypOptions.produce(
                    componentContext,
                    typeof property === 'function' ? property.bind(component) : property,
                    options);
              });
            });
          },
          feature: {
            needs: [StyleProducerSupport],
          },
        });
  };
}
