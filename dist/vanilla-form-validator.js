/*!
 * @author Simone Miterangelis <simone@mite.it>
 * vanilla-form-validator v1.0.8 by @mitera
 * https://github.com/mitera/vanilla-form-validator
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.FormValidator = factory());
})(this, (function () { 'use strict';

	class FormValidator {
	    /**
	     * Constructor for the FormHandler class.
	     * @param {string} id - The ID of the HTML form element.
	     * @return {void}
	     */
	    constructor(selector, settings) {
	        this.messages = {
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
	            max: 'Please enter a value than {0}.',
	            min: 'Please enter a value at least {0}.',
	            range: 'Please enter a value between {0} and {1}',
	            regExp: 'Please enter a value matching the requested format.'
	        };
	        this.form = document.querySelector(selector);
	        if (this.form) {
	            let default_settings = {
	                ignore: null,
	                rules: null,
	                errorElement: 'p',
	                errorClass: 'error',
	                errorFieldClass: null,
	                validFormClass: 'was-validated',
	                submitHandler: null,
	                messages: this.messages
	            };
	            this.settings = Object.assign(Object.assign({}, default_settings), settings);
	            this.messages = this.merge(this.settings.messages, this.messages);
	            this.init();
	        }
	    }
	    /**
	     * Load and merge messages from a JSON file into the settings.
	     *
	     * @param {string} jsonFile - The path of the JSON file containing the messages.
	     *
	     * @return {void}
	     */
	    loadMessages(jsonFile) {
	        fetch(jsonFile)
	            .then(response => response.json())
	            .then(data => {
	            if (this.settings && data.messages) {
	                this.messages = this.merge(data.messages, this.messages);
	            }
	        })
	            .catch(error => console.log(error));
	    }
	    /**
	     * Initialize the form validation by setting up event listeners on form fields for blur, keyup, change events.
	     * Also adds a listener for form reset event.
	     *
	     * @return {void}
	     */
	    init() {
	        this.form.setAttribute('novalidate', '');
	        this.checkSubmit();
	        this.fields = Array.from(this.form.querySelectorAll('input[name], textarea, select'));
	        if (this.settings && this.settings.ignore) {
	            let ignoreFields = Array.from(this.form.querySelectorAll(this.settings.ignore));
	            this.fields = this.fields.filter(element => !ignoreFields.includes(element));
	        }
	        this.fields.forEach(field => {
	            field.addEventListener('blur', this.fieldValidationEvent.bind(this));
	            field.addEventListener('keyup', this.fieldValidationEvent.bind(this));
	            field.addEventListener('change', this.fieldValidationEvent.bind(this));
	        });
	        this.form.addEventListener("reset", (_) => {
	            this.resetForm();
	        });
	    }
	    /**
	     * Merge two objects
	     *
	     * @param {FormMessages} o1 Object 1
	     * @param {FormMessages} o2 Object 2
	     * @return {FormMessages}
	     */
	    merge(o1, o2) {
	        if (o1 != null) {
	            for (var i in o1) {
	                o2[i] = o1[i];
	            }
	        }
	        return o2;
	    }
	    /**
	     * Handles the field validation event triggered by a user action.
	     *
	     * @param {Event} e - The event object representing the user action.
	     * @return {void}
	     */
	    fieldValidationEvent(e) {
	        const field = e.target;
	        this.validateField(field);
	    }
	    /**
	     * Validates a field based on its type and any additional rules provided.
	     *
	     * @param {HTMLInputElement} field - The input field to be validated.
	     * @return {boolean} Returns true if the field is valid, false if it is not.
	     */
	    validateField(field) {
	        let fieldId = field.id;
	        const fieldName = field.name;
	        const fieldType = field.type;
	        const pattern = field.pattern;
	        switch (fieldType) {
	            case 'checkbox':
	            case 'radio':
	                fieldId = fieldName;
	                break;
	        }
	        const fieldValue = field.value;
	        let customErrorMessage = field.dataset.errorMessage ? field.dataset.errorMessage : '';
	        let errorMessage = '';
	        if (customErrorMessage) {
	            errorMessage = customErrorMessage;
	        }
	        let isValid = true;
	        if (field.hasAttribute('required')) {
	            switch (fieldType) {
	                case 'checkbox':
	                case 'radio':
	                    isValid = this.validateCheckboxRadio(fieldName);
	                    break;
	                default:
	                    isValid = this.validateText(fieldValue);
	            }
	            if (!isValid && !customErrorMessage) {
	                errorMessage = this.messages.required;
	            }
	        }
	        if (isValid && fieldValue && fieldValue !== '') {
	            switch (fieldType) {
	                case 'email':
	                    isValid = this.validateEmail(fieldValue);
	                    if (!isValid && !customErrorMessage) {
	                        errorMessage = this.messages.email;
	                    }
	                    break;
	                case 'tel':
	                    isValid = this.validatePhone(fieldValue);
	                    if (!isValid && !customErrorMessage) {
	                        errorMessage = this.messages.phone;
	                    }
	                    break;
	                case 'url':
	                    isValid = this.validateUrl(fieldValue);
	                    if (!isValid && !customErrorMessage) {
	                        errorMessage = this.messages.url;
	                    }
	                    break;
	                // case 'number':
	                //     isValid = this.validateNumber(fieldValue);
	                //     if (!isValid && !customErrorMessage) {
	                //         errorMessage = this.messages.number;
	                //     }
	                //     break;
	                case 'file':
	                    isValid = (field.files && field.files.length > 0) ? true : false;
	                    if (!isValid && !customErrorMessage) {
	                        errorMessage = this.messages.file;
	                    }
	                    break;
	                case 'date':
	                    isValid = this.validateDate(field);
	                    if (!isValid && !customErrorMessage) {
	                        errorMessage = this.messages.date;
	                    }
	                    break;
	                default:
	                    let minlength = field.getAttribute('minlength') ? field.getAttribute('minlength') : field.getAttribute('min');
	                    if (minlength && this.validateDigits(minlength)) {
	                        isValid = this.minlength(fieldValue, field, parseInt(minlength));
	                        if (!isValid && !customErrorMessage) {
	                            if (field.getAttribute('min'))
	                                errorMessage = this.messages.min.replace('{0}', minlength);
	                            else
	                                errorMessage = this.messages.minlength.replace('{0}', minlength);
	                        }
	                    }
	                    let maxlength = field.getAttribute('maxlength') ? field.getAttribute('maxlength') : field.getAttribute('max');
	                    if (maxlength && this.validateDigits(maxlength)) {
	                        isValid = this.maxlength(fieldValue, field, parseInt(maxlength));
	                        if (!isValid && !customErrorMessage) {
	                            if (field.getAttribute('max'))
	                                errorMessage = this.messages.max.replace('{0}', maxlength);
	                            else
	                                errorMessage = this.messages.maxlength.replace('{0}', maxlength);
	                        }
	                    }
	                    if (minlength && this.validateDigits(minlength) && maxlength && this.validateDigits(maxlength)) {
	                        isValid = this.rangelength(fieldValue, field, [parseInt(minlength), parseInt(maxlength)]);
	                        if (!isValid && !customErrorMessage) {
	                            if (field.getAttribute('max') && field.getAttribute('min'))
	                                errorMessage = this.messages.range
	                                    .replace('{0}', minlength)
	                                    .replace('{1}', maxlength);
	                            else
	                                errorMessage = this.messages.rangelength
	                                    .replace('{0}', minlength)
	                                    .replace('{1}', maxlength);
	                        }
	                    }
	            }
	            if (isValid && fieldValue && fieldValue !== '' && pattern !== '') {
	                isValid = this.validateRegExp(pattern, fieldValue);
	                if (!isValid && !customErrorMessage) {
	                    errorMessage = this.messages.regExp;
	                }
	            }
	            if (isValid && this.settings && this.settings.rules) {
	                this.settings.rules.forEach(rule => {
	                    if (rule.fieldName == fieldName && rule.validation) {
	                        let min = rule.validation.min;
	                        let max = rule.validation.max;
	                        switch (rule.validation.method) {
	                            case 'equalTo':
	                                if (rule.validation.field) {
	                                    let equalToField = this.form.querySelector(rule.validation.field);
	                                    if (equalToField) {
	                                        isValid = (fieldValue == equalToField.value);
	                                        if (!isValid && !customErrorMessage) {
	                                            errorMessage = rule.errorMessage ? rule.errorMessage : this.messages.equalTo;
	                                        }
	                                    }
	                                }
	                                break;
	                            case 'minlength':
	                                if (min) {
	                                    isValid = this.minlength(fieldValue, field, min);
	                                    if (!isValid && !customErrorMessage) {
	                                        if (field.getAttribute('min')) {
	                                            errorMessage = rule.errorMessage ? rule.errorMessage : this.messages.min;
	                                        }
	                                        else {
	                                            errorMessage = rule.errorMessage ? rule.errorMessage : this.messages.minlength;
	                                        }
	                                        errorMessage = errorMessage.replace('{0}', min.toString());
	                                    }
	                                }
	                                break;
	                            case 'maxlength':
	                                if (max) {
	                                    isValid = this.maxlength(fieldValue, field, max);
	                                    if (!isValid && !customErrorMessage) {
	                                        if (field.getAttribute('max')) {
	                                            errorMessage = rule.errorMessage ? rule.errorMessage : this.messages.max;
	                                        }
	                                        else {
	                                            errorMessage = rule.errorMessage ? rule.errorMessage : this.messages.maxlength;
	                                        }
	                                        errorMessage = errorMessage.replace('{0}', max.toString());
	                                    }
	                                }
	                                break;
	                            case 'rangelength':
	                                if (min && max) {
	                                    isValid = this.rangelength(fieldValue, field, [min, max]);
	                                    if (!isValid && !customErrorMessage) {
	                                        if (field.getAttribute('max') && field.getAttribute('min')) {
	                                            errorMessage = rule.errorMessage ? rule.errorMessage : this.messages.range;
	                                        }
	                                        else {
	                                            errorMessage = rule.errorMessage ? rule.errorMessage : this.messages.rangelength;
	                                        }
	                                        errorMessage = errorMessage
	                                            .replace('{0}', min.toString())
	                                            .replace('{1}', max.toString());
	                                    }
	                                }
	                                break;
	                            case 'custom':
	                                if (rule.validation.action) {
	                                    isValid = rule.validation.action();
	                                    if (!isValid && !customErrorMessage) {
	                                        errorMessage = rule.errorMessage ? rule.errorMessage : this.messages.remote;
	                                    }
	                                }
	                                break;
	                        }
	                    }
	                });
	            }
	        }
	        let errorHelpId = (fieldId ? fieldId : fieldName) + '-error';
	        let errorHelp = document.querySelector('#' + errorHelpId);
	        if (!errorHelp && this.settings) {
	            const errorHelpItem = document.createElement(this.settings.errorElement ? this.settings.errorElement : 'p');
	            errorHelpItem.className = this.settings.errorClass ? this.settings.errorClass : 'error';
	            errorHelpItem.id = errorHelpId;
	            field.insertAdjacentElement('afterend', errorHelpItem);
	            errorHelp = document.querySelector('#' + errorHelpId);
	        }
	        if (errorHelp) {
	            if (isValid) {
	                if (errorHelp) {
	                    errorHelp.style.setProperty('display', 'none');
	                }
	                if (this.settings && this.settings.errorFieldClass) {
	                    field.classList.remove(this.settings.errorFieldClass);
	                }
	            }
	            else {
	                errorHelp.innerText = errorMessage;
	                if (errorHelp) {
	                    errorHelp.style.setProperty('display', '');
	                }
	                if (this.settings && this.settings.errorFieldClass) {
	                    field.classList.add(this.settings.errorFieldClass);
	                }
	            }
	        }
	        return isValid;
	    }
	    /**
	     * Escapes characters with special meaning in CSS for a given string
	     *
	     * @param {string} string - The input string to escape CSS special characters
	     * @return {string} - The escaped string with CSS special characters properly escaped
	     */
	    escapeCssMeta(string) {
	        if (string === undefined) {
	            return "";
	        }
	        return string.replace(/([\\!"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, "\\$1");
	    }
	    /**
	     * Find all elements in the DOM with the specified name attribute.
	     *
	     * @param {string} name - The name attribute value to search for.
	     * @return {Array<Element>} - An array of elements matching the given name attribute.
	     */
	    findByName(name) {
	        return Array.from(this.form.querySelectorAll("[name='" + this.escapeCssMeta(name) + "']"));
	    }
	    /**
	     * Check if the given HTML input element is a radio button or checkbox.
	     *
	     * @param {HTMLInputElement} element - The HTML input element to be checked.
	     * @return {boolean} - True if the element is a radio button or checkbox, false otherwise.
	     */
	    checkable(element) {
	        return (/radio|checkbox/i).test(element.type);
	    }
	    /**
	     * Calculates the length of a value based on the type of HTML input element.
	     *
	     * @param {string} value - The input value to calculate the length for.
	     * @param {HTMLInputElement} element - The input element associated with the value.
	     *
	     * @return {number} The length of the value based on the type of the input element.
	     */
	    getLength(value, element) {
	        switch (element.nodeName.toLowerCase()) {
	            case "select":
	                return Array.from(element.querySelectorAll('option')).filter(element => element.selected).length;
	            case "input":
	                if (this.checkable(element)) {
	                    return this.findByName(element.name).filter(element => element.checked).length;
	                }
	                else {
	                    switch (element.type) {
	                        case "number":
	                            return parseInt(value);
	                        case "file":
	                            if (element.files) {
	                                return element.files.length;
	                            }
	                            else {
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
	    minlength(value, element, param) {
	        var length = Array.isArray(value) ? value.length : this.getLength(value, element);
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
	    maxlength(value, element, param) {
	        var length = Array.isArray(value) ? value.length : this.getLength(value, element);
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
	    rangelength(value, element, param) {
	        var length = Array.isArray(value) ? value.length : this.getLength(value, element);
	        return (length >= param[0] && length <= param[1]);
	    }
	    /**
	     * Validates the form fields and returns true if all fields are valid.
	     *
	     * @return {boolean} True if all form fields are valid, otherwise false.
	     */
	    validateForm() {
	        let isValid = true;
	        if (this.fields) {
	            this.fields.forEach(field => {
	                const el = field;
	                let isValidField = this.validateField(el);
	                if (!isValidField) {
	                    isValid = false;
	                }
	            });
	        }
	        return isValid;
	    }
	    /**
	     * Validates if at least one radio button or checkbox with the specified name is checked.
	     *
	     * @param {string} name - The name of the radio buttons or checkboxes to validate.
	     * @return {boolean} - Returns true if at least one radio button or checkbox with the specified name is checked, false otherwise.
	     */
	    validateCheckboxRadio(name) {
	        let element = Array.from(this.form.querySelectorAll('input[name="' + name + '"]'));
	        for (var i = 0; i < element.length; i++) {
	            let checked = element[i].checked;
	            if (checked) {
	                element.forEach((item) => {
	                    if (this.settings && this.settings.errorFieldClass) {
	                        item.classList.remove(this.settings.errorFieldClass);
	                    }
	                });
	                return true;
	            }
	        }
	        return false;
	    }
	    /**
	     * Validates if the given text is not empty.
	     *
	     * @param {string} value - The text to be validated.
	     * @return {boolean} - True if the text is not empty, false otherwise.
	     */
	    validateText(value) {
	        return value.length > 0;
	    }
	    /**
	     * Validate the given regular expression against the specified value.
	     *
	     * @param {string} regExp - The regular expression to validate against.
	     * @param {string} value - The value to validate.
	     *
	     * @returns {boolean} - True if the value matches the regular expression, false otherwise.
	     */
	    validateRegExp(regExp, value) {
	        let customRegExp = new RegExp(regExp);
	        return customRegExp.test(value);
	    }
	    /**
	     * Validates email address.
	     *
	     * @param {string} value - The email address to be validated.
	     * @return {boolean} - Returns true if the email address is valid, otherwise false.
	     */
	    validateEmail(value) {
	        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	        return emailRegex.test(value);
	    }
	    /**
	     * Validates the phone number.
	     *
	     * @param {string} value - The phone number to be validated.
	     * @return {boolean} - True if the phone number is valid, false otherwise.
	     */
	    validatePhone(value) {
	        const emailRegex = /^[\s]{0,2}[\+]{0,1}[\s0-9]{6,20}[\s]{0,2}$/;
	        return emailRegex.test(value);
	    }
	    /**
	     * Validates a URL using a regular expression.
	     *
	     * @param {string} value The URL string to be validated.
	     * @return {boolean} true if the input value is a valid URL, false otherwise.
	     */
	    validateUrl(value) {
	        const urlRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[^\]\[?\/<~#`!@$^&*()+=}|:";',>{ ]|%[0-9A-Fa-f]{2})+(?::(?:[^\]\[?\/<~#`!@$^&*()+=}|:";',>{ ]|%[0-9A-Fa-f]{2})*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/;
	        return urlRegex.test(value);
	    }
	    /**
	     * Validates the date input provided in the HTMLInputElement field.
	     *
	     * @param {HTMLInputElement} field - The input field to validate for a date format.
	     * @return {boolean} Returns true if the input field contains a valid date format that falls within any specified min/max attributes, otherwise false.
	     */
	    validateDate(field) {
	        const fieldValue = field.value;
	        let value = Date.parse(fieldValue);
	        if (value) {
	            if (field.hasAttribute('min')) {
	                let attrMin = field.getAttribute('min');
	                if (attrMin && attrMin != '') {
	                    let minValue = Date.parse(attrMin);
	                    if (value < minValue) {
	                        return false;
	                    }
	                }
	            }
	            if (field.hasAttribute('max')) {
	                let attrMax = field.getAttribute('max');
	                if (attrMax && attrMax != '') {
	                    let maxValue = Date.parse(attrMax);
	                    if (value > maxValue) {
	                        return false;
	                    }
	                }
	            }
	            return true;
	        }
	        return false;
	    }
	    /**
	     * Validates if the given value is a valid number.
	     *
	     * @param {string} value - The value to be validated as a number.
	     * @return {boolean} Returns true if the value is a valid number, otherwise false.
	     */
	    validateNumber(value) {
	        const numberRegex = /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/;
	        return numberRegex.test(value);
	    }
	    /**
	     * Checks if a given input contains only numeric digits.
	     *
	     * @param {string} input - The string to be validated.
	     * @return {boolean} Returns true if the input contains only numeric digits, otherwise false.
	     */
	    validateDigits(value) {
	        const numberRegex = /^\d+$/;
	        return numberRegex.test(value);
	    }
	    /**
	     * Attaches a submit event listener to the form element and prevents the default form submission behavior.
	     *
	     * @return {void}
	     */
	    checkSubmit() {
	        if (this.form) {
	            this.form.addEventListener('submit', (event) => {
	                event.preventDefault();
	                this.submitAction();
	            });
	        }
	    }
	    /**
	     * Submit the form action.
	     *
	     * @param {object} $this - The reference to the current object.
	     * @return {void}
	     */
	    submitAction() {
	        if (this.form) {
	            if (this.settings && this.settings.validFormClass) {
	                this.form.classList.add(this.settings.validFormClass);
	            }
	            if (this.validateForm()) {
	                if (this.settings && this.settings.submitHandler) {
	                    this.settings.submitHandler();
	                }
	                else {
	                    this.form.submit();
	                }
	            }
	            else {
	                console.log('Invalid form, please check the errors.');
	                if (this.settings && this.settings.validFormClass) {
	                    this.form.classList.remove(this.settings.validFormClass);
	                }
	            }
	        }
	    }
	    /**
	     * Resets the form by removing the "was-validated" class and resetting the form fields.
	     *
	     * @return {void}
	     */
	    resetForm() {
	        if (this.form) {
	            if (this.settings && this.settings.validFormClass) {
	                this.form.classList.remove(this.settings.validFormClass);
	            }
	            this.form.reset();
	        }
	    }
	}

	return FormValidator;

}));
