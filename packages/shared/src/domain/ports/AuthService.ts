import type { ActorContext } from "../entities/ActorContext.js";

export type SignInMethod = "google" | "emailLink";

export type AuthStateSubscriber = (user: ActorContext | null) => void;

export interface AuthService {
  getCurrentUser(): ActorContext | null;
  subscribe(cb: AuthStateSubscriber): () => void;
  signInWithGoogle(): Promise<void>;
  sendEmailSignInLink(email: string): Promise<void>;
  completeEmailSignIn(emailLinkUrl: string): Promise<void>;
  signOut(): Promise<void>;
}
