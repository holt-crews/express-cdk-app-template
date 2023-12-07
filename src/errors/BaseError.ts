import { ERRORS } from "./constants";
import { BaseErrorOptions, ErrorCode } from "./types";

export class BaseError extends Error {
  statusCode: number;
  isOperational: boolean;
  code: ErrorCode;
  details: string;
  constructor(
    errorCode: ErrorCode,
    statusCode: number,
    options: BaseErrorOptions = {},
    isOperational?: boolean,
  ) {
    const { code, message, details } = getErrorDetails(errorCode);
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = code;
    this.message = replacePlaceholder(message, options);
    this.details = replacePlaceholder(details, options);
    this.statusCode = statusCode || 500;
    this.isOperational = isOperational || false;
    Error.captureStackTrace(this);
  }
}

const getErrorDetails = (errorCode: ErrorCode) => {
  const error = ERRORS[errorCode] || ERRORS.DEFAULT_ERROR;
  return error;
};

const replacePlaceholder = (message: string, options: BaseErrorOptions) => {
  const placeholders = message.match(/\{(.*?)\}/g) || [];
  let result = message;
  placeholders.forEach(function (placeholder) {
    const phText = placeholder.substring(1, placeholder.length - 1);
    if (options[phText]) {
      result = result.replace(placeholder, options[phText] as string);
    }
  });
  return result;
};

export { ERRORS } from "./constants";
