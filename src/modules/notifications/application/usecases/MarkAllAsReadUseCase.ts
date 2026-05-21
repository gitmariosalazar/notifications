import { Inject, Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/contracts/notification.interface.repository';

/** SRP: Marca TODAS las notificaciones de un usuario como leídas */
@Injectable()
export class MarkAllAsReadUseCase {
  constructor(
    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,
  ) {}

  async execute(userId: string): Promise<{ updatedCount: number }> {
    const count = await this.repository.markAllAsRead(userId);
    return { updatedCount: count };
  }
}
