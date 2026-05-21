import { Inject, Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/contracts/notification.interface.repository';
import { NotificationMapper, NotificationResponse } from '../dto/response/notification.response';

/** SRP: Lista completa de notificaciones (leídas + no leídas) con paginación */
@Injectable()
export class GetAllNotificationsUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,
  ) {}

  async execute(userId: string, limit = 30, offset = 0): Promise<NotificationResponse[]> {
    const models = await this.repository.findAllByUserId(userId, limit, offset);
    return NotificationMapper.toResponseList(models);
  }
}
