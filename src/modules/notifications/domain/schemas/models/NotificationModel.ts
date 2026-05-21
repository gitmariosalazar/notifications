/**
 * NotificationModel — Entidad de dominio pura.
 * Sin dependencias de infraestructura (ORM, BD, Kafka).
 */
export interface NotificationModel {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, any>;
  statusCode: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
