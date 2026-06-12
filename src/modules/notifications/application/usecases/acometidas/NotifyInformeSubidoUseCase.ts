import { Injectable } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';
import { SendAcometidaNotificationDto } from '../../dto/request/send-notification.dto';

@Injectable()
export class NotifyInformeSubidoUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(dto: SendAcometidaNotificationDto): Promise<string> {
    return await this.sendNotificationUseCase.execute({
      userId: dto.userId,
      title: 'Informe Tecnico Pendiente de Revision',
      body:
        `Se ha cargado un informe tecnico para la solicitud ${dto.solicitudId}. ` +
        'Revise y apruebe/rechace el informe para continuar el flujo.',
      channel: 'IN_APP',
      priority: 'HIGH',
      entityType: 'acometidas.solicitud',
      entityId: dto.solicitudId as unknown as string,
      metadata: {
        solicitudId: dto.solicitudId,
        modulo: 'ACOMETIDAS',
        fase: 'INFORME_EN_REVISION',
        accion: 'INFORME_SUBIDO',
        ...dto.metadata,
      },
    });
  }
}
