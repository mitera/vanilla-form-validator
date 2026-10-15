import { FormSettings } from "./types";
export default class FormValidator {
    private form?;
    private settings?;
    private listeners;
    private pendingValidations;
    private messages;
    /**
     * Creates an instance of the form handler with the specified settings and binds it to a form element.
     *
     * @param {HTMLFormElement | string} selector - The form element or the string selector used to identify the form in the DOM.
     * @param {FormSettings} [settings] - Optional configuration settings for initializing the form handler, including validation rules and error handling options.
     * @return {void} Initializes the form handler with the provided form element and settings and prepares it for use.
     */
    constructor(selector: HTMLFormElement | string, settings?: FormSettings);
    /**
     * Load and merge messages from a JSON file into the settings.
     *
     * @param {string} jsonFile - The path of the JSON file containing the messages.
     *
     * @return {Promise<void>} Resolves once the messages have been loaded (errors are logged, not rethrown).
     */
    loadMessages(jsonFile: string): Promise<void>;
    /**
     * Copy the known messages from the given source, ignoring unknown keys and non-string values.
     *
     * @param {Partial<FormMessages>} source - The messages to merge into the current ones.
     * @return {void}
     */
    private mergeMessages;
    /**
     * Initialize the form validation by setting up delegated event listeners (focusout, keyup, change) on the form,
     * so that fields added after the initialization are validated as well.
     * Also adds a listener for form reset event.
     *
     * @return {void}
     */
    private init;
    /**
     * Register an event listener on the form and keep track of it so that it can be removed by destroy().
     *
     * @param {string} type - The event type.
     * @param {EventListener} listener - The listener to register.
     * @return {void}
     */
    private addListener;
    /**
     * Remove all the event listeners registered by the validator.
     *
     * @return {void}
     */
    destroy(): void;
    /**
     * Return the fields to validate, excluding the ones matching the `ignore` setting.
     *
     * @return {HTMLInputElement[]} The fields of the form to validate.
     */
    private getFields;
    /**
     * Check whether the given element is a field of the form that has to be validated.
     *
     * @param {Element} element - The element to check.
     * @return {boolean} True if the element must be validated.
     */
    private isValidatable;
    /**
     * Handles the field validation event triggered by a user action.
     *
     * @param {Event} e - The event object representing the user action.
     * @return {void}
     */
    fieldValidationEvent(e: Event): void;
    /**
     * Re-validate the non-empty fields having an `equalTo` rule that points to the changed field.
     *
     * @param {Element} changedField - The field that has just been changed.
     * @return {void}
     */
    private revalidateDependents;
    /**
     * Validates a field based on its type and any additional rules provided.
     * Asynchronous rules (functions returning a Promise) don't affect the returned value:
     * their error is displayed once they resolve, and they are awaited before submitting the form.
     *
     * @param {HTMLInputElement} field - The input field to be validated.
     * @return {boolean} Returns true if the field is valid, false if it is not.
     */
    validateField(field: HTMLInputElement): boolean;
    /**
     * Validates a field and displays its error, returning the synchronous result and the pending asynchronous one.
     *
     * @param {HTMLInputElement} field - The input field to be validated.
     * @return {FieldValidationResult} The validation result.
     */
    private runFieldValidation;
    /**
     * Return the first validation error of the field, or null if the field is valid.
     *
     * @param {HTMLInputElement} field - The field to validate.
     * @param {Promise<string | null>[]} asyncChecks - Collects the asynchronous rules to evaluate.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getFieldError;
    /**
     * Return the error related to the type and to the HTML attributes of a field with a value.
     *
     * @param {HTMLInputElement} field - The field to validate.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getTypeError;
    /**
     * Validate the value of a numeric field against its `min` and `max` attributes (negative and decimal values allowed).
     *
     * @param {HTMLInputElement} field - The numeric field.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getNumberRangeError;
    /**
     * Read a numeric attribute of a field.
     *
     * @param {HTMLInputElement} field - The field.
     * @param {string} name - The attribute name.
     * @return {number | null} The attribute value, or null if missing or not a number.
     */
    private getNumberAttribute;
    /**
     * Validate the length of a field against its `minlength`/`min` and `maxlength`/`max` attributes.
     *
     * @param {HTMLInputElement} field - The field.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getLengthError;
    /**
     * Return the first error of the custom rules configured for the field in the `fields` setting.
     *
     * @param {HTMLInputElement} field - The field to validate.
     * @param {Promise<string | null>[]} asyncChecks - Collects the asynchronous rules to evaluate.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getRulesError;
    /**
     * Evaluate a single custom rule.
     *
     * @param {HTMLInputElement} field - The field to validate.
     * @param {FormRuleValidation} rule - The rule to evaluate.
     * @param {Promise<string | null>[]} asyncChecks - Collects the rule if it is asynchronous.
     * @return {string | null} The error message, or null if the rule is satisfied (or asynchronous).
     */
    private getRuleError;
    /**
     * Replace the `{0}`, `{1}`... placeholders of a message with the given parameters.
     *
     * @param {string} message - The message.
     * @param {Array<string | number>} params - The values of the placeholders.
     * @return {string} The formatted message.
     */
    private formatMessage;
    /**
     * Find the error element of a field: first inside the form, then in the document if it doesn't belong to another form.
     *
     * @param {string} errorHelpId - The id of the error element.
     * @return {HTMLElement | null} The error element, or null if not found.
     */
    private findErrorElement;
    /**
     * Show or hide the error message of a field and toggle the `errorFieldClass`.
     *
     * @param {HTMLInputElement} field - The field.
     * @param {string | null} errorMessage - The error message, or null if the field is valid.
     * @return {void}
     */
    private displayFieldError;
    /**
     * Hide all the error messages, remove the error classes and discard the pending asynchronous validations.
     *
     * @return {void}
     */
    private clearValidation;
    /**
     * Escapes characters with special meaning in CSS for a given string
     *
     * @param {string} string - The input string to escape CSS special characters
     * @return {string} - The escaped string with CSS special characters properly escaped
     */
    escapeCssMeta(string: string): string;
    /**
     * Find all elements in the DOM with the specified name attribute.
     *
     * @param {string} name - The name attribute value to search for.
     * @return {Array<Element>} - An array of elements matching the given name attribute.
     */
    findByName(name: string): Element[];
    /**
     * Check if the given HTML input element is a radio button or checkbox.
     *
     * @param {HTMLInputElement} element - The HTML input element to be checked.
     * @return {boolean} - True if the element is a radio button or checkbox, false otherwise.
     */
    checkable(element: HTMLInputElement): boolean;
    /**
     * Calculates the length of a value based on the type of HTML input element.
     *
     * @param {string} value - The input value to calculate the length for.
     * @param {HTMLInputElement} element - The input element associated with the value.
     *
     * @return {number} The length of the value based on the type of the input element.
     */
    getLength(value: string, element: HTMLInputElement): number;
    /**
     * Checks if the length of a string or array is greater than or equal to a specified minimum length.
     *
     * @param {string | Array} value - The input value to be checked.
     * @param {HTMLInputElement} element - The HTML input element associated with the value.
     * @param {number} param - The minimum length that the value should have.
     *
     * @return {boolean} Returns true if the length of the input value is greater than or equal to the specified minimum length, false otherwise.
     */
    minlength(value: string, element: HTMLInputElement, param: number): boolean;
    /**
     * Check if the length of the given value is less than or equal to a specified parameter.
     *
     * @param {string} value - The value to check the length of. If value is an array, its length is used. Otherwise, the length is calculated based on the provided element.
     * @param {HTMLInputElement} element - The HTML input element to calculate the length from if value is not an array.
     * @param {number} param - The maximum length allowed.
     *
     * @return {boolean} Returns true if the length of the value is less than or equal to the param, otherwise false.
     */
    maxlength(value: string, element: HTMLInputElement, param: number): boolean;
    /**
     * Checks if the length of a value falls within a specified range.
     *
     * @param {string | Array} value - The value to check the length of. If an array is provided, its length is directly used.
     * @param {HTMLInputElement} element - The input element associated with the value.
     * @param {number[]} param - An array containing two numbers that represent the range limits [minimumLength, maximumLength].
     *
     * @return {boolean} Returns true if the length of the value falls within the specified range, otherwise returns false.
     */
    rangelength(value: string, element: HTMLInputElement, param: number[]): boolean;
    /**
     * Validates the form fields and returns true if all fields are valid.
     * Asynchronous rules are not awaited: use submitAction() to take them into account.
     *
     * @return {boolean} True if all form fields are valid, otherwise false.
     */
    validateForm(): boolean;
    /**
     * Validates if at least one radio button or checkbox with the specified name is checked.
     *
     * @param {string} name - The name of the radio buttons or checkboxes to validate.
     * @return {boolean} - Returns true if at least one radio button or checkbox with the specified name is checked, false otherwise.
     */
    validateCheckboxRadio(name: string): boolean;
    /**
     * Validates if the given text is not empty (whitespace only is considered empty).
     *
     * @param {string} value - The text to be validated.
     * @return {boolean} - True if the text is not empty, false otherwise.
     */
    validateText(value: string): boolean;
    /**
     * Validate the given regular expression against the specified value.
     * As for the HTML `pattern` attribute, the expression must match the whole value; an invalid expression is ignored.
     *
     * @param {string} regExp - The regular expression to validate against.
     * @param {string} value - The value to validate.
     *
     * @returns {boolean} - True if the value matches the regular expression, false otherwise.
     */
    validateRegExp(regExp: string, value: string): boolean;
    /**
     * Validates email address.
     *
     * @param {string} value - The email address to be validated.
     * @return {boolean} - Returns true if the email address is valid, otherwise false.
     */
    validateEmail(value: string): boolean;
    /**
     * Validates the phone number.
     *
     * @param {string} value - The phone number to be validated.
     * @return {boolean} - True if the phone number is valid, false otherwise.
     */
    validatePhone(value: string): boolean;
    /**
     * Validates a URL using a regular expression (localhost and private network addresses are allowed).
     *
     * @param {string} value The URL string to be validated.
     * @return {boolean} true if the input value is a valid URL, false otherwise.
     */
    validateUrl(value: string): boolean;
    /**
     * Validates the date input provided in the HTMLInputElement field.
     *
     * @param {HTMLInputElement} field - The input field to validate for a date format.
     * @return {boolean} Returns true if the input field contains a valid date format that falls within any specified min/max attributes, otherwise false.
     */
    validateDate(field: HTMLInputElement): boolean;
    /**
     * Validates if the given value is a valid number.
     *
     * @param {string} value - The value to be validated as a number.
     * @return {boolean} Returns true if the value is a valid number, otherwise false.
     */
    validateNumber(value: string): boolean;
    /**
     * Checks if a given input contains only numeric digits.
     *
     * @param {string} input - The string to be validated.
     * @return {boolean} Returns true if the input contains only numeric digits, otherwise false.
     */
    validateDigits(value: string): boolean;
    /**
     * Attaches a submit event listener to the form element and prevents the default form submission behavior.
     *
     * @return {void}
     */
    checkSubmit(): void;
    /**
     * Validate the form (awaiting the asynchronous rules) and submit it if valid.
     *
     * @param {HTMLElement | null} [submitter] - The button that triggered the submission, if any.
     * @return {Promise<void>}
     */
    submitAction(submitter?: HTMLElement | null): Promise<void>;
    /**
     * Submit the form natively, sending the name/value of the submitter button
     * and working even if a field named "submit" shadows HTMLFormElement.submit.
     *
     * @param {HTMLFormElement} form - The form to submit.
     * @param {HTMLElement | null} [submitter] - The button that triggered the submission, if any.
     * @return {void}
     */
    private nativeSubmit;
    /**
     * Resets the form: the reset event listener removes the "was-validated" class and hides the error messages.
     *
     * @return {void}
     */
    resetForm(): void;
}
