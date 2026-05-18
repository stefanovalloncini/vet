import type { ActorContext } from "../domain/entities/ActorContext.js";
import type { AuthService, AuthStateSubscriber } from "../domain/ports/AuthService.js";

export class InMemoryAuthService implements AuthService {
  private current: ActorContext | null = null;
  private readonly subscribers = new Set<AuthStateSubscriber>();

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
    throw new Error("InMemoryAuthService.signInWithGoogle: use setSimulatedUser in tests");
  }

  async sendEmailSignInLink(): Promise<void> {
    throw new Error("InMemoryAuthService.sendEmailSignInLink: not supported in tests");
  }

  async completeEmailSignIn(): Promise<void> {
    throw new Error("InMemoryAuthService.completeEmailSignIn: use setSimulatedUser in tests");
  }

  async signOut(): Promise<void> {
    this.current = null;
    this.notify();
  }

  setSimulatedUser(user: ActorContext | null): void {
    this.current = user;
    this.notify();
  }

  private notify(): void {
    for (const cb of this.subscribers) cb(this.current);
  }
}
