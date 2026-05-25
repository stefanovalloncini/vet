export interface MailMessage {
  subject: string;
  html: string;
}

export interface MailSendInput {
  to: string;
  message: MailMessage;
  kind?: string;
  aziendaId?: string;
  period?: string;
}

export interface MailRepository {
  /** Append a transactional mail to the `mail` collection (Firestore Trigger Email). */
  send(input: MailSendInput): Promise<void>;
}
