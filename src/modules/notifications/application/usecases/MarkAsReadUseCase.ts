import { Inject, Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/contracts/notification.interface.repository';

/** SRP: Marca una notificación específica como leída */
@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,
  ) {}

  async execute(notificationId: string, userId: string): Promise<{ success: boolean }> {
    const result = await this.repository.markAsRead(notificationId, userId);
    return { success: result };
  }
}
