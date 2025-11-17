import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { sendValidationError } from "../utils/response";

const SIMPLE_ERROR_MESSAGE = "Invalid request data";

const runValidation = (
  schema: ZodTypeAny,
  data: unknown,
  res: Response,
  next: NextFunction,
): void => {
  const result = schema.safeParse(data);

  if (!result.success) {
    sendValidationError(res, SIMPLE_ERROR_MESSAGE);
    return;
  }

  next();
};

export const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    runValidation(schema, req.body, res, next);
  };
};

export const validateParams = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    runValidation(schema, req.params, res, next);
  };
};

export const validateQuery = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    runValidation(schema, req.query, res, next);
  };
};
