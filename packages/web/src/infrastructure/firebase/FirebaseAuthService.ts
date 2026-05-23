import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onIdTokenChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type Auth,
  type User as FbUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  type Firestore,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import type {
  ActorContext,
  AuthService,
  AuthStateSubscriber,
  SessionRevokedSubscriber,
} from "@vet/shared";
import { decodeCaps } from "@vet/shared";

const LEGACY_EMAIL_LINK_STORAGE_KEY = "vet.signInEmail";
const EMAIL_LINK_HASH_STORAGE_KEY = "vet.signInEmailHash";

async function hashEmail(email: string): Promise<string> {
  const buf = new TextEncoder().encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

function clearSignInStorage(): void {
  try {
    window.localStorage?.removeItem(LEGACY_EMAIL_LINK_STORAGE_KEY);
    window.localStorage?.removeItem(EMAIL_LINK_HASH_STORAGE_KEY);
  } catch {
    // ignore localStorage failures
  }
}

export class FirebaseAuthService implements AuthService {
  private current: ActorContext | null = null;
  private initialized = false;
  private readonly subscribers = new Set<AuthStateSubscriber>();

  constructor(
    private readonly auth: Auth,
    private readonly firestore: Firestore
  ) {
    onIdTokenChanged(this.auth, async (fbUser) => {
      if (!fbUser) {
        this.current = null;
        this.initialized = true;
        for (const cb of this.subscribers) cb(this.current);
        return;
      }
      this.current = await this.toActorFromToken(fbUser);
      this.initialized = true;
      for (const cb of this.subscribers) cb(this.current);
      void this.refreshDisplayName(fbUser);
    });
  }

  private async refreshDisplayName(fbUser: FbUser): Promise<void> {
    if (!this.current || this.current.uid !== fbUser.uid) return;
    if (!this.current.approved) return;
    try {
      const userSnap = await getDoc(doc(this.firestore, "users", fbUser.uid));
      const stored = userSnap.exists()
        ? (userSnap.data()["displayName"] as string | undefined)
        : undefined;
      if (!stored || !this.current || this.current.uid !== fbUser.uid) return;
      if (stored === this.current.displayName) return;
      this.current = { ...this.current, displayName: stored };
      for (const cb of this.subscribers) cb(this.current);
    } catch {
      // displayName remains the token fallback
    }
  }

  getCurrentUser(): ActorContext | null {
    return this.current;
  }

  subscribe(cb: AuthStateSubscriber): () => void {
    this.subscribers.add(cb);
    if (this.initialized) {
      cb(this.current);
    }
    return () => {
      this.subscribers.delete(cb);
    };
  }

  subscribeRevocation(uid: string, cb: SessionRevokedSubscriber): () => void {
    const userRef = doc(this.firestore, "users", uid);
    let firstSnapshot = true;
    return onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          if (!firstSnapshot) cb("claims-cleared");
          firstSnapshot = false;
          return;
        }
        firstSnapshot = false;
        const data = snap.data();
        if (data["disabled"] === true) cb("disabled");
      },
      (err) => {
        console.error("subscribeRevocation snapshot error", err);
        cb("claims-cleared");
      }
    );
  }

  async signInWithGoogle(options?: { selectAccount?: boolean }): Promise<void> {
    const provider = new GoogleAuthProvider();
    if (options?.selectAccount) {
      provider.setCustomParameters({ prompt: "select_account" });
    }
    await signInWithPopup(this.auth, provider);
  }

  async sendEmailSignInLink(email: string): Promise<void> {
    const actionCodeSettings = {
      url: window.location.origin + "/login/complete",
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
    const hash = await hashEmail(email);
    window.localStorage.setItem(EMAIL_LINK_HASH_STORAGE_KEY, hash);
    window.localStorage.removeItem(LEGACY_EMAIL_LINK_STORAGE_KEY);
  }

  async completeEmailSignIn(emailLinkUrl: string, providedEmail?: string): Promise<void> {
    if (!isSignInWithEmailLink(this.auth, emailLinkUrl)) {
      throw new Error("invalid sign-in link");
    }
    if (!providedEmail) {
      throw new Error("email not remembered for sign-in");
    }
    const storedHash = window.localStorage.getItem(EMAIL_LINK_HASH_STORAGE_KEY);
    if (storedHash) {
      const typedHash = await hashEmail(providedEmail);
      if (typedHash !== storedHash) {
        throw new Error("email does not match the address the sign-in link was sent to");
      }
    }
    await signInWithEmailLink(this.auth, providedEmail, emailLinkUrl);
    clearSignInStorage();
  }

  async signOut(): Promise<void> {
    clearSignInStorage();
    if (this.auth.currentUser) {
      try {
        const fn = httpsCallable(
          getFunctions(undefined, "europe-west8"),
          "selfRevoke"
        );
        await fn({});
      } catch {
        // server revoke is best-effort; local sign-out proceeds regardless
      }
    }
    await fbSignOut(this.auth);
    if (typeof caches !== "undefined") {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch {
        // ignore cache failures
      }
    }
  }

  private async toActorFromToken(fbUser: FbUser): Promise<ActorContext> {
    const tokenResult = await fbUser.getIdTokenResult();
    const claims = tokenResult.claims as {
      vet?: boolean;
      roleId?: string;
      caps?: string[];
      name?: string;
    };
    const displayName =
      claims.name ?? fbUser.displayName ?? fbUser.email ?? fbUser.uid;
    return {
      uid: fbUser.uid,
      email: fbUser.email ?? "",
      displayName,
      roleId: claims.roleId ?? "",
      caps: new Set(decodeCaps(claims.caps ?? [])),
      approved: claims.vet === true,
    };
  }
}
