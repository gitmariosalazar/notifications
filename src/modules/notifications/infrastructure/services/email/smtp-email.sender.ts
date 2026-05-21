import { Injectable, Logger } from '@nestjs/common';
import { IEmailSender, EmailSendResult } from '../../../domain/contracts/email-sender.interface';
import { environments } from '../../../../../settings/environments/environments';
import * as nodemailer from 'nodemailer';

/**
 * SmtpEmailSender — Proveedor SMTP de producción.
 * Utiliza Nodemailer de forma asíncrona.
 * Lee la configuración de forma centralizada y segura.
 */
@Injectable()
export class SmtpEmailSender implements IEmailSender {
  private readonly logger = new Logger(SmtpEmailSender.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Leemos las credenciales desde variables de entorno
    // Se configuran valores predeterminados para evitar fallos si no están definidas
    const host = process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const port = Number(process.env.SMTP_PORT) || 2525;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    const secure = process.env.SMTP_SECURE === 'true';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: { from?: string; html?: string }
  ): Promise<EmailSendResult> {
    try {
      const fromAddress = options?.from || process.env.SMTP_FROM || 'SIGEPAA <no-reply@sigepaa.com>';
      
      const mailOptions: nodemailer.SendMailOptions = {
        from: fromAddress,
        to,
        subject,
        text: body,
        html: options?.html || body,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`[SMTP EMAIL] Mensaje enviado exitosamente. ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        providerResponse: {
          envelope: info.envelope,
          accepted: info.accepted,
          rejected: info.rejected,
        },
      };
    } catch (error: any) {
      this.logger.error(`[SMTP EMAIL ERROR] Fallo al enviar correo a ${to}: ${error.message}`);
      return {
        success: false,
        errorMessage: error.message,
        providerResponse: { error },
      };
    }
  }
}
