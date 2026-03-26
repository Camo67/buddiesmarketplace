export class AppError extends Error {
  statusCode: number;
  code: string;
  details: Record<string, unknown> | null;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: string;
      details?: Record<string, unknown> | null;
    },
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = options?.statusCode ?? 500;
    this.code = options?.code ?? "internal_error";
    this.details = options?.details ?? null;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
