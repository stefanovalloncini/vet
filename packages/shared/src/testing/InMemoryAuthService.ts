import type { ActorContext } from "../domain/entities/ActorContext.js";
import type {
  AuthService,
  AuthStateSubscriber,
  SessionRevokedReason,
  SessionRevokedSubscriber,
} from "../domain/ports/AuthService.js";

export class InMemoryAuthService implements AuthService {
  private current: ActorContext | null = null;
  private readonly subscribers = new Set<AuthStateSubscriber>();
  private readonly revocationSubscribers = new Map<
    string,
    Set<SessionRevokedSubscriber>
  >();

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

  subscribeRevocation(uid: string, cb: SessionRevokedSubscriber): () => void {
    const set = this.revocationSubscribers.get(uid) ?? new Set();
    set.add(cb);
    this.revocationSubscribers.set(uid, set);
    return () => {
      set.delete(cb);
      if (set.size === 0) this.revocationSubscribers.delete(uid);
    };
  }

  simulateRevocation(uid: string, reason: SessionRevokedReason = "disabled"): void {
    const set = this.revocationSubscribers.get(uid);
    if (!set) return;
    for (const cb of set) cb(reason);
  }

  async signInWithGoogle(_options?: { selectAccount?: boolean }): Promise<void> {
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
