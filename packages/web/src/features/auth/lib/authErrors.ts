interface MaybeFirebaseError {
  code?: string;
  message?: string;
  customData?: {
    _tokenResponse?: {
      error?: { message?: string };
    };
  };
}

export type AuthErrorKind =
  | "userCancelled"
  | "unauthorizedEmail"
  | "appCheckFailed"
  | "popupBlocked"
  | "network"
  | "invalidEmail"
  | "tooManyRequests"
  | "invalidLink"
  | "expiredLink"
  | "accountExists"
  | "operationNotAllowed"
  | "unknown";

export interface ClassifiedAuthError {
  kind: AuthErrorKind;
  message: string;
}

const MESSAGES: Record<Exclude<AuthErrorKind, "userCancelled">, string> = {
  unauthorizedEmail:
    "Email non autorizzata. Se hai più account Google, verifica di aver scelto quello giusto.",
  appCheckFailed:
    "Verifica di sicurezza non riuscita. Disabilita estensioni di privacy/ad-blocker e ricarica, o prova un altro browser.",
  popupBlocked: "Popup bloccato dal browser. Abilita i popup per accedere.",
  network: "Errore di rete. Verifica la connessione.",
  invalidEmail: "Email non valida.",
  tooManyRequests: "Troppi tentativi. Riprova più tardi.",
  invalidLink: "Link non valido.",
  expiredLink: "Link scaduto. Richiedi un nuovo link.",
  accountExists: "Account già esistente con un altro metodo di accesso.",
  operationNotAllowed: "Metodo di accesso non abilitato. Contatta l'amministratore.",
  unknown: "Accesso non riuscito. Riprova o contatta l'amministratore.",
};

export function isUserCancelledPopup(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as MaybeFirebaseError).code ?? "";
  return (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request" ||
    code === "auth/user-cancelled"
  );
}

export function classifyAuthError(err: unknown): ClassifiedAuthError {
  if (isUserCancelledPopup(err)) {
    return { kind: "userCancelled", message: "" };
  }
  const kind = detectKind(err);
  return { kind, message: MESSAGES[kind] };
}

export function getAuthErrorMessage(err: unknown): string {
  return classifyAuthError(err).message;
}

export function isUnauthorizedEmailError(err: unknown): boolean {
  return detectKind(err) === "unauthorizedEmail";
}

function detectKind(err: unknown): Exclude<AuthErrorKind, "userCancelled"> {
  if (!err || typeof err !== "object") return "unknown";
  const e = err as MaybeFirebaseError;
  const code = (e.code ?? "").toLowerCase();
  const msg = (e.message ?? "").toLowerCase();
  const innerMsg = (e.customData?._tokenResponse?.error?.message ?? "").toLowerCase();

  if (matchesAppCheck(code, msg, innerMsg)) return "appCheckFailed";
  if (matchesAllowlistDeny(code, msg, innerMsg)) return "unauthorizedEmail";

  const direct: Record<string, Exclude<AuthErrorKind, "userCancelled">> = {
    "auth/popup-blocked": "popupBlocked",
    "auth/network-request-failed": "network",
    "auth/account-exists-with-different-credential": "accountExists",
    "auth/invalid-action-code": "invalidLink",
    "auth/expired-action-code": "expiredLink",
    "auth/invalid-email": "invalidEmail",
    "auth/too-many-requests": "tooManyRequests",
    "auth/operation-not-allowed": "operationNotAllowed",
  };
  if (direct[code]) return direct[code];

  return "unknown";
}

function matchesAppCheck(code: string, msg: string, inner: string): boolean {
  if (code.includes("app-check") || code.includes("appcheck")) return true;
  const haystack = `${msg} ${inner}`;
  return (
    haystack.includes("app check") ||
    haystack.includes("app-check") ||
    haystack.includes("app_check") ||
    haystack.includes("firebase-app-check") ||
    haystack.includes("firebase_app_check")
  );
}

function matchesAllowlistDeny(code: string, msg: string, inner: string): boolean {
  if (
    code.includes("blocking-cloud-function-error") ||
    code.includes("admin-restricted")
  ) {
    return true;
  }
  const haystack = `${msg} ${inner}`;
  return (
    haystack.includes("email not allowed") ||
    haystack.includes("permission_denied") ||
    haystack.includes("permission-denied") ||
    haystack.includes("blocking function") ||
    haystack.includes("blocking_function_error_response") ||
    haystack.includes("http error: 403")
  );
}
