import { Injectable } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';
import { SendAcometidaNotificationDto } from '../../dto/request/send-notification.dto';

@Injectable()
export class NotifyOtInstalacionEmitidaUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(
    dto: SendAcometidaNotificationDto & { codigoOT: string },
  ): Promise<string> {
    return await this.sendNotificationUseCase.execute({
      userId: dto.userId,
      title: 'OT de Instalacion Emitida',
      body:
        `Se emitio la orden de trabajo ${dto.codigoOT} para la solicitud ${dto.solicitudId}. ` +
        'Revise su bandeja para proceder con la ejecucion en campo.',
      channel: 'IN_APP',
      priority: 'HIGH',
      entityType: 'acometidas.solicitud',
      entityId: dto.solicitudId as unknown as string,
      metadata: {
        solicitudId: dto.solicitudId,
        codigoOT: dto.codigoOT,
        modulo: 'ACOMETIDAS',
        fase: 'OT_INSTALACION_EMITIDA',
        accion: 'OT_EMITIDA',
        ...dto.metadata,
      },
    });
  }
}
