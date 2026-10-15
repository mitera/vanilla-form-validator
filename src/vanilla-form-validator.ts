import {FormMessages, FormRuleValidation, FormSettings} from "./types";

const FIELD_SELECTOR = 'input[name], textarea, select';

interface FieldValidationResult {
    valid: boolean;
    pending?: Promise<boolean>;
}

export default class FormValidator {

    private form?: HTMLFormElement;
    private settings?: FormSettings;
    private listeners: [string, EventListener][] = [];
    private pendingValidations = new Map<HTMLInputElement, Promise<boolean>>();
    private messages: FormMessages = {
        required: 'This field is required.',
        remote: 'Please fix this field.',
        email: 'Please enter a valid email address.',
        url: 'Please enter a valid URL.',
        date: 'Please enter a valid date.',
        number: 'Please enter a valid number.',
        phone: 'Please enter a valid phone.',
        file: 'Please select a file.',
        equalTo: 'Please enter the same value again.',
        maxlength: 'Please enter no more than {0} characters.',
        minlength: 'Please enter at least {0} characters.',
        rangelength: 'Please enter a value between {0} and {1} characters long',
        max: 'Please enter a value less than or equal to {0}.',
        min: 'Please enter a value greater than or equal to {0}.',
        range: 'Please enter a value between {0} and {1}',
        regExp: 'Please enter a value matching the requested format.'
    }

    /**
     * Creates an instance of the form handler with the specified settings and binds it to a form element.
     *
     * @param {HTMLFormElement | string} selector - The form element or the string selector used to identify the form in the DOM.
     * @param {FormSettings} [settings] - Optional configuration settings for initializing the form handler, including validation rules and error handling options.
     * @return {void} Initializes the form handler with the provided form element and settings and prepares it for use.
     */
    constructor(selector: HTMLFormElement | string, settings?: FormSettings) {
        if (typeof selector === 'string') {
            this.form = <HTMLFormElement>document.querySelector(selector);
        } else if (typeof selector === 'object') {
            this.form = selector;
        }
        if (this.form) {

            let default_settings: FormSettings = {
                ignore: null,
                fields: null,
                errorElement: 'p',
                errorClass: 'error',
                errorFieldClass: null,
                validFormClass: 'was-validated',
                submitHandler: null
            }

            this.settings = {...default_settings, ...settings} as FormSettings;

            this.mergeMessages(this.settings.messages);
            this.settings.messages = this.messages;

            this.init();
        }
    }

