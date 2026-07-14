import KonBaseError from "./base";

export class KonInvalidCredentialsError extends KonBaseError {}

export class KonMissingTokenError extends KonBaseError {}

export class KonInvalidTokenError extends KonBaseError {}
