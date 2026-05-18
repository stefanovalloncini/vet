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
import type {
  ActorContext,
  AuthService,
  AuthStateSubscriber,
  Capability,
} from "@vet/shared";

const EMAIL_LINK_STORAGE_KEY = "vet.signInEmail";

export class FirebaseAuthService implements AuthService {
  private current: ActorContext | null = null;
  private readonly subscribers = new Set<AuthStateSubscriber>();

  constructor(private readonly auth: Auth) {
    onIdTokenChanged(this.auth, async (fbUser) => {
      this.current = fbUser ? await this.toActor(fbUser) : null;
      for (const cb of this.subscribers) cb(this.current);
    });
  }

  getCurrentUser(): ActorContext | null {
    return this.current;
  }

  subscribe(cb: AuthStateSubscriber): () => void {
    this.subscribers.add(cb);
    cb(this.current);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
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

  async completeEmailSignIn(emailLinkUrl: string): Promise<void> {
    if (!isSignInWithEmailLink(this.auth, emailLinkUrl)) {
      throw new Error("invalid sign-in link");
    }
    const email = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
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
    return {
      uid: fbUser.uid,
      email: fbUser.email ?? "",
      displayName: fbUser.displayName ?? fbUser.email ?? fbUser.uid,
      roleId: claims.roleId ?? "",
      caps: new Set((claims.caps as Capability[] | undefined) ?? []),
    };
  }
}
