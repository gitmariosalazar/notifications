import { Inject, Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/contracts/notification.interface.repository';

/** SRP: Cuenta notificaciones no leídas — alimenta el badge del frontend */
@Injectable()
export class GetUnreadCountUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,
  ) {}

  async execute(userId: string): Promise<{ userId: string; unreadCount: number }> {
    const count = await this.repository.countUnread(userId);
    return { userId, unreadCount: count };
  }
}
