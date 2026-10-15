- <a name="2.1.0"></a>
# 2.1.0 (2026-10-15)
### Bug fixes
- Fix crash/duplicated error elements with field names or ids containing CSS special characters (ex. `user[email]`, `user.name`): error elements are now looked up by id inside the form, so two forms with the same field names don't share error messages.
- The `pattern` attribute must match the whole value, as in HTML (`[0-9]{3}` no longer accepts `abc123xyz`); an invalid pattern is ignored instead of throwing.
- Native submission works even if a field named `submit` exists and sends the name/value of the submit button.
- `1970-01-01` is now a valid date.
- `number`/`range` inputs: `min`/`max` support negative and decimal values and are compared without truncating decimals.
- `disabled` fields (also inside a disabled `fieldset`) are no longer validated.
- Fix `min`/`max` default messages.
- Form reset hides the error messages and removes `errorFieldClass`.
- Custom rules run on `select` and `file` fields without value (ex. `minlength` on a multiple select with no option selected).
- Rules with `min`/`max` set to `0` are no longer ignored.
- When `minlength` fails, a following `maxlength` check no longer resets the validity.
- Whitespace-only values don't satisfy `required`.
- URLs with `localhost`, private network addresses and uppercase letters are valid.
- Messages (settings or `loadMessages`) are merged only for known keys with string values; `loadMessages` handles HTTP errors.
- Add the missing `phone`, `file`, `regExp` (and `remote` for German) translations to the localization files.

### Features
- Custom rule `method` can return a `Promise<boolean>`: the error is displayed when resolved and the submission waits for pending checks.
- The field referenced by `equalTo` re-validates the dependent field when it changes.
- Delegated listeners on the form: fields added after the initialization are validated; new `destroy()` method.
- `submitHandler(form, submitter)` receives the form and the submit button; `submitAction` and `loadMessages` return a `Promise`.
- `messages` setting typed as `Partial<FormMessages>`.

- <a name="2.0.2"></a>
# 2.0.2 (2025-12-06)
- Update README: update `fields` to `rules`, change `rules` description to indicate it's an array instead of an object.

- <a name="2.0.1"></a>
# 2.0.1 (2025-12-04)
- Refactor `method` property in validation rules to support function types, remove deprecated `custom` method, update documentation and type definitions, and improve internal validation logic.

<a name="2.0.0"></a>
# 2.0.0 (2025-12-04)
- Refactor the validation logic to use `fields` instead of `rules` in `FormSettings` to improve clarity and hierarchy, add more validations to each fields with their own error message.

<a name="1.1.1"></a>
# 1.1.1 (2025-06-02)

### release summary
- Refactor `FormValidator` to support `HTMLFormElement` as a constructor parameter, improve null safety

<a name="1.1.0"></a>
# 1.1.0 (2025-06-02)

### release summary
- Update version to 1.1.0

<a name="1.0.8"></a>
# 1.0.8 (2025-06-02)

### release summary
- Update `FormValidator` global name

<a name="1.0.7"></a>
# 1.0.7 (2025-05-31)

### release summary
- Make `messages` optional in `FormSettings`

<a name="1.0.6"></a>
# 1.0.6 (2025-05-31)

### release summary
- "Refactor and modularize form validator setup, add TypeScript support"

<a name="1.0.5"></a>
# 1.0.5 (2025-05-13)

### release summary
- Add RegExp validation support and refactor submit handling

<a name="1.0.4"></a>
# 1.0.4 (2025-03-09)

### release summary

- Remove error field class from all elements on selection

<a name="1.0.3"></a>
# 1.0.3 (2025-01-31)

### release summary

- Add regex validation for form fields with patterns

<a name="1.0.2"></a>
# 1.0.2 (2025-01-12)

### release summary

- Generate new dist files

<a name="1.0.1"></a>
# 1.0.1 (2025-01-12)

### release summary

- Refactor error message element logic to handle field IDs or names dynamically. 
- Fix typos and enhance clarity in documentation.

<a name="1.0.0"></a>
# 1.0.0 (2025-01-11)

### release summary

- first release
- documentation update

<a name="0.0.1"></a>
# 0.0.1 (2025-01-01)

### release summary

- initial release