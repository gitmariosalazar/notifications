import { Inject, Injectable, Logger } from '@nestjs/common';
import { INotificationChannelSender, ChannelSendResult } from '../../../domain/contracts/channel-sender.interface';
import { INotificationRepository } from '../../../domain/contracts/notification.interface.repository';
import { environments } from '../../../../../settings/environments/environments';

/**
 * WhatsappChannelSender — Strategy para el canal WHATSAPP.
 * Conecta con la Meta Cloud API oficial de WhatsApp Business.
 */
@Injectable()
export class WhatsappChannelSender implements INotificationChannelSender {
  private readonly logger = new Logger(WhatsappChannelSender.name);

  constructor(
    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,
  ) {}

  getChannelCode(): string {
    return 'WHATSAPP';
  }

  async send(
    userId: string,
    title: string,
    body: string,
  ): Promise<ChannelSendResult> {
    // 1. Obtener el número de teléfono del usuario
    const rawPhone = await this.repository.findUserPhone(userId);
    if (!rawPhone) {
      this.logger.warn(`[WHATSAPP SENDER] El usuario ${userId} no tiene un teléfono registrado.`);
      return {
        success: false,
        errorMessage: 'El usuario no tiene un teléfono registrado en la base de datos.',
      };
    }

    // 2. Sanitizar y formatear el número de teléfono para Meta Cloud API (ej: 5939xxxxxxxx para Ecuador)
    let phone = rawPhone.replace(/\D/g, ''); // Conservar solo dígitos
    if (phone.startsWith('09') && phone.length === 10) {
      phone = '593' + phone.substring(1);
    } else if (phone.startsWith('9') && phone.length === 9) {
      phone = '593' + phone;
    }

    // 3. Obtener credenciales de las variables de entorno
    const accessToken = environments.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = environments.WHATSAPP_PHONE_NUMBER_ID;
    const version = environments.WHATSAPP_VERSION || 'v19.0';
    const templateName = environments.WHATSAPP_TEMPLATE_NAME;

    // 4. Degradar graciosamente a Mock si no están configuradas las llaves en .env
    if (!accessToken || !phoneNumberId) {
      this.logger.log(`=== [PHYSICAL WHATSAPP DISPATCH (MOCK)] ===`);
      this.logger.log(`Para Usuario ID: ${userId} (${phone})`);
      this.logger.log(`Mensaje (WhatsApp): [${title}] ${body}`);
      this.logger.log(`===========================================`);
      return {
        success: true,
        messageId: `wa-mock-msg-${Date.now()}`,
        providerResponse: { info: 'Sent via Whatsapp official provider mock (Missing Access Token / Phone Number ID in env)' }
      };
    }

    // 5. Enviar mensaje físico real a la API de Meta
    try {
      const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
      
      const payload = templateName
        ? {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: 'es',
              },
              components: [
                {
                  type: 'body',
                  parameters: [
                    {
                      type: 'text',
                      text: title,
                    },
                    {
                      type: 'text',
                      text: body,
                    },
                  ],
                },
              ],
            },
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone,
            type: 'text',
            text: {
              body: `*${title}*\n\n${body}`,
            },
          };

      this.logger.log(`[WHATSAPP SENDER] Enviando POST a Meta Cloud API: ${url} para ${phone}`);

      const response = await (global as any).fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (response.ok) {
        const messageId = data.messages?.[0]?.id || `wa-msg-${Date.now()}`;
        this.logger.log(`[WHATSAPP SUCCESS] Mensaje enviado exitosamente a ${phone}. Message ID: ${messageId}`);
        return {
          success: true,
          messageId,
          providerResponse: data,
        };
      } else {
        const errMsg = data.error?.message || response.statusText;
        this.logger.error(`[WHATSAPP ERROR] Meta API retornó un error: ${errMsg}`, JSON.stringify(data));
        return {
          success: false,
          errorMessage: `Meta API Error: ${errMsg}`,
          providerResponse: data,
        };
      }
    } catch (err: any) {
      this.logger.error(`[WHATSAPP CRITICAL ERROR] Excepción al realizar petición HTTP a Meta: ${err.message}`);
      return {
        success: false,
        errorMessage: `Excepción HTTP: ${err.message}`,
      };
    }
  }
}
