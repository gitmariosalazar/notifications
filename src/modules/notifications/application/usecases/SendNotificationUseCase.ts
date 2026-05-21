import { Inject, Injectable, Logger } from '@nestjs/common';
import { INotificationRepository } from '../../domain/contracts/notification.interface.repository';
import { INotificationChannelSender } from '../../domain/contracts/channel-sender.interface';
import { SendNotificationDto } from '../dto/request/send-notification.dto';

/**
 * SendNotificationUseCase — Orquestador Central de Mensajería.
 * 
 * Aplica los principios de CLEAN ARCHITECTURE y SOLID al máximo nivel:
 *  - SRP (Single Responsibility Principle): Coordina la persistencia inicial y delega el despacho físico.
 *  - OCP (Open/Closed Principle): Abierto a nuevos canales (ej. WhatsApp, Telegram, etc.) sin editar esta clase.
 *    Solo creas un nuevo `INotificationChannelSender` y lo registras en el módulo.
 *  - LSP (Liskov Substitution Principle): Cualquier Strategy de canal es perfectamente intercambiable.
 *  - DIP (Dependency Inversion Principle): Depende exclusivamente de abstracciones (interfaces), no de detalles.
 */
@Injectable()
export class SendNotificationUseCase {
  private readonly logger = new Logger(SendNotificationUseCase.name);

  constructor(
    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,
    
    // Inyecta dinámicamente TODAS las estrategias de canales físicas registradas (Strategy Pattern)
    @Inject('INotificationChannelSender')
    private readonly channelSenders: INotificationChannelSender[],
  ) {}

  async execute(dto: SendNotificationDto): Promise<string> {
    const channelCode = dto.channel || 'IN_APP';
    
    // 1. Guardar atómicamente el registro en la BD en estado PENDING
    const notificationId = await this.repository.send(
      dto.userId,
      dto.title,
      dto.body,
      channelCode as any,
      dto.priority ?? 'NORMAL',
      dto.entityType ?? null,
      dto.entityId ?? null,
      dto.metadata ?? {},
    );

    // 2. Resolver la estrategia física correspondiente de forma dinámica
    const senderStrategy = this.channelSenders.find(
      (sender) => sender.getChannelCode().toUpperCase() === channelCode.toUpperCase()
    );

    if (senderStrategy) {
      // Si existe un despachador físico (EMAIL, SMS, PUSH, etc.), lo corremos asíncronamente
      // Esto evita demoras de red y bloqueos en el flujo del cliente.
      this.dispatchPhysicalNotification(senderStrategy, notificationId, dto.userId, dto.title, dto.body);
    } else {
      // Para canales como IN_APP que no tienen un despachador de red físico (sino que se manejan
      // directamente por el trigger de WebSocket de la base de datos), marcamos como SENT de inmediato.
      this.repository.updateDispatchStatus(notificationId, 'SENT', { info: 'Direct delivery via IN_APP trigger' });
    }

    return notificationId;
  }

  /**
   * Ejecuta el despacho físico de forma segura en segundo plano (Fire-and-Forget).
   */
  private async dispatchPhysicalNotification(
    strategy: INotificationChannelSender,
    notificationId: string,
    userId: string,
    title: string,
    body: string
  ): Promise<void> {
    const channel = strategy.getChannelCode();
    try {
      this.logger.log(`[DISPATCH] Iniciando despacho físico por canal: ${channel} para notif: ${notificationId}`);

      // 1. Despachar a través de la estrategia concreta
      const result = await strategy.send(userId, title, body);

      // 2. Registrar el resultado (éxito/error) en la base de datos y auditoría de despacho
      if (result.success) {
        await this.repository.updateDispatchStatus(
          notificationId,
          'SENT',
          result.providerResponse,
          undefined
        );
        this.logger.log(`[DISPATCH SUCCESS] Notificación ${notificationId} despachada por ${channel}`);
      } else {
        await this.repository.updateDispatchStatus(
          notificationId,
          'FAILED',
          result.providerResponse,
          result.errorMessage
        );
        this.logger.warn(
          `[DISPATCH FAILED] Canal ${channel} falló para notif ${notificationId}. Razón: ${result.errorMessage}`
        );
      }
    } catch (err: any) {
      this.logger.error(
        `[DISPATCH CRITICAL ERROR] Excepción al procesar canal ${channel} para notif ${notificationId}: ${err.message}`
      );
      try {
        await this.repository.updateDispatchStatus(
          notificationId,
          'FAILED',
          { error: err.stack },
          `Excepción interna: ${err.message}`
        );
      } catch (dbErr: any) {
        this.logger.error(`[DB UPDATE ERROR] No se pudo registrar estado FAILED en BD: ${dbErr.message}`);
      }
    }
  }
}
