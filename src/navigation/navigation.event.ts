/**
 * @module @wesib/generic
 */
import { Navigation } from './navigation';
import { Page, TargetPage } from './page';
import { PageParam } from './page-param';

/**
 * Navigation event.
 */
export type NavigationEvent = LeavePageEvent | EnterPageEvent | StayOnPageEvent;

/**
 * Navigation event type.
 */
export const enum NavigationEventType {

  /**
   * {@link EnterPageEvent Enter page event} type.
   */
  EnterPage = 'wesib:enterPage',

  /**
   * {@link LeavePageEvent Leave page event} type.
   */
  LeavePage = 'wesib:leavePage',

  /**
   * {@link StayOnPageEvent Stay on page event} type.
   */
  StayOnPage = 'wesib:stayOnPage',

}

/**
 * An event fired when navigation target reached by entering destination page.
 *
 * @event EnterPageEvent#wesib:enterPage
 */
export class EnterPageEvent extends Event {

  /**
   * When navigation event occurred. Either `open` when opening a new page, `replace` when replacing navigation history
   * entry, or `return` when navigated to previously visited entry in navigation history.
   */
  readonly when: 'open' | 'replace' | 'return';

  /**
   * Entered page.
   */
  readonly to: Page;

  /**
   * Constructs enter page event.
   *
   * @param type  Event type.
   * @param init  Initialization options.
   */
  constructor(type: string, init: EnterPageEventInit) {
    super(type, { ...init, cancelable: false });
    this.when = init.when;
    this.to = init.to;
  }

}

/**
 * {@link EnterPageEvent Enter page event} initialization options.
 */
export interface EnterPageEventInit extends Omit<EventInit, 'cancelable'> {

  /**
   * When navigation event occurred. Either `open` when opening a new page, `replace` when replacing navigation history
   * entry, or `return` when navigated to previously visited entry in navigation history.
   */
  readonly when: 'open' | 'replace' | 'return';

  /**
   * Entered page.
   */
  readonly to: Page;

}

/**
 * An event page fired right before leaving the page in order to navigate to another one.
 *
 * This event can be cancelled in order to prevent actual navigation or history update. The navigation is also
 * cancelled when another navigation initiated by one of the handlers of this event.
 *
 * @event LeavePageEvent#wesib:leavePage
 */
export abstract class LeavePageEvent extends Event {

  /**
   * When navigation event occurred. Either `pre-open` when leaving a page to open a new one, or `pre-replace` when
   * leaving a page to replace it with another history entry.
   */
  readonly when: 'pre-open' | 'pre-replace';

  /**
   * The page to leave.
   */
  readonly from: Page;

  /**
   * Navigation target page.
   */
  readonly to: TargetPage;

  /**
   * Constructs leave page event.
   *
   * @param type  Event type.
   * @param init  Initialization options.
   */
  constructor(type: string, init: LeavePageEventInit) {
    super(type, { ...init, cancelable: true });
    this.when = init.when;
    this.from = init.from;
    this.to = init.to;
  }

  /**
   * Assigns parameter to target page.
   *
   * @param request  Requested page parameter.
   * @param options  Parameter assignment option.
   *
   * @returns `this` instance.
   */
  abstract set<T, O>(request: PageParam.Request<T, O>, options: O): this;

}

/**
 * {@link LeavePageEvent Leave page event} initialization options.
 */
export interface LeavePageEventInit extends Omit<EventInit, 'cancelable'> {

  /**
   * When navigation event occurred. Either `pre-open` when leaving a page to open a new one, or `pre-replace` when
   * leaving a page to replace it with another history entry.
   */
  readonly when: 'pre-open' | 'pre-replace';

  /**
   * The page to leave.
   */
  readonly from: Page;

  /**
   * Navigation target page.
   */
  readonly to: TargetPage;

}

/**
 * An event fired when navigation cancelled or failed.
 *
 * @event StayOnPageEvent#wesib:stayOnPage
 */
export class StayOnPageEvent extends Event {

  /**
   * When navigation event occurred. Always `stay`.
   */
  get when(): 'stay' {
    return 'stay';
  }

  /**
   * The page to stay at.
   */
  readonly from: Page;

  /**
   * Navigation target.
   */
  readonly to: Navigation.URLTarget;

  /**
   * A reason of navigation failure. This is set when navigation failed due to some error.
   */
  readonly reason?: any;

  /**
   * Constructs stay on page event.
   *
   * @param type  Event type.
   * @param init  Initialization options.
   */
  constructor(type: string, init: StayOnPageEventInit) {
    super(type, { ...init, cancelable: true });
    this.from = init.from;
    this.to = init.to;
    this.reason = init.reason;
  }

}

/**
 * {@link StayOnPageEvent Stay on page event} initialization options.
 */
export interface StayOnPageEventInit extends Omit<EventInit, 'cancelable'> {

  /**
   * The page to stay at.
   */
  readonly from: Page;

  /**
   * Navigation target.
   */
  readonly to: Navigation.URLTarget;

  /**
   * A reason of navigation failure. This is set when navigation failed due to some error.
   */
  readonly reason?: any;

}