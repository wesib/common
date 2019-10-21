/**
 * @module @wesib/generic
 */
import { Page } from './page';

/**
 * A key of {@link PageParam.Ref page parameter request} property containing requested page parameter.
 */
export const PageParam__symbol = /*#__PURE__*/ Symbol('page-param');

/**
 * Page navigation parameter.
 *
 * Can applied before navigation happened (i.e. to [[LeavePageEvent]]). Then it will be available to the target page
 * both before and after navigation.
 *
 * @typeparam T  Parameter value type.
 * @typaparam I  Parameter input type.
 */
export abstract class PageParam<T, I> implements PageParam.Ref<T, I> {

  get [PageParam__symbol](): this {
    return this;
  }

  /**
   * Creates page parameter handle.
   *
   * This method is called when {@link Page.put assigning new page parameter}.It is called at most once per request,
   * unless this parameter is assigned already. A {@link PageParam.Handle.put} method will be called instead
   * in the latter case.
   *
   * @param page  A page to assign navigation parameter to.
   * @param input  Parameter input used to construct its initial value.
   *
   * @returns New page parameter value handle.
   */
  abstract create(page: Page, input: I): PageParam.Handle<T, I>;

}

export namespace PageParam {

  /**
   * Page navigation parameter reference.
   *
   * @typeparam T  Parameter value type.
   * @typaparam I  Parameter input type.
   */
  export interface Ref<T, I> {

    /**
     * Referred page navigation parameter instance.
     */
    readonly [PageParam__symbol]: PageParam<T, I>;

  }

  /**
   * Page navigation parameter value handle.
   *
   * Holds and maintains parameter value.
   *
   * Created by {@link PageParam.create} method.
   *
   * @typeparam T  Parameter value type.
   * @typaparam I  Parameter input type.
   */
  export interface Handle<T, I> {

    /**
     * Returns current parameter value.
     *
     * @returns Parameter value.
     */
    get(): T;

    /**
     * Puts page parameter value.
     *
     * This method is called when {@link Page.put re-assigning page parameter}. It is called when page parameter
     * is assigned already and can be used to update it. The update logic is up to the implementation.
     *
     * @param input  Parameter input to use when updating its value.
     */
    put(input: I): void;

    /**
     * Transfers parameter to target page.
     *
     * This is called right before [[LeavePageEvent]] is fired for each parameter handle of current page.
     *
     * @param to  A page to transfer parameter to.
     * @param when  When the transfer happens. Either `pre-open`, or `pre-replace`.
     *
     * @returns New parameter handle instance for target page, or `undefined` if nothing to transfer.
     */
    transfer?(to: Page, when: 'pre-open' | 'pre-replace'): Handle<T, I> | undefined;

    /**
     * This method is called when the page this parameter created for is entered.
     *
     * @param page  Entered page.
     * @param when  When the page is entered. Either `init`, `open`, `replace`, or `return`.
     */
    enter?(page: Page, when: 'init' | 'open' | 'replace' | 'return'): void;

    /**
     * This method is called when the page this parameter created for is left.
     */
    leave?(): void;

    /**
     * This method is called when page navigation aborted and target page won't be reached.
     *
     * The handle won't be accessed after this method call.
     *
     * @param at  The page the browser remains at.
     */
    stay?(at: Page): void;

    /**
     * This method is called when the page this parameter is created for is removed from navigation history.
     *
     * The handle won't be accessed after this method call.
     */
    forget?(): void;

  }

}
