import type { AccessRequest } from "../entities/AccessRequest.js";

export interface AccessRequestRepository {
  list(): Promise<AccessRequest[]>;
  getByEmail(emailNorm: string): Promise<AccessRequest | null>;
}
