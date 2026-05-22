import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { AUTH_EMULATOR_HOST, FIXTURE, type SeedAccount } from "./seed";

const FAKE_API_KEY = "fake-emulator-api-key";

interface SignInResponse {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
  expiresIn: string;
}

interface AccountInfoResponse {
  users: Array<{
    localId: string;
    email: string;
    emailVerified: boolean;
    displayName?: string;
    customAttributes?: string;
    createdAt?: string;
    lastLoginAt?: string;
    providerUserInfo?: Array<{
      providerId: string;
      email?: string;
      displayName?: string;
    }>;
  }>;
}

async function signInWithPassword(
  email: string,
  password: string
): Promise<SignInResponse> {
  const url = `http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FAKE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`emulator signInWithPassword failed (${res.status}): ${text}`);
  }
  return (await res.json()) as SignInResponse;
}

async function lookupAccount(idToken: string): Promise<AccountInfoResponse["users"][number]> {
  const url = `http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FAKE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`emulator lookup failed (${res.status}): ${text}`);
  }
  const body = (await res.json()) as AccountInfoResponse;
  const first = body.users[0];
  if (!first) throw new Error("emulator lookup returned no user");
  return first;
}

function authLocalStorageKey(): string {
  return `firebase:authUser:${FAKE_API_KEY}:[DEFAULT]`;
}

function buildStoredUser(
  account: SeedAccount,
  signIn: SignInResponse,
  info: AccountInfoResponse["users"][number]
): Record<string, unknown> {
  const expiresInSec = Number.parseInt(signIn.expiresIn, 10) || 3600;
  return {
    uid: account.uid,
    email: account.email,
    emailVerified: info.emailVerified ?? true,
    displayName: info.displayName ?? account.displayName,
    isAnonymous: false,
    providerData: [
      {
        providerId: "password",
        uid: account.email,
        displayName: info.displayName ?? account.displayName,
        email: account.email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: signIn.refreshToken,
      accessToken: signIn.idToken,
      expirationTime: Date.now() + expiresInSec * 1000,
    },
    createdAt: info.createdAt ?? String(Date.now()),
    lastLoginAt: info.lastLoginAt ?? String(Date.now()),
    apiKey: FAKE_API_KEY,
    appName: "[DEFAULT]",
  };
}

export async function primeAuthStorage(
  page: Page,
  account: SeedAccount,
  baseURL: string
): Promise<void> {
  const signIn = await signInWithPassword(account.email, account.password);
  const info = await lookupAccount(signIn.idToken);
  const stored = buildStoredUser(account, signIn, info);
  const key = authLocalStorageKey();
  await page.addInitScript(
    ({ k, v }) => {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        void 0;
      }
    },
    { k: key, v: JSON.stringify(stored) }
  );
  await page.goto(baseURL);
}

export async function persistStorageState(
  context: BrowserContext,
  destination: string
): Promise<void> {
  await context.storageState({ path: destination });
}

export async function signInAsAdmin(page: Page, baseURL: string): Promise<void> {
  await primeAuthStorage(page, FIXTURE.admin, baseURL);
}

export async function signInAsVet(page: Page, baseURL: string): Promise<void> {
  await primeAuthStorage(page, FIXTURE.vet, baseURL);
}

export async function signInAsPending(page: Page, baseURL: string): Promise<void> {
  await primeAuthStorage(page, FIXTURE.pending, baseURL);
}

export const test = base.extend<{
  signedInAdmin: Page;
  signedInVet: Page;
  signedInPending: Page;
}>({
  signedInAdmin: async ({ page, baseURL }, use) => {
    if (!baseURL) throw new Error("baseURL not set");
    await signInAsAdmin(page, baseURL);
    await use(page);
  },
  signedInVet: async ({ page, baseURL }, use) => {
    if (!baseURL) throw new Error("baseURL not set");
    await signInAsVet(page, baseURL);
    await use(page);
  },
  signedInPending: async ({ page, baseURL }, use) => {
    if (!baseURL) throw new Error("baseURL not set");
    await signInAsPending(page, baseURL);
    await use(page);
  },
});

export const expect = base.expect;
