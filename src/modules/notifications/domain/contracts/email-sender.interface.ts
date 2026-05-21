export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
  providerResponse?: Record<string, any>;
}

/**
 * IEmailSender — Interface de Dominio (DIP).
 * Representa el puerto de salida para el canal EMAIL.
 * Cualquier proveedor (SMTP, SendGrid, Amazon SES) debe implementar esta interfaz.
 */
export interface IEmailSender {
  sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: {
      from?: string;
      html?: string;
      attachments?: Array<{ filename: string; content: any }>;
    }
  ): Promise<EmailSendResult>;
}
