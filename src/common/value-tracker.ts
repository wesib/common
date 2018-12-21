import { EventEmitter, EventInterest, EventProducer } from 'fun-events';

/**
 * Value accessor and changes tracker.
 */
export abstract class ValueTracker<T = any, N extends T = T> {

  /**
   * @internal
   */
  private _by = EventInterest.none;

  /**
   * Value changes event producer.
   *
   * The registered event consumers receive new and old values as arguments.
   */
  abstract readonly on: EventProducer<(this: void, newValue: N, oldValue: T) => void>;

  /**
   * Reads the tracked value.
   *
   * @returns The value.
   */
  abstract get it(): T;

  /**
   * Updates the tracked value.
   *
   * @param value New value.
   */
  abstract set it(value: T);

  /**
   * Bind the tracked value to the `source`.
   *
   * Updates the value when the `source` changes.
   *
   * If the value is already bound to another source, then unbinds from the old source first.
   *
   * @param source The value source.
   */
  by(source: ValueTracker<T>) {
    this.off();
    this._by = source.on(value => this.it = value);
    this.it = source.it;
  }

  /**
   * Unbinds the tracked value from the source.
   *
   * After this call the tracked value won't be updated on the source modification.
   *
   * If the value is not bound then doe nothing.
   */
  off() {
    this._by.off();
    this._by = EventInterest.none;
  }

}

class TrackedValue<T> extends ValueTracker<T> {

  private readonly _on = new EventEmitter<(this: void, newValue: T, oldValue: T) => void>();

  constructor(private _it: T) {
    super();
  }

  get on() {
    return this._on.on;
  }

  get it(): T {
    return this._it;
  }

  set it(value: T) {

    const oldValue = this._it;

    if (oldValue !== value) {
      this._it = value;
      this._on.notify(value, oldValue);
    }
  }

}

/**
 * Constructs a value which changes can be tracked.
 *
 * @param initial Initial value.
 *
 * @returns Value tracker instance.
 */
export function trackValue<T>(initial: T): ValueTracker<T>;

/**
 * Constructs an optional value which changes can be tracked.
 *
 * @param initial Initial value.
 *
 * @returns Value tracker instance.
 */
export function trackValue<T>(initial?: T): ValueTracker<T | undefined>;

export function trackValue<T>(initial: T): ValueTracker<T> {
  return new TrackedValue<T>(initial);
}
