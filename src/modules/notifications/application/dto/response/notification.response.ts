import { NotificationModel } from '../../../domain/schemas/models/NotificationModel';

export interface NotificationResponse {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  channel: string;
  priority: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface UnreadCountResponse {
  userId: string;
  unreadCount: number;
}

export class NotificationMapper {
  static toResponse(model: NotificationModel): NotificationResponse {
    return {
      notificationId: model.notificationId,
      userId: model.userId,
      title: model.title,
      body: model.body,
      channel: model.channel,
      priority: model.priority,
      entityType: model.entityType,
      entityId: model.entityId,
      isRead: model.isRead,
      readAt: model.readAt,
      createdAt: model.createdAt,
    };
  }

  static toResponseList(models: NotificationModel[]): NotificationResponse[] {
    return models.map((m) => NotificationMapper.toResponse(m));
  }
}
