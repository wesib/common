import { InGroup } from '@frontmeans/input-aspects';
import { afterAll, consumeEvents } from '@proc7ts/fun-events';
import { Class, Supply } from '@proc7ts/primitives';
import { ComponentClass } from '@wesib/wesib';
import { shareLocator, ShareLocator } from '../shares';
import { Field } from './field';
import { Field$nameByKey } from './field.impl';
import { Form } from './form';
import { FormUnit } from './form-unit';
import { FormShare } from './form.share';
import { SharedField } from './shared-field.decorator';
import { SharedFormUnit } from './shared-form-unit.decorator';
import { SharedForm } from './shared-form.decorator';

/**
 * Builds a {@link SharedForm shared form} definition builder that adds nested form to enclosing one.
 *
 * @typeParam TForm - Nested form type.
 * @typeParam TModel - Nested form model type.
 * @typeParam TElt - A type of nested HTML form element.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Nested form naming definition.
 *
 * @returns Shared form definition builder.
 */
export function FormName<
    TForm extends Form<TModel, TElt>,
    TModel = Form.ModelType<TForm>,
    TElt extends HTMLElement = Form.ElementType<TForm>,
    TClass extends ComponentClass = Class>(
    def?: FieldNameDef,
): SharedForm.Definer<TForm, TModel, TElt, TClass> {
  return FormUnitName<TForm, TModel, Form.Controls<TModel, TElt>, TClass>(def);
}

/**
 * Builds a {@link SharedField shared form field} definition builder that adds the field to enclosing form.
 *
 * @typeParam TField - Field type.
 * @typeParam TValue - Field value type.
 * @typeParam TClass - A type of decorated component class.
 * @param def - Field naming definition.
 *
 * @returns Shared field definition builder.
 */
export function FieldName<
    TField extends Field<TValue>,
    TValue = Field.ValueType<TField>,
    TClass extends ComponentClass = Class>(
    def: FieldNameDef = {},
): SharedField.Definer<TField, TValue, TClass> {
  return FormUnitName<TField, TValue, Field.Controls<TValue>, TClass>(def);
}

function FormUnitName<
    TUnit extends FormUnit<TValue, TControls, any>,
    TValue,
    TControls extends FormUnit.Controls<TValue>,
    TClass extends ComponentClass = Class>(
    def: FieldNameDef = {},
): SharedFormUnit.Definer<TUnit, TValue, TControls, TClass> {
  return ({
    key,
    share,
    locateForm: defaultForm,
    name: defaultName,
  }) => {

    const { name = defaultName } = def;
    let fieldName: string;

    if (name) {
      fieldName = name;
    } else if (name != null) {
      return; // Empty field name. Do not ad it to form.
    } else {

      const autoName = Field$nameByKey(key);

      if (!autoName) {
        return;
      }

      fieldName = autoName;
    }

    const locateForm = shareLocator(def.form || defaultForm, { share: FormShare });

    return {
      componentDef: {
        setup(setup) {
          setup.whenComponent(context => {
            afterAll({
              unit: context.get(share),
              form: locateForm(context),
            }).do(
                consumeEvents(({ unit: [field], form: [form] }): Supply | undefined => {
                  if (!form || !field) {
                    return;
                  }

                  const group = form.control.aspect(InGroup);

                  if (!group) {
                    return;
                  }

                  return group.controls.set(fieldName, field.control);
                }),
            );
          });
        },
      },
    };
  };
}

/**
 * Form field naming definition.
 */
export interface FieldNameDef {

  /**
   * A form to add the field to.
   *
   * This is a shared form locator.
   *
   * Either {@link SharedFieldDef.form predefined}, or {@link FieldShare default} form share is used when omitted.
   */
  readonly form?: ShareLocator<Form>;

  /**
   * Field name.
   *
   * The shared field will be added to the input control group (`InGroup`) within the {@link form target form},
   * unless the name is empty string.
   *
   * Either {@link SharedFieldDef.name predefined}, or property name is used when omitted.
   */
  readonly name?: string;

}
