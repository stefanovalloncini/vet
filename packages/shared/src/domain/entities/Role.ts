import type { Capability } from "../caps/registry.js";

export interface Role {
  id: string;
  name: string;
  description?: string;
  capabilities: Capability[];
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  schemaVersion: number;
}
