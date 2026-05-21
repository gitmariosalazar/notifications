import { Injectable, Logger } from '@nestjs/common';
import { IEmailSender, EmailSendResult } from '../../../domain/contracts/email-sender.interface';

/**
 * ConsoleEmailSender — Proveedor de desarrollo (Mock/Dev).
 * Simplemente imprime el email en consola con formato limpio.
 * Evita la necesidad de credenciales SMTP en entornos locales/QA.
 */
@Injectable()
export class ConsoleEmailSender implements IEmailSender {
  private readonly logger = new Logger(ConsoleEmailSender.name);

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: { html?: string }
  ): Promise<EmailSendResult> {
    this.logger.log('=== [CONSOLE EMAIL SENDER] ===');
    this.logger.log(`Para: ${to}`);
    this.logger.log(`Asunto: ${subject}`);
    this.logger.log(`Contenido: ${body}`);
    if (options?.html) {
      this.logger.log(`HTML: ${options.html.substring(0, 100)}...`);
    }
    this.logger.log('==============================');

    return {
      success: true,
      messageId: `console-msg-${Date.now()}`,
      providerResponse: { info: 'Sent via console log' }
    };
  }
}
