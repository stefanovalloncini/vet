import { logger } from "firebase-functions/v2";
import { normalizeEmail } from "@vet/shared";
import { getRepositories } from "../infrastructure/composition.js";

export interface RecordAccessRequestInput {
  email: string;
  displayName: string | undefined;
  photoURL: string | undefined;
  providerId: string | undefined;
  source: "beforeUserCreated" | "beforeSignIn";
}

export async function recordAccessRequest(
  input: RecordAccessRequestInput
): Promise<void> {
  const emailNorm = normalizeEmail(input.email);
  try {
    const result = await getRepositories().accessRequests.record({
      emailNorm,
      email: input.email,
      displayName: input.displayName,
      photoURL: input.photoURL,
      providerId: input.providerId,
    });
    if (result.kind === "storm") {
      logger.warn("auth.accessRequest.storm", {
        source: input.source,
        email: emailNorm,
        attempts: result.attempts,
      });
    }
  } catch (err) {
    logger.error("auth.accessRequest.recordFailed", {
      source: input.source,
      email: emailNorm,
      errorName: err instanceof Error ? err.name : "Unknown",
      errorCode:
        err instanceof Error && "code" in err
          ? String((err as { code: unknown }).code)
          : undefined,
    });
  }
}
