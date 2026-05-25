import { HttpsError } from "firebase-functions/v2/https";
import {
  ConflictError,
  DomainError,
  NotFoundError,
  PermissionDeniedError,
  StaleStateError,
} from "@vet/shared";

export function toHttpsError(err: unknown): HttpsError {
  if (err instanceof HttpsError) return err;
  if (err instanceof NotFoundError) {
    return new HttpsError("not-found", err.message);
  }
  if (err instanceof PermissionDeniedError) {
    return new HttpsError("permission-denied", err.message);
  }
  if (err instanceof ConflictError || err instanceof StaleStateError) {
    return new HttpsError("failed-precondition", err.message);
  }
  if (err instanceof DomainError) {
    return new HttpsError("internal", err.message);
  }
  return new HttpsError("internal", "");
}
