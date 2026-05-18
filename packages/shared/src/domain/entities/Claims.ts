import type { Capability } from "../caps/registry";

export interface Claims {
  vet: true;
  roleId: string;
  caps: Capability[];
  capsVer: number;
}
