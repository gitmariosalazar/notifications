import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../../domain/contracts/notification.interface.repository';
import { NotificationModel, NotificationChannel, NotificationPriority } from '../../../domain/schemas/models/NotificationModel';
import { DatabaseAbstract } from '../../../../../shared/connections/database/abstract/abstract.database';

/**
 * Implementación PostgreSQL del repositorio de notificaciones.
 * Delega la lógica de negocio (resolución de IDs, triggers) a las funciones SQL del schema.
 * OCP: Si se añade un nuevo canal, no se modifica esta clase — solo se hace INSERT en BD.
 */
@Injectable()
export class NotificationPostgreSQLPersistence implements INotificationRepository {
  constructor(private readonly db: DatabaseAbstract) {}

  /**
   * Usa la función `notifications.enviar_notificacion` que:
   * 1. Resuelve IDs de canal y prioridad por código
   * 2. Inserta en user_notification
   * 3. Dispara el trigger pg_notify para WebSocket en tiempo real
   */
  async send(
    userId: string,
    title: string,
    body: string,
    channel: NotificationChannel,
    priority: NotificationPriority,
    entityType: string | null,
    entityId: string | null,
    metadata: Record<string, any>,
  ): Promise<string> {
    const result = await this.db.query<{ enviar_notificacion: string }>(
      `SELECT notifications.enviar_notificacion($1, $2, $3, $4, $5, $6, $7::uuid, $8) AS enviar_notificacion`,
      [userId, title, body, channel, priority, entityType, entityId, JSON.stringify(metadata)],
    );
    return result[0].enviar_notificacion;
  }

  async findUnreadByUserId(userId: string, limit: number, offset: number): Promise<NotificationModel[]> {
    const rows = await this.db.query<any>(
      `SELECT
          n.notification_id, n.id_usuario, n.titulo, n.cuerpo,
          c.codigo AS canal, p.codigo AS prioridad,
          e.codigo AS estado_envio,
          n.entidad_tipo, n.entidad_id, n.metadata,
          n.is_read, n.read_at, n.created_at, n.updated_at
        FROM notifications.user_notification n
        JOIN notifications.canal c ON c.id_canal = n.id_canal
        JOIN notifications.prioridad p ON p.id_prioridad = n.id_prioridad
        JOIN notifications.estado_envio e ON e.id_estado_envio = n.id_estado_envio
        WHERE n.id_usuario = $1 AND n.is_read = FALSE
        ORDER BY n.created_at DESC
        LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return rows.map(this.toModel);
  }

  async findAllByUserId(userId: string, limit: number, offset: number): Promise<NotificationModel[]> {
    const rows = await this.db.query<any>(
      `SELECT
          n.notification_id, n.id_usuario, n.titulo, n.cuerpo,
          c.codigo AS canal, p.codigo AS prioridad,
          e.codigo AS estado_envio,
          n.entidad_tipo, n.entidad_id, n.metadata,
          n.is_read, n.read_at, n.created_at, n.updated_at
        FROM notifications.user_notification n
        JOIN notifications.canal c ON c.id_canal = n.id_canal
        JOIN notifications.prioridad p ON p.id_prioridad = n.id_prioridad
        JOIN notifications.estado_envio e ON e.id_estado_envio = n.id_estado_envio
        WHERE n.id_usuario = $1
        ORDER BY n.created_at DESC
        LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return rows.map(this.toModel);
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.db.execute(
      `UPDATE notifications.user_notification
        SET is_read = TRUE, read_at = NOW()
        WHERE notification_id = $1 AND id_usuario = $2 AND is_read = FALSE`,
      [notificationId, userId],
    );
    return result.affectedRows > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.db.execute(
      `UPDATE notifications.user_notification
        SET is_read = TRUE, read_at = NOW()
        WHERE id_usuario = $1 AND is_read = FALSE`,
      [userId],
    );
    return result.affectedRows;
  }

  async countUnread(userId: string): Promise<number> {
    const rows = await this.db.query<{ total: string }>(
      `SELECT COUNT(*) AS total
        FROM notifications.user_notification
        WHERE id_usuario = $1 AND is_read = FALSE`,
      [userId],
    );
    return Number(rows[0].total);
  }

  async findByEntity(entityType: string, entityId: string): Promise<NotificationModel[]> {
    const rows = await this.db.query<any>(
      `SELECT
          n.notification_id, n.id_usuario, n.titulo, n.cuerpo,
          c.codigo AS canal, p.codigo AS prioridad,
          e.codigo AS estado_envio,
          n.entidad_tipo, n.entidad_id, n.metadata,
          n.is_read, n.read_at, n.created_at, n.updated_at
        FROM notifications.user_notification n
        JOIN notifications.canal c ON c.id_canal = n.id_canal
        JOIN notifications.prioridad p ON p.id_prioridad = n.id_prioridad
        JOIN notifications.estado_envio e ON e.id_estado_envio = n.id_estado_envio
        WHERE n.entidad_tipo = $1 AND n.entidad_id = $2::uuid
        ORDER BY n.created_at DESC`,
      [entityType, entityId],
    );
    return rows.map(this.toModel);
  }

  async findUserEmail(userId: string): Promise<string | null> {
    const rows = await this.db.query<{ email: string }>(
      `SELECT email FROM public.usuarios WHERE usuario_id = $1 AND activo = TRUE`,
      [userId]
    );
    return rows[0]?.email ?? null;
  }

  async updateDispatchStatus(
    notificationId: string,
    statusCode: 'SENT' | 'FAILED' | 'DELIVERED' | 'PENDING',
    providerResponse?: any,
    errorMessage?: string
  ): Promise<void> {
    // 1. Obtener el id_estado_envio a partir de su código único
    const rows = await this.db.query<{ id_estado_envio: number }>(
      `SELECT id_estado_envio FROM notifications.estado_envio WHERE codigo = $1`,
      [statusCode]
    );
    const idEstado = rows[0]?.id_estado_envio;
    if (!idEstado) return;

    // 2. Actualizar el estado de envío en la notificación del usuario
    await this.db.execute(
      `UPDATE notifications.user_notification 
       SET id_estado_envio = $1 
       WHERE notification_id = $2`,
      [idEstado, notificationId]
    );

    // 3. Registrar en el log histórico detallado de despachos externos
    await this.db.execute(
      `INSERT INTO notifications.user_notification_dispatch_log (
         notification_id, id_estado_envio, provider_response, error_message
       ) VALUES ($1, $2, $3, $4)`,
      [
        notificationId, 
        idEstado, 
        JSON.stringify(providerResponse ?? {}), 
        errorMessage ?? null
      ]
    );
  }

  // ── Adaptador privado: raw SQL row → NotificationModel ────────────────────
  private toModel(row: any): NotificationModel {
    return {
      notificationId: row.notification_id,
      userId: row.id_usuario,
      title: row.titulo,
      body: row.cuerpo,
      channel: row.canal,
      priority: row.prioridad,
      statusCode: row.estado_envio,
      entityType: row.entidad_tipo,
      entityId: row.entidad_id,
      metadata: row.metadata ?? {},
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
