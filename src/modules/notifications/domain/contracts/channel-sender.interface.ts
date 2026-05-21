export interface ChannelSendResult {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
  providerResponse?: Record<string, any>;
}

/**
 * INotificationChannelSender — Interface de Dominio (Strategy Pattern / SOLID DIP).
 * Representa el contrato para despachar una notificación por un canal específico.
 * Cualquier canal de envío físico (EMAIL, SMS, PUSH, WHATSAPP) debe implementar esto.
 */
export interface INotificationChannelSender {
  /**
   * Retorna el código de canal que maneja este despachador (ej. 'EMAIL', 'SMS').
   */
  getChannelCode(): string;

  /**
   * Ejecuta el despacho físico de la notificación de manera asíncrona.
   */
  send(
    userId: string,
    title: string,
    body: string,
    metadata?: Record<string, any>
  ): Promise<ChannelSendResult>;
}
