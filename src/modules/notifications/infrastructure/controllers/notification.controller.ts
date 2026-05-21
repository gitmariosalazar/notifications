import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SendNotificationUseCase } from '../../application/usecases/SendNotificationUseCase';
import { GetUnreadNotificationsUseCase } from '../../application/usecases/GetUnreadNotificationsUseCase';
import { GetAllNotificationsUseCase } from '../../application/usecases/GetAllNotificationsUseCase';
import { MarkAsReadUseCase } from '../../application/usecases/MarkAsReadUseCase';
import { MarkAllAsReadUseCase } from '../../application/usecases/MarkAllAsReadUseCase';
import { GetUnreadCountUseCase } from '../../application/usecases/GetUnreadCountUseCase';
import { NotifyDocumentosRechazadosUseCase } from '../../application/usecases/acometidas/NotifyDocumentosRechazadosUseCase';
import { NotifyInformeRechazadoUseCase } from '../../application/usecases/acometidas/NotifyInformeRechazadoUseCase';
import { NotifySuministroActivoUseCase } from '../../application/usecases/acometidas/NotifySuministroActivoUseCase';
import { NotifyDocsSubmittedUseCase } from '../../application/usecases/acometidas/NotifyDocsSubmittedUseCase';

/**
 * NotificationController — Adaptador de entrada Kafka.
 * Escucha los MessagePatterns del topic notifications_topic.
 * SRP: Solo traduce mensajes Kafka a llamadas de UseCase.
 */
@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    // Casos de uso genéricos
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getUnreadUseCase: GetUnreadNotificationsUseCase,
    private readonly getAllUseCase: GetAllNotificationsUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly markAllAsReadUseCase: MarkAllAsReadUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    // Casos de uso especializados BPMN — Acometidas
    private readonly notifyDocsRechazadosUseCase: NotifyDocumentosRechazadosUseCase,
    private readonly notifyInformeRechazadoUseCase: NotifyInformeRechazadoUseCase,
    private readonly notifySuministroActivoUseCase: NotifySuministroActivoUseCase,
    private readonly notifyDocsSubmittedUseCase: NotifyDocsSubmittedUseCase,
  ) {}

  // ── Operaciones genéricas ─────────────────────────────────────────────────

  @MessagePattern('notifications.send')
  async send(@Payload() dto: any) {
    this.logger.log(`[notifications.send] user: ${dto.userId}`);
    return await this.sendNotificationUseCase.execute(dto);
  }

  @MessagePattern('notifications.get_unread')
  async getUnread(@Payload() payload: { userId: string; limit?: number; offset?: number }) {
    this.logger.log(`[notifications.get_unread] user: ${payload.userId}`);
    return await this.getUnreadUseCase.execute(payload.userId, payload.limit, payload.offset);
  }

  @MessagePattern('notifications.get_all')
  async getAll(@Payload() payload: { userId: string; limit?: number; offset?: number }) {
    this.logger.log(`[notifications.get_all] user: ${payload.userId}`);
    return await this.getAllUseCase.execute(payload.userId, payload.limit, payload.offset);
  }

  @MessagePattern('notifications.get_unread_count')
  async getUnreadCount(@Payload() userId: string) {
    this.logger.log(`[notifications.get_unread_count] user: ${userId}`);
    return await this.getUnreadCountUseCase.execute(userId);
  }

  @MessagePattern('notifications.mark_as_read')
  async markAsRead(@Payload() payload: { notificationId: string; userId: string }) {
    this.logger.log(`[notifications.mark_as_read] notif: ${payload.notificationId}`);
    return await this.markAsReadUseCase.execute(payload.notificationId, payload.userId);
  }

  @MessagePattern('notifications.mark_all_as_read')
  async markAllAsRead(@Payload() userId: string) {
    this.logger.log(`[notifications.mark_all_as_read] user: ${userId}`);
    return await this.markAllAsReadUseCase.execute(userId);
  }

  // ── Notificaciones especializadas del proceso BPMN de Acometidas ──────────

  @MessagePattern('notifications.acometidas.docs_rechazados')
  async notifyDocsRechazados(
    @Payload() payload: { userId: string; solicitudId: string; motivo: string; metadata?: Record<string, any> },
  ) {
    this.logger.log(`[notifications.acometidas.docs_rechazados] solicitud: ${payload.solicitudId}`);
    return await this.notifyDocsRechazadosUseCase.execute(payload);
  }

  @MessagePattern('notifications.acometidas.informe_rechazado')
  async notifyInformeRechazado(
    @Payload() payload: { userId: string; solicitudId: string; motivoRechazo: string; metadata?: Record<string, any> },
  ) {
    this.logger.log(`[notifications.acometidas.informe_rechazado] solicitud: ${payload.solicitudId}`);
    return await this.notifyInformeRechazadoUseCase.execute(payload);
  }

  @MessagePattern('notifications.acometidas.suministro_activo')
  async notifySuministroActivo(
    @Payload() payload: { userId: string; solicitudId: string; numeroCuenta: string; numeroMedidor: string; metadata?: Record<string, any> },
  ) {
    this.logger.log(`[notifications.acometidas.suministro_activo] solicitud: ${payload.solicitudId}`);
    return await this.notifySuministroActivoUseCase.execute(payload);
  }

  @MessagePattern('notifications.acometidas.docs_submitted')
  async notifyDocsSubmitted(
    @Payload() payload: { userId: string; solicitudId: string; numDocumentos: number; metadata?: Record<string, any> },
  ) {
    this.logger.log(`[notifications.acometidas.docs_submitted] solicitud: ${payload.solicitudId}, docs: ${payload.numDocumentos}`);
    return await this.notifyDocsSubmittedUseCase.execute(payload);
  }
}
