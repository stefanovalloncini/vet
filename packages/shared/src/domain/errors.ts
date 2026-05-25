export abstract class DomainError extends Error {
  abstract readonly code:
    | "not-found"
    | "permission-denied"
    | "conflict"
    | "stale-state";

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = "not-found" as const;
  constructor(
    readonly resource: string,
    readonly id: string,
    options?: { cause?: unknown }
  ) {
    super(`${resource} ${id} not found`, options);
  }
}

export class PermissionDeniedError extends DomainError {
  readonly code = "permission-denied" as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

export class ConflictError extends DomainError {
  readonly code = "conflict" as const;
  constructor(
    readonly resource: string,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
  }
}

export class StaleStateError extends DomainError {
  readonly code = "stale-state" as const;
  constructor(
    readonly resource: string,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
  }
}
