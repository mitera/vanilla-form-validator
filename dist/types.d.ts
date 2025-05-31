interface FormRuleValidation {
    method?: string | null;
    field?: string | null;
    action?: any | null;
    min?: number | null;
    max?: number | null;
}
interface FormRule {
    fieldName?: string | null;
    validation?: FormRuleValidation | null;
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
    rules?: FormRule[] | null;
    errorElement?: string | null;
    errorClass?: string | null;
    errorFieldClass?: string | null;
    validFormClass?: string | null;
    submitHandler?: any | null;
    messages?: FormMessages;
}
export { FormRuleValidation, FormRule, FormMessages, FormSettings };
