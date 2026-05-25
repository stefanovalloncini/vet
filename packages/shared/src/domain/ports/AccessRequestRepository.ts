import type { AccessRequest } from "../entities/AccessRequest.js";
import type { AccessRequestRecordInput } from "../../firestore-dto/accessRequest.js";

export interface AccessRequestRecordResult {
  kind: "create" | "update" | "storm";
  attempts: number;
}

export interface AccessRequestRepository {
  list(): Promise<AccessRequest[]>;
  getByEmail(emailNorm: string): Promise<AccessRequest | null>;
  delete(emailNorm: string): Promise<void>;
  record(input: AccessRequestRecordInput): Promise<AccessRequestRecordResult>;
}
