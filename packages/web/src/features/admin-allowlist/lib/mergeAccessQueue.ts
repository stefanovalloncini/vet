import { normalizeEmail, type AccessRequest, type User } from "@vet/shared";

export interface PendingQueueRow {
  kind: "pending";
  emailNorm: string;
  email: string;
  date: Date;
  user: User;
}

export interface RequestQueueRow {
  kind: "request";
  emailNorm: string;
  email: string;
  date: Date;
  request: AccessRequest;
}

export type AccessQueueRow = PendingQueueRow | RequestQueueRow;

function pendingRow(user: User): PendingQueueRow {
  return {
    kind: "pending",
    emailNorm: normalizeEmail(user.email),
    email: user.email,
    date: user.createdAt,
    user,
  };
}

function requestRow(request: AccessRequest): RequestQueueRow {
  return {
    kind: "request",
    emailNorm: request.emailNorm,
    email: request.email,
    date: request.firstAttemptAt,
    request,
  };
}

export function mergeAccessQueue(
  pending: ReadonlyArray<User>,
  requests: ReadonlyArray<AccessRequest>
): AccessQueueRow[] {
  const byEmail = new Map<string, AccessQueueRow>();

  for (const req of requests) {
    byEmail.set(req.emailNorm, requestRow(req));
  }
  for (const user of pending) {
    byEmail.set(normalizeEmail(user.email), pendingRow(user));
  }

  return [...byEmail.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}
