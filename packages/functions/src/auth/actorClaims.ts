import { z } from "zod";
import { decodeCaps, type Capability } from "@vet/shared";

export interface ActorClaims {
  readonly email: string;
  readonly caps: Capability[];
}

const claimsSchema = z
  .object({
    email: z.string().optional().catch(undefined),
    caps: z.array(z.unknown()).optional().catch(undefined),
  })
  .passthrough()
  .catch({});

export function readActorClaims(token: unknown): ActorClaims {
  const parsed = claimsSchema.parse(token ?? {});
  const codes = (parsed.caps ?? []).filter(
    (c): c is string => typeof c === "string"
  );
  return { email: parsed.email ?? "", caps: decodeCaps(codes) };
}
