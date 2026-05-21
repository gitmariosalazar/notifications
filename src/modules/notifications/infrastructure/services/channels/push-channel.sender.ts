import { Injectable, Logger } from '@nestjs/common';
import { INotificationChannelSender, ChannelSendResult } from '../../../domain/contracts/channel-sender.interface';

/**
 * PushChannelSender — Strategy para el canal PUSH (Firebase/APNS).
 * Encapsula la lógica de notificaciones móviles de forma totalmente aislada.
 */
@Injectable()
export class PushChannelSender implements INotificationChannelSender {
  private readonly logger = new Logger(PushChannelSender.name);

  getChannelCode(): string {
    return 'PUSH';
  }

  async send(
    userId: string,
    title: string,
    body: string,
  ): Promise<ChannelSendResult> {
    this.logger.log(`=== [PHYSICAL PUSH DISPATCH] ===`);
    this.logger.log(`Para Usuario ID: ${userId}`);
    this.logger.log(`Título: ${title}`);
    this.logger.log(`Cuerpo: ${body}`);
    this.logger.log(`================================`);

    // Listo para integrar con Firebase Admin SDK
    return {
      success: true,
      messageId: `push-msg-${Date.now()}`,
      providerResponse: { info: 'Sent via FCM Mock provider' }
    };
  }
}
