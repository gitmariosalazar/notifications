import { Injectable, Logger } from '@nestjs/common';
import { INotificationChannelSender, ChannelSendResult } from '../../../domain/contracts/channel-sender.interface';

/**
 * SmsChannelSender — Strategy para el canal SMS.
 * OCP en acción: Agregar un nuevo canal (SMS) es solo crear este archivo 
 * y registrarlo, sin modificar una sola línea del core de negocio ni otros canales.
 */
@Injectable()
export class SmsChannelSender implements INotificationChannelSender {
  private readonly logger = new Logger(SmsChannelSender.name);

  getChannelCode(): string {
    return 'SMS';
  }

  async send(
    userId: string,
    title: string,
    body: string,
  ): Promise<ChannelSendResult> {
    this.logger.log(`=== [PHYSICAL SMS DISPATCH] ===`);
    this.logger.log(`Para Usuario ID: ${userId}`);
    this.logger.log(`Mensaje (SMS): [${title}] ${body}`);
    this.logger.log(`===============================`);

    // Listo para integrar con Twilio, Infobip, etc.
    return {
      success: true,
      messageId: `sms-msg-${Date.now()}`,
      providerResponse: { info: 'Sent via SMS console provider mock' }
    };
  }
}
