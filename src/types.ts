interface FormRuleValidation {
    method?: string | Function | null;
    field?: string | null;
    min?: number | null;
    max?: number | null;
    errorMessage: string | null;
}

interface FormMessages {
    required: string;
    remote: string;
    email: string;
    url: string;
    date: string;
    number: string;
    phone: string;
    file: string;
    equalTo: string;
    maxlength: string;
    minlength: string;
    rangelength: string;
    max: string;
    min: string;
    range: string;
    regExp: string;
}

interface FormSettings {
    ignore?: string | null;
    fields?: FormField[] | null;
    errorElement?: string | null;
    errorClass?: string | null;
    errorFieldClass?: string | null;
    validFormClass?: string | null;
    submitHandler?: any | null;
    messages?: FormMessages;
}

interface FormField {
    name?: string | null;
    rules?: FormRuleValidation[] | null;
}

export {
    FormRuleValidation,
    FormField,
    FormMessages,
    FormSettings
}