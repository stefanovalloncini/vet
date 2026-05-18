export interface User {
  uid: string;
  email: string;
  displayName: string;
  roleId: string;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt?: Date;
  schemaVersion: number;
}
