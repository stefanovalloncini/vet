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
  type Firestore,
} from "firebase/firestore";
import type {
  ActorContext,
  AuthService,
  AuthStateSubscriber,
} from "@vet/shared";
import { decodeCaps } from "@vet/shared";

const EMAIL_LINK_STORAGE_KEY = "vet.signInEmail";

export class FirebaseAuthService implements AuthService {
  private current: ActorContext | null = null;
  private initialized = false;
  private readonly subscribers = new Set<AuthStateSubscriber>();

  constructor(
    private readonly auth: Auth,
    private readonly firestore: Firestore
  ) {
    onIdTokenChanged(this.auth, async (fbUser) => {
      this.current = fbUser ? await this.toActor(fbUser) : null;
      this.initialized = true;
      for (const cb of this.subscribers) cb(this.current);
    });
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
    window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
  }

  async completeEmailSignIn(emailLinkUrl: string, providedEmail?: string): Promise<void> {
    if (!isSignInWithEmailLink(this.auth, emailLinkUrl)) {
      throw new Error("invalid sign-in link");
    }
    const stored = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
    const email = providedEmail ?? stored;
    if (!email) throw new Error("email not remembered for sign-in");
    await signInWithEmailLink(this.auth, email, emailLinkUrl);
    window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
  }

  async signOut(): Promise<void> {
    await fbSignOut(this.auth);
  }

  private async toActor(fbUser: FbUser): Promise<ActorContext> {
    const tokenResult = await fbUser.getIdTokenResult();
    const claims = tokenResult.claims as {
      vet?: boolean;
      roleId?: string;
      caps?: string[];
    };
    let displayName = fbUser.displayName ?? fbUser.email ?? fbUser.uid;
    if (claims.vet) {
      try {
        const userSnap = await getDoc(doc(this.firestore, "users", fbUser.uid));
        const stored = userSnap.exists()
          ? (userSnap.data()["displayName"] as string | undefined)
          : undefined;
        if (stored) displayName = stored;
      } catch {
        // fall back to fbUser.displayName
      }
    }
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
