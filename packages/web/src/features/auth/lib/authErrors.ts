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
  | "userDisabled"
  | "storageBlocked"
  | "requiresRecentLogin"
  | "unauthorizedDomain"
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
  operationNotAllowed:
    "Metodo di accesso non abilitato. Contatta l'amministratore.",
  userDisabled:
    "Account disabilitato dall'amministratore. Contatta l'amministratore per riattivarlo.",
  storageBlocked:
    "Il browser blocca cookie o memoria locale. Disattiva la modalità privata o le protezioni anti-tracciamento per questo sito.",
  requiresRecentLogin:
    "Sessione scaduta. Effettua di nuovo l'accesso per continuare.",
  unauthorizedDomain:
    "Dominio non autorizzato per l'accesso. Contatta l'amministratore.",
  unknown: "Accesso non riuscito. Riprova o contatta l'amministratore.",
};

const CANCEL_CODES: ReadonlySet<string> = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
]);

const DIRECT_CODE_MAP: Readonly<
  Record<string, Exclude<AuthErrorKind, "userCancelled">>
> = {
  "auth/popup-blocked": "popupBlocked",
  "auth/network-request-failed": "network",
  "auth/account-exists-with-different-credential": "accountExists",
  "auth/invalid-action-code": "invalidLink",
  "auth/expired-action-code": "expiredLink",
  "auth/invalid-email": "invalidEmail",
  "auth/missing-email": "invalidEmail",
  "auth/too-many-requests": "tooManyRequests",
  "auth/quota-exceeded": "tooManyRequests",
  "auth/operation-not-allowed": "operationNotAllowed",
  "auth/admin-restricted-operation": "unauthorizedEmail",
  "auth/user-disabled": "userDisabled",
  "auth/web-storage-unsupported": "storageBlocked",
  "auth/requires-recent-login": "requiresRecentLogin",
  "auth/unauthorized-domain": "unauthorizedDomain",
  "auth/firebase-app-check-token-is-invalid": "appCheckFailed",
};

interface ErrorShape {
  code: string;
  message: string;
  innerMessage: string;
}

type Matcher = (e: ErrorShape) => Exclude<AuthErrorKind, "userCancelled"> | null;

function matchAppCheck({ code, message, innerMessage }: ErrorShape) {
  if (code.includes("app-check") || code.includes("appcheck")) {
    return "appCheckFailed" as const;
  }
  const haystack = `${message} ${innerMessage}`;
  if (
    haystack.includes("app check") ||
    haystack.includes("app-check") ||
    haystack.includes("app_check") ||
    haystack.includes("firebase-app-check") ||
    haystack.includes("firebase_app_check")
  ) {
    return "appCheckFailed" as const;
  }
  return null;
}

function matchAllowlistDeny({ code, message, innerMessage }: ErrorShape) {
  if (
    code.includes("blocking-cloud-function-error") ||
    code.includes("admin-restricted")
  ) {
    return "unauthorizedEmail" as const;
  }
  const haystack = `${message} ${innerMessage}`;
  if (
    haystack.includes("email not allowed") ||
    haystack.includes("permission_denied") ||
    haystack.includes("permission-denied") ||
    haystack.includes("blocking function") ||
    haystack.includes("blocking_function_error_response") ||
    haystack.includes("http error: 403")
  ) {
    return "unauthorizedEmail" as const;
  }
  return null;
}

function matchDirectCode({ code }: ErrorShape) {
  return DIRECT_CODE_MAP[code] ?? null;
}

const MATCHERS: ReadonlyArray<Matcher> = [
  matchAppCheck,
  matchAllowlistDeny,
  matchDirectCode,
];

function toErrorShape(err: unknown): ErrorShape | null {
  if (!err || typeof err !== "object") return null;
  const e = err as MaybeFirebaseError;
  return {
    code: (e.code ?? "").toLowerCase(),
    message: (e.message ?? "").toLowerCase(),
    innerMessage: (e.customData?._tokenResponse?.error?.message ?? "").toLowerCase(),
  };
}

export function isUserCancelledPopup(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as MaybeFirebaseError).code ?? "";
  return CANCEL_CODES.has(code);
}

function detectKind(
  err: unknown
): Exclude<AuthErrorKind, "userCancelled"> {
  const shape = toErrorShape(err);
  if (!shape) return "unknown";
  for (const matcher of MATCHERS) {
    const kind = matcher(shape);
    if (kind) return kind;
  }
  return "unknown";
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
