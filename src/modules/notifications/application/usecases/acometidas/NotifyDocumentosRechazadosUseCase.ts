import { Injectable } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';
import { SendAcometidaNotificationDto } from '../../dto/request/send-notification.dto';

/**
 * BPMN Punto 1 — Notificación de documentos rechazados.
 * Se dispara desde: document-validation.validate_documents (cuando resultado = DOCS_REJECTED).
 * Destinatario: el CLIENTE que presentó la solicitud.
 * 
 * Enfoque SOLID:
 *  - Delega en SendNotificationUseCase para aprovechar despacho físico por EMAIL
 *    y WebSockets unificados con registro automático de logs.
 */
@Injectable()
export class NotifyDocumentosRechazadosUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(dto: SendAcometidaNotificationDto & { motivo: string }): Promise<string> {
    return await this.sendNotificationUseCase.execute({
      userId: dto.userId,
      title: '📄 Documentos No Válidos — Acometida',
      body: `Sus documentos para la solicitud de nueva acometida han sido revisados y presentan observaciones: "${dto.motivo}". ` +
        `Por favor, ingrese al sistema para corregir y volver a cargar la documentación.`,
      channel: 'EMAIL,WHATSAPP,IN_APP', // Despacho multicanal simultáneo al cliente
      priority: 'HIGH',
      entityType: 'acometidas.solicitud',
      entityId: dto.solicitudId as unknown as any,
      metadata: {
        solicitudId: dto.solicitudId,
        modulo: 'ACOMETIDAS',
        fase: 'VALIDACION_DOCUMENTAL',
        accion: 'DOCS_REJECTED',
        motivo: dto.motivo,
        ...dto.metadata,
      },
    });
  }
}
