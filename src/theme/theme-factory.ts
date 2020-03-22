/**
 * @packageDocumentation
 * @module @wesib/generic/styp
 */
import { ContextKey, ContextKey__symbol, SingleContextKey } from '@proc7ts/context-values';
import { Theme } from './theme';

/**
 * @internal
 */
const ThemeFactory__key = new SingleContextKey<ThemeFactory>('theme-factory');

export abstract class ThemeFactory {

  static get [ContextKey__symbol](): ContextKey<ThemeFactory> {
    return ThemeFactory__key;
  }

  abstract newTheme(): Theme;

}
