import { Inject, Injectable, Logger } from '@nestjs/common';
import { INotificationChannelSender, ChannelSendResult } from '../../../domain/contracts/channel-sender.interface';
import { IEmailSender } from '../../../domain/contracts/email-sender.interface';
import { INotificationRepository } from '../../../domain/contracts/notification.interface.repository';

/**
 * EmailChannelSender — Strategy para el canal EMAIL.
 * Despacha correos electrónicos utilizando el proveedor IEmailSender inyectado.
 */
@Injectable()
export class EmailChannelSender implements INotificationChannelSender {
  private readonly logger = new Logger(EmailChannelSender.name);

  constructor(
    @Inject('IEmailSender')
    private readonly emailSender: IEmailSender,
    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,
  ) {}

  getChannelCode(): string {
    return 'EMAIL';
  }

  async send(
    userId: string,
    title: string,
    body: string,
  ): Promise<ChannelSendResult> {
    const email = await this.repository.findUserEmail(userId);
    if (!email) {
      this.logger.warn(`[EMAIL SENDER] Usuario ${userId} no tiene un email activo registrado.`);
      return {
        success: false,
        errorMessage: 'El usuario no tiene un correo electrónico activo registrado.',
      };
    }

    const result = await this.emailSender.sendEmail(email, title, body);
    
    return {
      success: result.success,
      messageId: result.messageId,
      errorMessage: result.errorMessage,
      providerResponse: result.providerResponse,
    };
  }
}
