import { PermissionDeniedError } from "@vet/shared";
import type { MailRepository } from "@vet/shared";

export class FirestoreMailRepository implements MailRepository {
  async send(): Promise<void> {
    throw new PermissionDeniedError(
      "mail writes must originate from cloud functions"
    );
  }
}
