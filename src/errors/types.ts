import { ERRORS } from "./constants";

export type ErrorCode = keyof typeof ERRORS;
export type BaseErrorOptions = {
  [key: string]: string | number | boolean;
};
export type Error = {
  code: ErrorCode;
  message: string;
  details: string;
  help?: string;
};
export type Errors = { [key in ErrorCode]: Error };
