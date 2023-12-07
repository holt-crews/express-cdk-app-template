import { Request, Response, NextFunction } from "express";
import { BaseError, ERRORS } from "../errors/BaseError";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);
  returnError(err, req, res, next);
};

export const returnError = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof BaseError) {
    const { statusCode = 500, code, message, details } = err;
    return res.status(statusCode).json({ code, message, details });
  }
  return res.status(500).json(ERRORS.DEFAULT_ERROR);
};
