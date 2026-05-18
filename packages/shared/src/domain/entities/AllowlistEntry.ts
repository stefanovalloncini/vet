export interface AllowlistEntry {
  emailNorm: string;
  email: string;
  defaultRoleId: string;
  invitedBy: string;
  invitedAt: Date;
  notes?: string;
}
