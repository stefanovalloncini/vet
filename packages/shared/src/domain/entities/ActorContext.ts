import type { Capability } from "../caps/registry";

export interface ActorContext {
  uid: string;
  email: string;
  displayName: string;
  roleId: string;
  caps: ReadonlySet<Capability>;
}
