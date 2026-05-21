import { NotificationChannel, NotificationPriority } from '../../../domain/schemas/models/NotificationModel';

/** DTO para enviar una notificación (entrada genérica) */
export interface SendNotificationDto {
  userId: string;
  title: string;
  body: string;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

/** DTO especializado para notificaciones del proceso de acometidas */
export interface SendAcometidaNotificationDto {
  userId: string;          // UUID del cliente o analista a notificar
  solicitudId: string;     // UUID de la solicitud (entidad de contexto)
  metadata?: Record<string, any>;
}
