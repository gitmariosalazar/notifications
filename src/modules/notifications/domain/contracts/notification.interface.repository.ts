import { NotificationModel, NotificationChannel, NotificationPriority } from '../schemas/models/NotificationModel';

/**
 * INotificationRepository — Contrato de dominio (ISP, DIP).
 * La capa de aplicación depende de esta abstracción, nunca de la BD.
 */
export interface INotificationRepository {
  /**
   * Crea una notificación usando la función SQL `notifications.enviar_notificacion`.
   * Retorna el ID generado.
   */
  send(
    userId: string,
    title: string,
    body: string,
    channel: NotificationChannel,
    priority: NotificationPriority,
    entityType: string | null,
    entityId: string | null,
    metadata: Record<string, any>,
  ): Promise<string>;

  /** Lista de notificaciones no leídas de un usuario */
  findUnreadByUserId(userId: string, limit: number, offset: number): Promise<NotificationModel[]>;

  /** Lista completa de notificaciones de un usuario (leídas y no leídas) */
  findAllByUserId(userId: string, limit: number, offset: number): Promise<NotificationModel[]>;

  /** Marca una notificación como leída */
  markAsRead(notificationId: string, userId: string): Promise<boolean>;

  /** Marca todas las notificaciones de un usuario como leídas */
  markAllAsRead(userId: string): Promise<number>;

  /** Cuenta las notificaciones no leídas */
  countUnread(userId: string): Promise<number>;

  /** Retorna notificaciones por tipo de entidad (ej: todas las de una solicitud) */
  findByEntity(entityType: string, entityId: string): Promise<NotificationModel[]>;

  /** Retorna el correo electrónico del usuario desde public.usuarios */
  findUserEmail(userId: string): Promise<string | null>;

  /** Registra e inserta un intento de despacho de un proveedor externo */
  updateDispatchStatus(
    notificationId: string,
    statusCode: 'SENT' | 'FAILED' | 'DELIVERED' | 'PENDING',
    providerResponse?: any,
    errorMessage?: string
  ): Promise<void>;
}
