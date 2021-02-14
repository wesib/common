import { InControl, inFormElement, InFormElement } from '@frontmeans/input-aspects';
import { digAfter } from '@proc7ts/fun-events';
import { ComponentShareable } from '../share';
import { Field } from './field';
import { FormDefaults } from './form-defaults';
import { FormUnit } from './form-unit';

/**
 * User input form.
 *
 * A component {@link FormShare shares} form (e.g. using {@link SharedForm @SharedForm} decorator) to make its
 * accessible by component itself and nested ones. E.g. to add {@link Field fields} to it or submit it.
 *
 * A form may be nested within another one, as it implements a {@link Field} interface.
 *
 * The form instance is not usable until it is bound to its sharer component. The latter is done automatically when the
 * form is shared by {@link FormShare}.
 *
 * @typeParam TModel - A model type of the form, i.e. a type of its control value.
 * @typeParam TElt - A type of HTML form element.
 * @typeParam TSharer - Form sharer component type.
 */
export class Form<TModel = any, TElt extends HTMLElement = HTMLElement, TSharer extends object = any>
    extends FormUnit<TModel, Form.Controls<TModel, TElt>, TSharer>
    implements Form.Controls<TModel, TElt> {

  /**
   * Builds a user input form for the given form control and HTML element.
   *
   * @param control - Submitted control. Typically a container one.
   * @param element - HTML element to create control for.
   * @param options - Form element control options.
   *
   * @returns New form instance.
   */
  static forElement<TModel, TElt extends HTMLElement>(
      control: InControl<TModel>,
      element: TElt,
      options?: Omit<InFormElement.Options, 'form'>,
  ): Form.Controls<TModel, TElt> {
    return {
      control,
      element: inFormElement(element, { ...options, form: control }),
    };
  }

  constructor(
      controls: Form.Controls<TModel, TElt> | Form.Provider<TModel, TElt, TSharer>,
  ) {
    super(Form$provider(() => this, controls));
  }

  /**
   * Form element control.
   *
   * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
   * element issuing a `submit` event.
   */
  get element(): InFormElement<TElt> {
    return this.internals.element;
  }

  toString(): string {
    return 'Form';
  }

}

function Form$provider<TModel, TElt extends HTMLElement, TSharer extends object>(
    form: () => Form<TModel, TElt, TSharer>,
    controls: Form.Controls<TModel, TElt> | Form.Provider<TModel, TElt, TSharer>,
): Form.Provider<TModel, TElt, TSharer> {

  const provider = ComponentShareable.provider(controls);

  return sharer => sharer.get(FormDefaults).rules.do(
      digAfter(defaults => defaults.setupForm(form(), provider(sharer))),
  );
}

export namespace Form {

  /**
   * A model type of the given form.
   *
   * @typeParam TForm - Form type.
   */
  export type ModelType<TForm extends Form<any, any>> = FormUnit.ValueType<TForm>;

  /**
   * HTML form element type of the form.
   *
   * @typeParam TForm - Form type.
   */
  export type ElementType<TForm extends Form<any, any>> = TForm extends Form<any, infer TElt> ? TElt : never;

  /**
   * Form controls.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   */
  export interface Controls<TModel, TElt extends HTMLElement = HTMLElement> extends Field.Controls<TModel> {

    /**
     * Submittable form input control.
     *
     * @typeParam TModel - A model type of the form, i.e. a type of its control value.
     * @typeParam TElt - A type of HTML form element.
     */
    readonly control: InControl<TModel>;

    /**
     * Form element control.
     *
     * Unlike {@link control input control} this one is not supposed to be submitted, but rather contains a `<form>`
     * element issuing a `submit` event.
     */
    readonly element: InFormElement<TElt>;

  }

  /**
   * Form controls provider signature.
   *
   * @typeParam TModel - A model type of the form, i.e. a type of its control value.
   * @typeParam TElt - A type of HTML form element.
   * @typeParam TSharer - Form sharer component type.
   */
  export type Provider<TModel = any, TElt extends HTMLElement = HTMLElement, TSharer extends object = object> =
      ComponentShareable.Provider<Controls<TModel, TElt>, TSharer>;

}
