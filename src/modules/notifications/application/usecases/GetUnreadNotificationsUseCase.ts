import { Inject, Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/contracts/notification.interface.repository';
import { NotificationMapper, NotificationResponse } from '../dto/response/notification.response';

/**
 * SRP: Obtiene las notificaciones no leídas de un usuario.
 * Alimenta el ícono de campanita en el frontend.
 */
@Injectable()
export class GetUnreadNotificationsUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,
  ) {}

  async execute(userId: string, limit = 20, offset = 0): Promise<NotificationResponse[]> {
    const models = await this.repository.findUnreadByUserId(userId, limit, offset);
    return NotificationMapper.toResponseList(models);
  }
}
