import { Inject, Injectable } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';
import { INotificationRepository } from '../../../domain/contracts/notification.interface.repository';
import { SendAcometidaNotificationDto } from '../../dto/request/send-notification.dto';

/**
 * BPMN Fase 2 — Solicitud enviada con documentos (DRAFT → DOCS_SUBMITTED).
 * Se dispara desde: connection-service.requests.submit_with_documents
 * Destinatario: el ANALISTA asignado por round-robin (cargo_id = 14).
 *
 * Canales: EMAIL (template HTML profesional) + IN_APP (alerta interna).
 *
 * SOLID:
 *  SRP — solo construye el payload de alerta al analista
 *  OCP — agregar campos al template no requiere cambiar este use case
 *  DIP — depende de abstracciones (INotificationRepository, SendNotificationUseCase)
 */
@Injectable()
export class NotifyDocsSubmittedUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,

    @Inject('INotificationRepository')
    private readonly repository: INotificationRepository,
  ) {}

  async execute(
    dto: SendAcometidaNotificationDto & {
      numDocumentos:   number;
      numeroSolicitud?: string;
      tipoAcometida?:  string;
      tipoPersona?:    string;
      direccion?:      string;
      claveCatastral?: string;
    },
  ): Promise<string> {
    const adminUrl       = process.env.ADMIN_URL ?? 'https://admin.epaa.gob.ec';
    const fechaSolicitud = new Date().toLocaleDateString('es-EC', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // Resolver el nombre del analista desde la BD (public.empleados)
    const nombreAnalista = await this.repository.findUserName(dto.userId) ?? 'Analista';

    return await this.sendNotificationUseCase.execute({
      userId:   dto.userId,
      title:    `📋 Nueva Solicitud Asignada — ${dto.numeroSolicitud ?? dto.solicitudId}`,
      body:
        `Se le ha asignado la solicitud ${dto.numeroSolicitud ?? dto.solicitudId} ` +
        `con ${dto.numDocumentos} documento(s) adjunto(s). Requiere revisión documental.`,
      channel:  'EMAIL,IN_APP',   // EMAIL con template HTML + alerta interna
      priority: 'HIGH',
      entityType: 'acometidas.solicitud',
      entityId:   dto.solicitudId as unknown as any,
      metadata: {
        // ─ Template config ─
        templateId:   'nueva-solicitud-analista',
        templateVars: {
          nombreAnalista,
          numeroSolicitud: dto.numeroSolicitud ?? dto.solicitudId,
          tipoAcometida:   dto.tipoAcometida   ?? 'Nueva Acometida de Agua Potable',
          tipoPersona:     dto.tipoPersona     ?? 'No especificado',
          direccion:       dto.direccion       ?? 'No especificada',
          claveCatastral:  dto.claveCatastral  ?? 'No disponible',
          numDocumentos:   dto.numDocumentos,
          fechaSolicitud,
          urlRevision: `${adminUrl}/acometidas/solicitudes/${dto.solicitudId}`,
          urlPanel:    `${adminUrl}/acometidas/solicitudes`,
        },
        // ─ Audit meta ─
        solicitudId:  dto.solicitudId,
        modulo:       'ACOMETIDAS',
        fase:         'DOCS_SUBMITTED',
        accion:       'NUEVA_SOLICITUD_ASIGNADA',
        numDocumentos: dto.numDocumentos,
      },
    });
  }
}
