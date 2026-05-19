interface MaybeFirebaseError {
  code?: string;
  message?: string;
  customData?: {
    _tokenResponse?: {
      error?: { message?: string };
    };
  };
}

export function isUserCancelledPopup(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as MaybeFirebaseError).code ?? "";
  return code === "auth/popup-closed-by-user"
    || code === "auth/cancelled-popup-request"
    || code === "auth/user-cancelled";
}

export function getAuthErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") {
    return "Email non autorizzata. Contatta l'amministratore.";
  }
  const e = err as MaybeFirebaseError;
  const code = e.code ?? "";

  const known: Record<string, string> = {
    "auth/popup-blocked": "Popup bloccato dal browser. Abilita i popup per accedere.",
    "auth/network-request-failed": "Errore di rete. Verifica la connessione.",
    "auth/account-exists-with-different-credential":
      "Account già esistente con un altro metodo di accesso.",
    "auth/invalid-action-code": "Link non valido.",
    "auth/expired-action-code": "Link scaduto. Richiedi un nuovo link.",
    "auth/invalid-email": "Email non valida.",
    "auth/too-many-requests": "Troppi tentativi. Riprova più tardi.",
  };
  if (known[code]) return known[code];

  return "Email non autorizzata. Contatta l'amministratore.";
}

export function isUnauthorizedEmailError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as MaybeFirebaseError;
  const code = (e.code ?? "").toLowerCase();
  if (
    code.includes("blocking-cloud-function-error")
    || code.includes("admin-restricted")
    || code === "auth/internal-error"
  ) return true;
  const msg = (e.message ?? "").toLowerCase();
  if (
    msg.includes("email not allowed")
    || msg.includes("permission-denied")
    || msg.includes("blocking function")
    || msg.includes("blocking_function_error_response")
  ) return true;
  const inner = e.customData?._tokenResponse?.error?.message;
  if (inner) {
    const il = inner.toLowerCase();
    if (
      il.includes("email not allowed")
      || il.includes("permission_denied")
      || il.includes("blocking")
      || il.includes("http error: 403")
    ) return true;
  }
  return false;
}
