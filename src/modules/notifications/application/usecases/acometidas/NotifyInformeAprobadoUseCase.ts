import { Injectable } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';
import { SendAcometidaNotificationDto } from '../../dto/request/send-notification.dto';

@Injectable()
export class NotifyInformeAprobadoUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(dto: SendAcometidaNotificationDto): Promise<string> {
    return await this.sendNotificationUseCase.execute({
      userId: dto.userId,
      title: 'Informe Tecnico Aprobado',
      body:
        `Su informe tecnico para la solicitud ${dto.solicitudId} ha sido aprobado. ` +
        'El proceso continuara a la siguiente fase administrativa.',
      channel: 'EMAIL,WHATSAPP,IN_APP',
      priority: 'HIGH',
      entityType: 'acometidas.solicitud',
      entityId: dto.solicitudId as unknown as string,
      metadata: {
        solicitudId: dto.solicitudId,
        modulo: 'ACOMETIDAS',
        fase: 'INFORME_APROBADO',
        accion: 'INFORME_APROBADO',
        ...dto.metadata,
      },
    });
  }
}
