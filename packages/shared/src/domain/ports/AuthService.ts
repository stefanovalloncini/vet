import type { ActorContext } from "../entities/ActorContext.js";

export type SignInMethod = "google" | "emailLink";

export type AuthStateSubscriber = (user: ActorContext | null) => void;

export type SessionRevokedReason = "disabled" | "claims-cleared";

export type SessionRevokedSubscriber = (reason: SessionRevokedReason) => void;

export interface SignInWithGoogleOptions {
  selectAccount?: boolean;
}

export interface AuthService {
  getCurrentUser(): ActorContext | null;
  subscribe(cb: AuthStateSubscriber): () => void;
  subscribeRevocation(uid: string, cb: SessionRevokedSubscriber): () => void;
  signInWithGoogle(options?: SignInWithGoogleOptions): Promise<void>;
  sendEmailSignInLink(email: string): Promise<void>;
  completeEmailSignIn(emailLinkUrl: string, providedEmail?: string): Promise<void>;
  signOut(): Promise<void>;
}
