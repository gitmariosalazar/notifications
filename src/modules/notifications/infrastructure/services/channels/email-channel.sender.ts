import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { INotificationChannelSender, ChannelSendResult } from '../../../domain/contracts/channel-sender.interface';
import { IEmailSender } from '../../../domain/contracts/email-sender.interface';
import { INotificationRepository } from '../../../domain/contracts/notification.interface.repository';
import { ITemplateService } from '../../../domain/contracts/template.service.interface';

/**
 * EmailChannelSender — Strategy para el canal EMAIL.
 *
 * Mejoras respecto a la versión anterior:
 *  - Soporta templates HTML cuando el payload incluye `metadata.templateId`.
 *  - Si no hay template, envía el `body` plano (retrocompatible).
 *  - Soporta archivos adjuntos vía `metadata.attachments`.
 *
 * SOLID:
 *  SRP — solo despacha emails; la renderización la delega a ITemplateService
 *  OCP — nuevas variantes de email (con PDF, etc.) se resuelven en el template, no aquí
 *  DIP — depende de IEmailSender e ITemplateService (abstracciones), no de Nodemailer
 */
@Injectable()
export class EmailChannelSender implements INotificationChannelSender {
  private readonly logger = new Logger(EmailChannelSender.name);

  constructor(
    @Inject('IEmailSender')
    private readonly emailSender: IEmailSender,

    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,

    @Optional()
    @Inject('ITemplateService')
    private readonly templateService: ITemplateService | null,
  ) {}

  getChannelCode(): string {
    return 'EMAIL';
  }

  async send(
    userId: string,
    title: string,
    body: string,
    metadata?: Record<string, any>,
  ): Promise<ChannelSendResult> {
    // 1. Resolve recipient email
    const email = await this.repository.findUserEmail(userId);
    if (!email) {
      this.logger.warn(`[EMAIL SENDER] Usuario ${userId} no tiene un email activo registrado.`);
      return {
        success: false,
        errorMessage: 'El usuario no tiene un correo electrónico activo registrado.',
      };
    }

    // 2. Build HTML body — use template if provided, otherwise fall back to plain body
    let htmlBody: string | undefined;

    if (metadata?.templateId && this.templateService) {
      try {
        htmlBody = await this.templateService.render(
          metadata.templateId as string,
          metadata.templateVars ?? {},
        );
        this.logger.log(`[EMAIL SENDER] Template "${metadata.templateId}" rendered for user ${userId}`);
      } catch (err: any) {
        this.logger.warn(`[EMAIL SENDER] Template render failed: ${err.message}. Falling back to plain body.`);
      }
    }

    // 3. Resolve attachments
    const attachments: Array<{ filename: string; content: any }> =
      metadata?.attachments ?? [];

    // 4. Send
    const result = await this.emailSender.sendEmail(email, title, body, {
      html: htmlBody,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return {
      success:         result.success,
      messageId:       result.messageId,
      errorMessage:    result.errorMessage,
      providerResponse: result.providerResponse,
    };
  }
}
