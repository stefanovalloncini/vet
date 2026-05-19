export function isUnauthorizedEmailError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("email not allowed")
    || msg.includes("permission-denied")
    || msg.includes("admin-restricted")
    || msg.includes("BLOCKING_FUNCTION_ERROR_RESPONSE");
}
