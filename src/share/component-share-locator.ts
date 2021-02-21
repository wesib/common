import { AfterEvent } from '@proc7ts/fun-events';
import { ComponentContext } from '@wesib/wesib';
import { ComponentShare__symbol, ComponentShareRef, isComponentShareRef } from './component-share-ref';

/**
 * Shared value locator.
 *
 * Can be one of:
 *
 * - component share {@link ComponentShareRef reference},
 * - shared value locator specified {@link ComponentShareLocator.Spec},
 * - {@link ComponentShareLocator.CustomWithFallback custom} shared value locator, or
 * - `null`/`undefined` to locate a fallback share.
 *
 * A {@link componentShareLocator} function can be used to convert arbitrary locator to a function.
 *
 * @typeParam T - Shared value type.
 */
export type ComponentShareLocator<T> =
    | ComponentShareRef<T>
    | ComponentShareLocator.Spec<T>
    | ComponentShareLocator.CustomWithFallback<T>
    | null
    | undefined;

/**
 * Converts mandatory shared value locator to locator function.
 *
 * @typeParam T - Shared value type.
 * @param locator - Shared value locator to convert.
 * @param defaultOptions - Default shared value locator options.
 *
 * @returns Shared value locator function.
 */
export function componentShareLocator<T>(
    locator: ComponentShareLocator.Mandatory<T>,
    defaultOptions?: ComponentShareLocator.Options,
): ComponentShareLocator.Fn<T>;

/**
 * Converts arbitrary shared value locator to locator function.
 *
 * @typeParam T - Shared value type.
 * @param locator - Shared value locator to convert.
 * @param defaultSpec - Default shared value locator specifier including fallback share reference.
 *
 * @returns Shared value locator function.
 */
export function componentShareLocator<T>(
    locator: ComponentShareLocator<T>,
    defaultSpec: ComponentShareLocator.MandatorySpec<T>,
): ComponentShareLocator.Fn<T>;

export function componentShareLocator<T>(
    locator:
        | ComponentShareRef<T>
        | Partial<ComponentShareLocator.MandatorySpec<T>>
        | ComponentShareLocator.CustomWithFallback<T>
        | null
        | undefined,
    defaultSpec: ComponentShareLocator.Spec<T> = {},
): ComponentShareLocator.Fn<T> {
  if (isComponentShareRef(locator)) {

    const share = locator[ComponentShare__symbol];

    return (consumer, options = {}) => {

      const { self = defaultSpec.self } = options;

      return share.valueFor(consumer, { self });
    };
  }

  if (typeof locator === 'function') {

    const { self: selfByDefault = false, share: shareByDefault } = defaultSpec;

    return (consumer, options = {}) => {

      const { share = shareByDefault!, self = selfByDefault } = options;

      return locator(consumer, { share, self });
    };
  }

  const { share: shareRef = defaultSpec.share!, self: selfByDefault = defaultSpec.self } = locator || {};
  const share = shareRef[ComponentShare__symbol];

  return (consumer, options = {}) => {

    const { self = selfByDefault } = options;

    return share.valueFor(consumer, { self });
  };
}

export namespace ComponentShareLocator {

  /**
   * Mandatory shared value locator.
   *
   * Can be one of:
   *
   * - component share {@link ComponentShareRef reference},
   * - shared value locator specified {@link ComponentShareLocator.Spec}, or
   * - {@link ComponentShareLocator.Custom custom} shared value locator.
   *
   * A {@link componentShareLocator} function can be used to convert arbitrary locator to a function.
   *
   * @typeParam T - Shared value type.
   */
  export type Mandatory<T> =
      | ComponentShareRef<T>
      | MandatorySpec<T>
      | Custom<T>;

  /**
   * Shared value location options.
   */
  export interface Options {

    /**
     * Whether to include the consumer component itself into the search.
     *
     * `false` by default, which means the search would start from consumer's parent.
     */
    readonly self?: boolean;

  }

  /**
   * Shared value locator specifier.
   *
   * @typeParam T - Share value type.
   */
  export interface Spec<T> extends Options {

    /**
     * Target share.
     */
    readonly share?: ComponentShareRef<T>;

  }

  /**
   * Mandatory shared value locator specifier.
   *
   * @typeParam T - Share value type.
   */
  export interface MandatorySpec<T> extends Spec<T> {

    /**
     * Target share.
     */
    readonly share: ComponentShareRef<T>;

  }

  /**
   * Signature of custom shared value locator.
   *
   * @typeParam T - Shared value type.
   * @typeParam consumer - Consumer component context.
   * @typeParam options - Shared value location options.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
  export type Custom<T> =
  /**
   * @param consumer - Consumer component context.
   * @param options - Shared value location options.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
      (
          this: void,
          consumer: ComponentContext,
          options: Required<Options>,
      ) => AfterEvent<[] | [T, ComponentContext]>;

  /**
   * Signature of custom shared value locator that expects a fallback share reference to be specified.
   *
   * @typeParam T - Shared value type.
   */
  export type CustomWithFallback<T> =
  /**
   * @param consumer - Consumer component context.
   * @param options - Shared value location options, including fallback share reference.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
      (
          this: void,
          consumer: ComponentContext,
          options: Required<MandatorySpec<T>>,
      ) => AfterEvent<[] | [T, ComponentContext]>;

  /**
   * Signature of shared value locator function.
   *
   * Can be constructed by {@link componentShareLocator} function.
   *
   * @typeParam T - Shared value type.
   */
  export type Fn<T> =
  /**
   * @param consumer - Consumer component context.
   * @param options - Shared value location options.
   *
   * @returns An `AfterEvent` keeper of the shared value and its sharer context, if found.
   */
      (
          this: void,
          consumer: ComponentContext,
          defaultSpec?: Partial<Spec<T>>,
      ) => AfterEvent<[] | [T, ComponentContext]>;

}
