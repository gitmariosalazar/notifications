import { Injectable } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';
import { SendAcometidaNotificationDto } from '../../dto/request/send-notification.dto';

@Injectable()
export class NotifyInspeccionAsignadaUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(
    dto: SendAcometidaNotificationDto & { direccion: string },
  ): Promise<string> {
    return await this.sendNotificationUseCase.execute({
      userId: dto.userId,
      title: 'Inspeccion Tecnica Asignada',
      body:
        `Se le ha asignado una inspeccion tecnica para la solicitud ${dto.solicitudId}. ` +
        `Direccion: ${dto.direccion}.`,
      channel: 'IN_APP',
      priority: 'HIGH',
      entityType: 'acometidas.solicitud',
      entityId: dto.solicitudId as unknown as string,
      metadata: {
        solicitudId: dto.solicitudId,
        direccion: dto.direccion,
        modulo: 'ACOMETIDAS',
        fase: 'ORDEN_INSPECCION_EMITIDA',
        accion: 'INSPECCION_ASIGNADA',
        ...dto.metadata,
      },
    });
  }
}
