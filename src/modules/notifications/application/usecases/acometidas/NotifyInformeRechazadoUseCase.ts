import { Injectable } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';
import { SendAcometidaNotificationDto } from '../../dto/request/send-notification.dto';

/**
 * BPMN Punto 2 — Notificación de informe técnico rechazado.
 * Se dispara desde: inspection-report.approve (cuando approved = false).
 * Destinatario: el CLIENTE dueño de la solicitud.
 * 
 * Enfoque SOLID:
 *  - Delega en SendNotificationUseCase para aprovechar despacho físico por EMAIL
 *    y WebSockets unificados con registro automático de logs.
 */
@Injectable()
export class NotifyInformeRechazadoUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(dto: SendAcometidaNotificationDto & { motivoRechazo: string }): Promise<string> {
    return await this.sendNotificationUseCase.execute({
      userId: dto.userId,
      title: '🔧 Inspección Técnica — Resultado Desfavorable',
      body: `Lamentamos informarle que la inspección técnica de su solicitud de nueva acometida no ha sido aprobada. ` +
        `Motivo: "${dto.motivoRechazo}". Puede comunicarse con nuestras oficinas para más información.`,
      channel: 'EMAIL,WHATSAPP,IN_APP', // Despacho multicanal simultáneo
      priority: 'HIGH',
      entityType: 'acometidas.solicitud',
      entityId: dto.solicitudId as unknown as any,
      metadata: {
        solicitudId: dto.solicitudId,
        modulo: 'ACOMETIDAS',
        fase: 'INSPECCION_TECNICA',
        accion: 'RECHAZADA_TECNICA',
        motivoRechazo: dto.motivoRechazo,
        ...dto.metadata,
      },
    });
  }
}
