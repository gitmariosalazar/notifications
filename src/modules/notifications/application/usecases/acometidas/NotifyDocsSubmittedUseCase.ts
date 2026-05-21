import { Inject, Injectable } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';
import { SendAcometidaNotificationDto } from '../../dto/request/send-notification.dto';

/**
 * BPMN Fase 2 — Solicitud enviada con documentos (DRAFT → DOCS_SUBMITTED).
 * Se dispara desde: connection-service.requests.submit_with_documents
 * Destinatario: el ANALISTA asignado (o rol analista en general).
 * 
 * Enfoque SOLID:
 *  - Reutilización limpia: Delega en SendNotificationUseCase para aprovechar
 *    toda la lógica centralizada de despacho multicanal (EMAIL, WebSockets, etc.)
 *    y persistencia en un solo punto, evitando duplicidad de código.
 */
@Injectable()
export class NotifyDocsSubmittedUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(
    dto: SendAcometidaNotificationDto & { numDocumentos: number },
  ): Promise<string> {
    return await this.sendNotificationUseCase.execute({
      userId: dto.userId,
      title: '📋 Nueva Solicitud de Acometida — Documentos Recibidos',
      body: `Se ha recibido una nueva solicitud de acometida con ${dto.numDocumentos} documento(s) adjunto(s). ` +
        `La solicitud está lista para revisión documental.`,
      channel: 'EMAIL', // Despacho físico por correo electrónico
      priority: 'HIGH',
      entityType: 'acometidas.solicitud',
      entityId: dto.solicitudId as unknown as any,
      metadata: {
        solicitudId: dto.solicitudId,
        modulo: 'ACOMETIDAS',
        fase: 'DOCS_SUBMITTED',
        accion: 'NUEVA_SOLICITUD',
        numDocumentos: dto.numDocumentos,
        ...dto.metadata,
      },
    });
  }
}
