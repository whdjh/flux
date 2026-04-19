export type AppErrorKind =
  | "unauthorized"
  | "not_found"
  | "bad_request"
  | "conflict"
  | "internal";

export interface AppErrorJson {
  kind: AppErrorKind;
  status: number;
  message: string;
}

export abstract class AppError extends Error {
  abstract readonly kind: AppErrorKind;
  abstract readonly status: number;

  toJSON(): AppErrorJson {
    return {
      kind: this.kind,
      status: this.status,
      message: this.message,
    };
  }
}

export class UnauthorizedError extends AppError {
  readonly kind = "unauthorized" as const;
  readonly status = 401;

  constructor(message = "unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  readonly kind = "not_found" as const;
  readonly status = 404;

  constructor(message = "not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends AppError {
  readonly kind = "bad_request" as const;
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class ConflictError extends AppError {
  readonly kind = "conflict" as const;
  readonly status = 409;

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class InternalError extends AppError {
  readonly kind = "internal" as const;
  readonly status = 500;

  constructor(message = "internal server error", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "InternalError";
  }

  toJSON(): AppErrorJson {
    return {
      kind: this.kind,
      status: this.status,
      message: "internal server error",
    };
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
