import type { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400
): Response<ApiResponse> => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};

export const sendValidationError = (
  res: Response,
  message: string
): Response<ApiResponse> => {
  return sendError(res, "VALIDATION_ERROR", message, 400);
};

export const sendNotFoundError = (
  res: Response,
  resource: string
): Response<ApiResponse> => {
  return sendError(res, "NOT_FOUND", `${resource} not found`, 404);
};

export const sendNotFound = (
  res: Response,
  message: string
): Response<ApiResponse> => {
  return sendError(res, "NOT_FOUND", message, 404);
};

export const sendInternalError = (
  res: Response,
  message = "Internal server error"
): Response<ApiResponse> => {
  return sendError(res, "INTERNAL_ERROR", message, 500);
};
