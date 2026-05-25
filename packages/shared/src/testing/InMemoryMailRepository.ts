import type {
  MailRepository,
  MailSendInput,
} from "../domain/ports/MailRepository.js";

export class InMemoryMailRepository implements MailRepository {
  readonly sent: MailSendInput[] = [];

  async send(input: MailSendInput): Promise<void> {
    this.sent.push(input);
  }
}
