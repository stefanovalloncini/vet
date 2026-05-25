import type { AuthService } from "@vet/shared";

export class NotSupportedAuthService implements AuthService {
  getCurrentUser(): null {
    return null;
  }

  subscribe(): () => void {
    throw new Error(
      "AuthService.subscribe is a client-only listener; not supported in cloud functions"
    );
  }

  subscribeRevocation(): () => void {
    throw new Error(
      "AuthService.subscribeRevocation is a client-only listener; not supported in cloud functions"
    );
  }

  async signInWithGoogle(): Promise<void> {
    throw new Error("AuthService.signInWithGoogle is client-only");
  }

  async sendEmailSignInLink(): Promise<void> {
    throw new Error("AuthService.sendEmailSignInLink is client-only");
  }

  async completeEmailSignIn(): Promise<void> {
    throw new Error("AuthService.completeEmailSignIn is client-only");
  }

  async signOut(): Promise<void> {
    throw new Error("AuthService.signOut is client-only");
  }
}
