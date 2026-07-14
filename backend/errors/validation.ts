import KonBaseError from "./base";

export class KonMissingRequiredFieldsError extends KonBaseError {}

export class KonIncorrectFieldTypeError extends KonBaseError {}

export class KonNotFoundError extends KonBaseError {}
