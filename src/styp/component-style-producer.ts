/**
 * @module @wesib/generic
 */
import { ContextRequest, ContextTarget, SingleContextKey } from 'context-values';
import { EventInterest } from 'fun-events';
import { StypOptions, StypRules } from 'style-producer';

/**
 * Component style producer function interface.
 */
export type ComponentStyleProducer =
/**
 * @param rules  CSS rules to produce stylesheets for. This can be e.g. a `StypRule.rules` to render all rules,
 * or a result of `StypRuleList.grab()` method call to render only matching ones.
 * @param opts  Production options.
 *
 * @returns Event interest instance. When this interest is lost (i.e. its `off()` method is called) the produced
 * stylesheets are removed.
 */
    (
        rules: StypRules,
        opts?: StypOptions,
    ) => EventInterest;

/**
 * A key of component context value containing a component style producer.
 */
export const ComponentStyleProducer: ContextTarget<ComponentStyleProducer> & ContextRequest<ComponentStyleProducer> =
    /*#__PURE__*/ new SingleContextKey<ComponentStyleProducer>('component-style-producer');
