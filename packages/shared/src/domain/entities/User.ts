export interface User {
  uid: string;
  email: string;
  displayName: string;
  roleId: string;
  approved: boolean;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  schemaVersion: number;
}
