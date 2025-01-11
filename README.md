# vanilla-form-validator.js #

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Socket Badge](https://socket.dev/api/badge/npm/package/vanilla-form-validator)](https://socket.dev/npm/package/vanilla-form-validator)
[![jsdelivr](https://data.jsdelivr.com/v1/package/npm/vanilla-form-validator/badge)](https://www.jsdelivr.com/package/npm/vanilla-form-validator)
[![npm](https://img.shields.io/npm/v/vanilla-form-validator.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/vanilla-form-validator)
[![npm downloads](https://img.shields.io/npm/dm/vanilla-form-validator.svg?style=flat-square)](https://www.npmjs.com/package/vanilla-form-validator)
[![yarn](https://img.shields.io/npm/v/vanilla-form-validator.svg?logo=yarn&logoColor=fff&label=yarn)](https://yarnpkg.com/package?name=vanilla-form-validator)

## *Inspired by:* jquery-validation

> *validator:* form validator

[Demo](#demo) - [Features](#features) - [Install](#install) - [Usage](#usage) - [Options](#options) - [Changelog](#changelog) - [License](#license)

### Demo

See the [vanilla-form-validator.js demo](https://codepen.io/mitera/pen/pvzLWeR).

### Best practice

Use this library to validate a form and display the same style for error messages.

### Features

- validate a form
- validate fields
- preconfigured and internationalizable error messages
- customize the submission form
- create a custom validations
- tested in Edge, Chrome, Firefox

### Install

CDN via jsDelivr

    <script src="https://cdn.jsdelivr.net/npm/vanilla-form-validator@latest/dist/vanilla-form-validator.min.js" type="text/javascript"></script>

Download [vanilla-form-validator.js](https://github.com/mitera/vanilla-form-validator/blob/master/vanilla-form-validator.js) and include the script in your HTML file:

	<script src="vanilla-form-validator.js" type="text/javascript"></script>

You can also install using the package managers [NPM](https://www.npmjs.com/package/vanilla-form-validator).

    npm install vanilla-form-validator

modular code

    import 'vanilla-form-validator'

### Usage

    let commentForm = new FormValidator("#commentForm");

	let commentForm = new FormValidator("#commentForm", {
        errorElement: 'label',
        errorClass: 'error',
        ignore: 'input[type="hidden"]'
    });

Where `options` is an optional parameter.   
See below for a description of the available options and defaults.

### Options

The default `options` are:

    {
        ignore: null,
        rules: null,
        errorElement: 'p',
        errorClass: 'error',
        validClass: 'was-validated',
        submitHandler: null,
        messages: this.messages
    }

Where:

- `ignore` is an optional string containing one or more selectors to match fields to ignore. This string must be a valid CSS selector string
- `rules` is an array of custom fields validation [Custom validations](#Custom-validations)
- `errorElement` is an html tag to display error message
- `errorClass` is a css class for display error message
- `validClass` is a css class added to a form when form is valid
- `submitHandler` is an method to customize the submission form [Customize the submission form](#Customize-the-submission-form)
- `messages` preconfigured error messages [Error messages](#Error-messages)

### Error messages

preconfigured values

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
        max: 'Please enter a value than {0}.',
        min: 'Please enter a value at least {0}.',
        range: 'Please enter a value between {0} and {1}'
    }

Override solution:
1) one by one


    let messages = {
        required: 'Required field' //override default message
    }
    let signupForm = new FormValidator("#signupForm", {
        errorElement: 'label',
        messages: messages,
    });

2) loading a json file `commentForm.loadMessages('localization/messages_es.json');`


    let commentForm = new FormValidator("#commentForm", {
        errorElement: 'label',
        ignore: 'input[type="hidden"]'
    });
    commentForm.loadMessages('localization/messages_es.json');

There is already a custom set of json files

### Customize the submission form

Create a function on `submitHandler` property

    let signupForm = new FormValidator("#signupForm", {
        submitHandler: function () {
            console.log('remote action')
        }
    });

### Custom validations

is ad array of rules:

    let signupForm = new FormValidator("#signupForm", {
        rules: [
            ...
        ]
    })

rules configuration:
- `fieldName` is the name of the field
- `errorMessage` is an optional error message
- `validation` is an object to configure
  - `method` available methods are: `equalTo, minlength, maxlength, rangelength, custom`
  - `field` is a css rule for find a field, this option is use by `equalTo` method
  - `min` is min integer value used by `minlength, rangelength`
  - `max` is max integer value used by `maxlength, rangelength`
  - `action` is a custom method for validate field must be return a boolean value

preconfigured validation: `equalTo, minlength, maxlength, rangelength`
These rules: `minlength, maxlength, rangelength` are applicable on input `text,radio,checkbox,file` and select field

    {
        fieldName: 'confirm_password',
        validation: {
            method: 'equalTo',
            field: '#password'
        }
    },
    {
        fieldName: 'minselect',
        errorMessage: 'Please select 2 elements.',
        validation: {
            method: 'minlength',
            min: 2
        }
    },
    {
        fieldName: 'maxfiles',
        errorMessage: 'Please select max 2 files.',
        validation: {
            method: 'maxlength',
            max: 2
        }
    },
    {
        fieldName: 'topic2',
        errorMessage: 'Please select 1 or 2 topics',
        validation: {
            method: 'rangelength',
            min: 1,
            max: 2
        }
    }

custom validation:

    {
        fieldName: 'username',
        errorMessage: 'Username already in use',
        validation: {
            method: 'custom',
            action: function () {
                console.log('remote validation');
                return true;
            },
        }
    }

### Changelog

To see what's new or changed in the latest version, see the [changelog](https://github.com/mitera/validator/blob/master/CHANGELOG.md)

### License

vanilla-form-validator.js is licensed under [The MIT License (MIT)](http://opensource.org/licenses/MIT)
<br/>Copyright (c) 2025 Simone Miterangelis

This license is also supplied with the release and source code.
<br/>As stated in the license, absolutely no warranty is provided.