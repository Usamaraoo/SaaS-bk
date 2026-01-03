import { Response } from "express";

interface SendResponse<T> {
  success?: boolean;
  data?: T | null;
  message?: string | null;
  statusCode?: number;
}

export const sendResponse = <T>(
  res: Response,
  {
    success = true,
    data = null,
    message = null,
    statusCode = 200,
  }: SendResponse<T>
): Response => {
  return res.status(statusCode).json({
    success,
    data,
    message,
  });
};
