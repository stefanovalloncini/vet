import type { Capability } from "../caps/registry.js";

export interface Claims {
  vet: true;
  roleId: string;
  caps: Capability[];
  capsVer: number;
}
