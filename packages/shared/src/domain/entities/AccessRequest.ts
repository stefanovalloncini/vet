export interface AccessRequest {
  emailNorm: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  providerId?: string;
  firstAttemptAt: Date;
  lastAttemptAt: Date;
  attempts: number;
  schemaVersion: 1;
}