    /**
     * Load and merge messages from a JSON file into the settings.
     *
     * @param {string} jsonFile - The path of the JSON file containing the messages.
     *
     * @return {Promise<void>} Resolves once the messages have been loaded (errors are logged, not rethrown).
     */
    loadMessages(jsonFile: string): Promise<void> {
        return fetch(jsonFile)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Unable to load messages from ' + jsonFile + ' (HTTP ' + response.status + ')');
                }
                return response.json();
            })
            .then(data => {
                if (this.settings && data) {
                    this.mergeMessages(data.messages);
                }
            })
            .catch(error => console.log(error));
    }

    /**
     * Copy the known messages from the given source, ignoring unknown keys and non-string values.
     *
     * @param {Partial<FormMessages>} source - The messages to merge into the current ones.
     * @return {void}
     */
    private mergeMessages(source?: Partial<FormMessages> | null) {
        if (!source || typeof source !== 'object') {
            return;
        }
        (Object.keys(this.messages) as (keyof FormMessages)[]).forEach(key => {
            const value = source[key];
            if (Object.prototype.hasOwnProperty.call(source, key) && typeof value === 'string') {
                this.messages[key] = value;
            }
        });
    }

    /**
     * Initialize the form validation by setting up delegated event listeners (focusout, keyup, change) on the form,
     * so that fields added after the initialization are validated as well.
     * Also adds a listener for form reset event.
     *
     * @return {void}
     */
    private init() {
        if (this.form) {
            this.form.setAttribute('novalidate', '');

            this.checkSubmit();

            ['focusout', 'keyup', 'change'].forEach(type => {
                this.addListener(type, e => this.fieldValidationEvent(e));
            });

            this.addListener('reset', () => this.clearValidation());
        }
    }

    /**
     * Register an event listener on the form and keep track of it so that it can be removed by destroy().
     *
     * @param {string} type - The event type.
     * @param {EventListener} listener - The listener to register.
     * @return {void}
     */
    private addListener(type: string, listener: EventListener) {
        if (this.form) {
            this.form.addEventListener(type, listener);
            this.listeners.push([type, listener]);
        }
    }

    /**
     * Remove all the event listeners registered by the validator.
     *
     * @return {void}
     */
    destroy() {
        const form = this.form;
        if (form) {
            this.listeners.forEach(([type, listener]) => form.removeEventListener(type, listener));
            form.removeAttribute('novalidate');
        }
        this.listeners = [];
        this.pendingValidations.clear();
    }

    /**
     * Return the fields to validate, excluding the ones matching the `ignore` setting.
     *
     * @return {HTMLInputElement[]} The fields of the form to validate.
     */
    private getFields() {
        if (!this.form) {
            return [];
        }
        let fields = Array.from(this.form.querySelectorAll(FIELD_SELECTOR));
        if (this.settings && this.settings.ignore) {
            let ignoreFields = Array.from(this.form.querySelectorAll(this.settings.ignore));
            fields = fields.filter(element => !ignoreFields.includes(element));
        }
        return fields as HTMLInputElement[];
    }

    /**
     * Check whether the given element is a field of the form that has to be validated.
     *
     * @param {Element} element - The element to check.
     * @return {boolean} True if the element must be validated.
     */
    private isValidatable(element: Element) {
        if (!this.form || !this.form.contains(element) || !element.matches(FIELD_SELECTOR)) {
            return false;
        }
        return !(this.settings && this.settings.ignore && element.matches(this.settings.ignore));
    }

    /**
     * Handles the field validation event triggered by a user action.
     *
     * @param {Event} e - The event object representing the user action.
     * @return {void}
     */
    fieldValidationEvent(e: Event) {
        const field = e.target;
        if (!(field instanceof Element) || !this.isValidatable(field)) {
            return;
        }
        this.validateField(<HTMLInputElement>field);
        this.revalidateDependents(field);
    }

    /**
     * Re-validate the non-empty fields having an `equalTo` rule that points to the changed field.
     *
     * @param {Element} changedField - The field that has just been changed.
     * @return {void}
     */
    private revalidateDependents(changedField: Element) {
        if (!this.settings || !this.settings.fields) {
            return;
        }
        this.settings.fields.forEach(fieldSetting => {
            const dependsOnChangedField = fieldSetting.name && fieldSetting.rules && fieldSetting.rules.some(rule =>
                rule.method === 'equalTo' && rule.field && changedField.matches(rule.field)
            );
            if (dependsOnChangedField) {
                this.findByName(<string>fieldSetting.name).forEach(dependent => {
                    if (dependent !== changedField && (<HTMLInputElement>dependent).value !== '' && this.isValidatable(dependent)) {
                        this.validateField(<HTMLInputElement>dependent);
                    }
                });
            }
        });
    }

    /**
     * Validates a field based on its type and any additional rules provided.
     * Asynchronous rules (functions returning a Promise) don't affect the returned value:
     * their error is displayed once they resolve, and they are awaited before submitting the form.
     *
     * @param {HTMLInputElement} field - The input field to be validated.
     * @return {boolean} Returns true if the field is valid, false if it is not.
     */
    validateField(field: HTMLInputElement) {
        return this.runFieldValidation(field).valid;
    }

    /**
     * Validates a field and displays its error, returning the synchronous result and the pending asynchronous one.
     *
     * @param {HTMLInputElement} field - The input field to be validated.
     * @return {FieldValidationResult} The validation result.
     */
    private runFieldValidation(field: HTMLInputElement): FieldValidationResult {
        this.pendingValidations.delete(field);
        if (field.matches(':disabled')) {
            this.displayFieldError(field, null);
            return {valid: true};
        }
        const customErrorMessage = field.dataset.errorMessage;
        const asyncChecks: Promise<string | null>[] = [];
        let errorMessage = this.getFieldError(field, asyncChecks);
        if (errorMessage !== null && customErrorMessage) {
            errorMessage = customErrorMessage;
        }
        this.displayFieldError(field, errorMessage);
        if (errorMessage !== null || asyncChecks.length === 0) {
            return {valid: errorMessage === null};
        }

        const pending: Promise<boolean> = Promise.all(asyncChecks)
            .then(results => {
                const asyncError = results.find(result => result !== null);
                return asyncError === undefined ? null : asyncError;
            })
            .catch(() => this.messages.remote)
            .then(asyncError => {
                const message = asyncError !== null && customErrorMessage ? customErrorMessage : asyncError;
                // Ignore the outcome of a validation superseded by a newer one
                if (this.pendingValidations.get(field) === pending) {
                    this.pendingValidations.delete(field);
                    this.displayFieldError(field, message);
                }
                return message === null;
            });
        this.pendingValidations.set(field, pending);
        return {valid: true, pending};
    }

    /**
     * Return the first validation error of the field, or null if the field is valid.
     *
     * @param {HTMLInputElement} field - The field to validate.
     * @param {Promise<string | null>[]} asyncChecks - Collects the asynchronous rules to evaluate.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getFieldError(field: HTMLInputElement, asyncChecks: Promise<string | null>[]): string | null {
        const fieldValue = field.value;
        if (field.hasAttribute('required')) {
            const filled = this.checkable(field) ? this.validateCheckboxRadio(field.name) : this.validateText(fieldValue);
            if (!filled) {
                return this.messages.required;
            }
        }
        if (fieldValue !== '') {
            const typeError = this.getTypeError(field);
            if (typeError !== null) {
                return typeError;
            }
            if (field.pattern && !this.validateRegExp(field.pattern, fieldValue)) {
                return this.messages.regExp;
            }
        }
        // Count based rules (selected options, checked boxes, files) must run even if the field has no value
        const countable = this.checkable(field) || field.nodeName.toLowerCase() === 'select' || field.type === 'file';
        if (fieldValue !== '' || countable) {
            return this.getRulesError(field, asyncChecks);
        }
        return null;
    }

    /**
     * Return the error related to the type and to the HTML attributes of a field with a value.
     *
     * @param {HTMLInputElement} field - The field to validate.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getTypeError(field: HTMLInputElement): string | null {
        const fieldValue = field.value;
        switch (field.type) {
            case 'email':
                return this.validateEmail(fieldValue) ? null : this.messages.email;
            case 'tel':
                return this.validatePhone(fieldValue) ? null : this.messages.phone;
            case 'url':
                return this.validateUrl(fieldValue) ? null : this.messages.url;
            case 'file':
                return (field.files && field.files.length > 0) ? null : this.messages.file;
            case 'date':
                return this.validateDate(field) ? null : this.messages.date;
            case 'number':
            case 'range':
                return this.getNumberRangeError(field);
            default:
                return this.getLengthError(field);
        }
    }

    /**
     * Validate the value of a numeric field against its `min` and `max` attributes (negative and decimal values allowed).
     *
     * @param {HTMLInputElement} field - The numeric field.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getNumberRangeError(field: HTMLInputElement): string | null {
        const value = Number(field.value);
        if (!isFinite(value)) {
            return this.messages.number;
        }
        const min = this.getNumberAttribute(field, 'min');
        const max = this.getNumberAttribute(field, 'max');
        const tooLow = min !== null && value < min;
        const tooHigh = max !== null && value > max;
        if (!tooLow && !tooHigh) {
            return null;
        }
        if (min !== null && max !== null) {
            return this.formatMessage(this.messages.range, min, max);
        }
        return tooLow ? this.formatMessage(this.messages.min, <number>min) : this.formatMessage(this.messages.max, <number>max);
    }

    /**
     * Read a numeric attribute of a field.
     *
     * @param {HTMLInputElement} field - The field.
     * @param {string} name - The attribute name.
     * @return {number | null} The attribute value, or null if missing or not a number.
     */
    private getNumberAttribute(field: HTMLInputElement, name: string) {
        const attribute = field.getAttribute(name);
        if (attribute === null || attribute.trim() === '') {
            return null;
        }
        const value = Number(attribute);
        return isFinite(value) ? value : null;
    }

    /**
     * Validate the length of a field against its `minlength`/`min` and `maxlength`/`max` attributes.
     *
     * @param {HTMLInputElement} field - The field.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getLengthError(field: HTMLInputElement): string | null {
        const minlength = field.getAttribute('minlength') || field.getAttribute('min');
        const maxlength = field.getAttribute('maxlength') || field.getAttribute('max');
        const min = minlength && this.validateDigits(minlength) ? parseInt(minlength) : null;
        const max = maxlength && this.validateDigits(maxlength) ? parseInt(maxlength) : null;
        const length = this.getLength(field.value, field);
        const tooShort = min !== null && length < min;
        const tooLong = max !== null && length > max;
        if (!tooShort && !tooLong) {
            return null;
        }
        if (min !== null && max !== null) {
            const message = field.getAttribute('max') && field.getAttribute('min') ? this.messages.range : this.messages.rangelength;
            return this.formatMessage(message, min, max);
        }
        if (tooShort) {
            return this.formatMessage(field.getAttribute('min') ? this.messages.min : this.messages.minlength, <number>min);
        }
        return this.formatMessage(field.getAttribute('max') ? this.messages.max : this.messages.maxlength, <number>max);
    }

    /**
     * Return the first error of the custom rules configured for the field in the `fields` setting.
     *
     * @param {HTMLInputElement} field - The field to validate.
     * @param {Promise<string | null>[]} asyncChecks - Collects the asynchronous rules to evaluate.
     * @return {string | null} The error message, or null if the field is valid.
     */
    private getRulesError(field: HTMLInputElement, asyncChecks: Promise<string | null>[]): string | null {
        if (!this.settings || !this.settings.fields) {
            return null;
        }
        for (const fieldSetting of this.settings.fields) {
            if (fieldSetting.name !== field.name || !fieldSetting.rules) {
                continue;
            }
            for (const rule of fieldSetting.rules) {
                const error = this.getRuleError(field, rule, asyncChecks);
                if (error !== null) {
                    return error;
                }
            }
        }
        return null;
    }

    /**
     * Evaluate a single custom rule.
     *
     * @param {HTMLInputElement} field - The field to validate.
     * @param {FormRuleValidation} rule - The rule to evaluate.
     * @param {Promise<string | null>[]} asyncChecks - Collects the rule if it is asynchronous.
     * @return {string | null} The error message, or null if the rule is satisfied (or asynchronous).
     */
    private getRuleError(field: HTMLInputElement, rule: FormRuleValidation, asyncChecks: Promise<string | null>[]): string | null {
        const fieldValue = field.value;
        if (typeof rule.method === 'function') {
            const message = rule.errorMessage ? rule.errorMessage : this.messages.remote;
            const result = rule.method(fieldValue, field);
            if (result && typeof result.then === 'function') {
                asyncChecks.push(Promise.resolve(result).then(valid => valid ? null : message));
                return null;
            }
            return result ? null : message;
        }
        const min = rule.min;
        const max = rule.max;
        switch (rule.method) {
            case 'equalTo':
                if (rule.field && this.form) {
                    const equalToField = this.form.querySelector<HTMLInputElement>(rule.field);
                    if (equalToField && fieldValue !== equalToField.value) {
                        return rule.errorMessage ? rule.errorMessage : this.messages.equalTo;
                    }
                }
                return null;
            case 'minlength':
                if (min === null || min === undefined || this.minlength(fieldValue, field, min)) {
                    return null;
                }
                return this.formatMessage(rule.errorMessage ? rule.errorMessage : (field.getAttribute('min') ? this.messages.min : this.messages.minlength), min);
            case 'maxlength':
                if (max === null || max === undefined || this.maxlength(fieldValue, field, max)) {
                    return null;
                }
                return this.formatMessage(rule.errorMessage ? rule.errorMessage : (field.getAttribute('max') ? this.messages.max : this.messages.maxlength), max);
            case 'rangelength':
                if (min === null || min === undefined || max === null || max === undefined || this.rangelength(fieldValue, field, [min, max])) {
                    return null;
                }
                return this.formatMessage(rule.errorMessage ? rule.errorMessage : (field.getAttribute('max') && field.getAttribute('min') ? this.messages.range : this.messages.rangelength), min, max);
        }
        return null;
    }

    /**
     * Replace the `{0}`, `{1}`... placeholders of a message with the given parameters.
     *
     * @param {string} message - The message.
     * @param {Array<string | number>} params - The values of the placeholders.
     * @return {string} The formatted message.
     */
    private formatMessage(message: string, ...params: (string | number)[]) {
        return params.reduce<string>((result, param, index) => result.split('{' + index + '}').join(String(param)), message);
    }

    /**
     * Find the error element of a field: first inside the form, then in the document if it doesn't belong to another form.
     *
     * @param {string} errorHelpId - The id of the error element.
     * @return {HTMLElement | null} The error element, or null if not found.
     */
    private findErrorElement(errorHelpId: string) {
        if (!this.form) {
            return null;
        }
        const inForm = this.form.querySelector<HTMLElement>('[id="' + this.escapeCssMeta(errorHelpId) + '"]');
        if (inForm) {
            return inForm;
        }
        const inDocument = document.getElementById(errorHelpId);
        if (inDocument) {
            const parentForm = inDocument.closest('form');
            if (!parentForm || parentForm === this.form) {
                return inDocument;
            }
        }
        return null;
    }

    /**
     * Show or hide the error message of a field and toggle the `errorFieldClass`.
     *
     * @param {HTMLInputElement} field - The field.
     * @param {string | null} errorMessage - The error message, or null if the field is valid.
     * @return {void}
     */
    private displayFieldError(field: HTMLInputElement, errorMessage: string | null) {
        const isValid = errorMessage === null;
        const fieldId = this.checkable(field) ? field.name : (field.id ? field.id : field.name);
        const errorHelpId = fieldId + '-error';
        let errorHelp = this.findErrorElement(errorHelpId);
        if (!errorHelp && !isValid && this.settings) {
            errorHelp = document.createElement(this.settings.errorElement ? this.settings.errorElement : 'p');
            errorHelp.className = this.settings.errorClass ? this.settings.errorClass : 'error';
            errorHelp.id = errorHelpId;
            field.insertAdjacentElement('afterend', errorHelp);
        }
        if (errorHelp) {
            if (isValid) {
                errorHelp.style.setProperty('display', 'none');
            } else {
                errorHelp.innerText = <string>errorMessage;
                errorHelp.style.setProperty('display', '');
            }
        }
        const errorFieldClass = this.settings ? this.settings.errorFieldClass : null;
        if (errorFieldClass) {
            if (isValid) {
                const group = this.checkable(field) ? this.findByName(field.name) : [field];
                group.forEach(item => item.classList.remove(errorFieldClass));
            } else {
                field.classList.add(errorFieldClass);
            }
        }
    }

    /**
     * Hide all the error messages, remove the error classes and discard the pending asynchronous validations.
     *
     * @return {void}
     */
    private clearValidation() {
        this.pendingValidations.clear();
        if (this.form && this.settings && this.settings.validFormClass) {
            this.form.classList.remove(this.settings.validFormClass);
        }
        this.getFields().forEach(field => this.displayFieldError(field, null));
    }

    /**
     * Escapes characters with special meaning in CSS for a given string
     *
     * @param {string} string - The input string to escape CSS special characters
     * @return {string} - The escaped string with CSS special characters properly escaped
     */
    escapeCssMeta (string: string) {
        if ( string === undefined ) {
            return "";
        }
        return string.replace( /([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1" );
    }

    /**
     * Find all elements in the DOM with the specified name attribute.
     *
     * @param {string} name - The name attribute value to search for.
     * @return {Array<Element>} - An array of elements matching the given name attribute.
     */
    findByName(name: string) {
        return Array.from((this.form) ? this.form.querySelectorAll( "[name='" + this.escapeCssMeta(name) + "']" ) : []);
    }

    /**
     * Check if the given HTML input element is a radio button or checkbox.
     *
     * @param {HTMLInputElement} element - The HTML input element to be checked.
     * @return {boolean} - True if the element is a radio button or checkbox, false otherwise.
     */
    checkable(element: HTMLInputElement) {
        return (/radio|checkbox/i).test( element.type );
    }

    /**
     * Calculates the length of a value based on the type of HTML input element.
     *
     * @param {string} value - The input value to calculate the length for.
     * @param {HTMLInputElement} element - The input element associated with the value.
     *
     * @return {number} The length of the value based on the type of the input element.
     */
    getLength(value: string, element: HTMLInputElement) {
        switch ( element.nodeName.toLowerCase() ) {
            case "select":
                return Array.from(element.querySelectorAll('option')).filter(element => (<HTMLOptionElement>element).selected).length;
            case "input":
                if (this.checkable( element )) {
                    return this.findByName(element.name).filter(element => (<HTMLInputElement>element).checked).length;
                } else {
                    switch (element.type) {
                        case "number":
                            return parseFloat(value);
                        case "file":
                            if (element.files) {
                                return element.files.length;
                            } else {
                                return 0;
                            }
                    }
                }
        }
        return value.length;
    }

    /**
     * Checks if the length of a string or array is greater than or equal to a specified minimum length.
     *
     * @param {string | Array} value - The input value to be checked.
     * @param {HTMLInputElement} element - The HTML input element associated with the value.
     * @param {number} param - The minimum length that the value should have.
     *
     * @return {boolean} Returns true if the length of the input value is greater than or equal to the specified minimum length, false otherwise.
     */
    minlength(value: string, element: HTMLInputElement, param: number) {
        var length = Array.isArray( value ) ? value.length : this.getLength( value, element );
        return length >= param;
    }

    /**
     * Check if the length of the given value is less than or equal to a specified parameter.
     *
     * @param {string} value - The value to check the length of. If value is an array, its length is used. Otherwise, the length is calculated based on the provided element.
     * @param {HTMLInputElement} element - The HTML input element to calculate the length from if value is not an array.
     * @param {number} param - The maximum length allowed.
     *
     * @return {boolean} Returns true if the length of the value is less than or equal to the param, otherwise false.
     */
    maxlength(value: string, element: HTMLInputElement, param: number) {
        var length = Array.isArray( value ) ? value.length : this.getLength( value, element );
        return length <= param;
    }

    /**
     * Checks if the length of a value falls within a specified range.
     *
     * @param {string | Array} value - The value to check the length of. If an array is provided, its length is directly used.
     * @param {HTMLInputElement} element - The input element associated with the value.
     * @param {number[]} param - An array containing two numbers that represent the range limits [minimumLength, maximumLength].
     *
     * @return {boolean} Returns true if the length of the value falls within the specified range, otherwise returns false.
     */
    rangelength(value: string, element: HTMLInputElement, param: number[]) {
        var length = Array.isArray( value ) ? value.length : this.getLength( value, element );
        return ( length >= param[0] && length <= param[1] );
    }

    /**
     * Validates the form fields and returns true if all fields are valid.
     * Asynchronous rules are not awaited: use submitAction() to take them into account.
     *
     * @return {boolean} True if all form fields are valid, otherwise false.
     */
    validateForm() {
        return this.getFields()
            .map(field => this.validateField(field))
            .every(isValid => isValid);
    }

    /**
     * Validates if at least one radio button or checkbox with the specified name is checked.
     *
     * @param {string} name - The name of the radio buttons or checkboxes to validate.
     * @return {boolean} - Returns true if at least one radio button or checkbox with the specified name is checked, false otherwise.
     */
    validateCheckboxRadio(name: string) {
        return this.findByName(name).some(element => (<HTMLInputElement>element).checked);
    }

    /**
     * Validates if the given text is not empty (whitespace only is considered empty).
     *
     * @param {string} value - The text to be validated.
     * @return {boolean} - True if the text is not empty, false otherwise.
     */
    validateText(value: string) {
        return value.trim().length > 0;
    }

    /**
     * Validate the given regular expression against the specified value.
     * As for the HTML `pattern` attribute, the expression must match the whole value; an invalid expression is ignored.
     *
     * @param {string} regExp - The regular expression to validate against.
     * @param {string} value - The value to validate.
     *
     * @returns {boolean} - True if the value matches the regular expression, false otherwise.
     */
    validateRegExp(regExp: string, value: string) {
        // The 'v' flag is the one used by browsers for the pattern attribute, 'u' and no flag are fallbacks
        for (const flags of ['v', 'u', '']) {
            let customRegExp: RegExp;
            try {
                customRegExp = new RegExp('^(?:' + regExp + ')$', flags);
            } catch (e) {
                continue;
            }
            return customRegExp.test(value);
        }
        console.warn('Invalid pattern ignored: ' + regExp);
        return true;
    }

    /**
     * Validates email address.
     *
     * @param {string} value - The email address to be validated.
     * @return {boolean} - Returns true if the email address is valid, otherwise false.
     */
    validateEmail(value: string) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(value);
    }

    /**
     * Validates the phone number.
     *
     * @param {string} value - The phone number to be validated.
     * @return {boolean} - True if the phone number is valid, false otherwise.
     */
    validatePhone(value: string) {
        const phoneRegex = /^[\s]{0,2}[\+]{0,1}[\s0-9]{6,20}[\s]{0,2}$/;
        return phoneRegex.test(value);
    }

    /**
     * Validates a URL using a regular expression (localhost and private network addresses are allowed).
     *
     * @param {string} value The URL string to be validated.
     * @return {boolean} true if the input value is a valid URL, false otherwise.
     */
    validateUrl(value: string) {
        const urlRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[^\]\[?\/<~#`!@$^&*()+=}|:";',>{ ]|%[0-9A-Fa-f]{2})+(?::(?:[^\]\[?\/<~#`!@$^&*()+=}|:";',>{ ]|%[0-9A-Fa-f]{2})*)?@)?(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|localhost|(?:(?:[a-z0-9¡-￿][a-z0-9¡-￿_-]{0,62})?[a-z0-9¡-￿]\.)+(?:[a-z¡-￿]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
        return urlRegex.test(value);
    }

    /**
     * Validates the date input provided in the HTMLInputElement field.
     *
     * @param {HTMLInputElement} field - The input field to validate for a date format.
     * @return {boolean} Returns true if the input field contains a valid date format that falls within any specified min/max attributes, otherwise false.
     */
    validateDate(field: HTMLInputElement) {
        const value = Date.parse(field.value);
        if (isNaN(value)) {
            return false;
        }
        const attrMin = field.getAttribute('min');
        if (attrMin) {
            const minValue = Date.parse(attrMin);
            if (!isNaN(minValue) && value < minValue) {
                return false;
            }
        }
        const attrMax = field.getAttribute('max');
        if (attrMax) {
            const maxValue = Date.parse(attrMax);
            if (!isNaN(maxValue) && value > maxValue) {
                return false;
            }
        }
        return true;
    }

    /**
     * Validates if the given value is a valid number.
     *
     * @param {string} value - The value to be validated as a number.
     * @return {boolean} Returns true if the value is a valid number, otherwise false.
     */
    validateNumber(value: string) {
        const numberRegex = /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/;
        return numberRegex.test(value);
    }

    /**
     * Checks if a given input contains only numeric digits.
     *
     * @param {string} input - The string to be validated.
     * @return {boolean} Returns true if the input contains only numeric digits, otherwise false.
     */
    validateDigits(value: string) {
        const numberRegex = /^\d+$/;
        return numberRegex.test(value);
    }

    /**
     * Attaches a submit event listener to the form element and prevents the default form submission behavior.
     *
     * @return {void}
     */
    checkSubmit() {
        this.addListener('submit', event => {
            event.preventDefault();
            this.submitAction((<SubmitEvent>event).submitter);
        });
    }

    /**
     * Validate the form (awaiting the asynchronous rules) and submit it if valid.
     *
     * @param {HTMLElement | null} [submitter] - The button that triggered the submission, if any.
     * @return {Promise<void>}
     */
    async submitAction(submitter?: HTMLElement | null) {
        const form = this.form;
        if (!form) {
            return;
        }
        if (this.settings && this.settings.validFormClass) {
            form.classList.add(this.settings.validFormClass);
        }
        const results = this.getFields().map(field => this.runFieldValidation(field));
        let isValid = results.every(result => result.valid);
        if (isValid) {
            const pending = results
                .map(result => result.pending)
                .filter((promise): promise is Promise<boolean> => promise !== undefined);
            if (pending.length > 0) {
                isValid = (await Promise.all(pending)).every(valid => valid);
            }
        }
        if (isValid) {
            if (this.settings && this.settings.submitHandler) {
                this.settings.submitHandler(form, submitter);
            } else {
                this.nativeSubmit(form, submitter);
            }
        } else {
            console.log('Invalid form, please check the errors.');
            if (this.settings && this.settings.validFormClass) {
                form.classList.remove(this.settings.validFormClass);
            }
        }
    }

    /**
     * Submit the form natively, sending the name/value of the submitter button
     * and working even if a field named "submit" shadows HTMLFormElement.submit.
     *
     * @param {HTMLFormElement} form - The form to submit.
     * @param {HTMLElement | null} [submitter] - The button that triggered the submission, if any.
     * @return {void}
     */
    private nativeSubmit(form: HTMLFormElement, submitter?: HTMLElement | null) {
        let submitterInput: HTMLInputElement | null = null;
        const submitterName = submitter ? submitter.getAttribute('name') : null;
        if (submitter && submitterName) {
            submitterInput = document.createElement('input');
            submitterInput.type = 'hidden';
            submitterInput.name = submitterName;
            submitterInput.value = (<HTMLButtonElement>submitter).value;
            Node.prototype.appendChild.call(form, submitterInput);
        }
        HTMLFormElement.prototype.submit.call(form);
        if (submitterInput) {
            submitterInput.remove();
        }
    }

    /**
     * Resets the form: the reset event listener removes the "was-validated" class and hides the error messages.
     *
     * @return {void}
     */
    resetForm() {
        if (this.form) {
            HTMLFormElement.prototype.reset.call(this.form);
        }
    }
}
