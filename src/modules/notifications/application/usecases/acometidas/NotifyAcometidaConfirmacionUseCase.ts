import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';

/**
 * NotifyAcometidaConfirmacionUseCase
 *
 * Envía la confirmación de recepción de una solicitud de nueva acometida
 * al correo del cliente, usando el template HTML profesional.
 *
 * Se dispara desde: MS-Connection (connection-service) → cuando la solicitud
 * cambia a estado DOCS_SUBMITTED o SUBMITTED.
 *
 * SOLID:
 *  SRP  — solo construye el payload de confirmación de acometida
 *  OCP  — agregar nuevos campos al template no requiere cambiar este use case
 *  DIP  — delega enteramente en SendNotificationUseCase
 */
@Injectable()
export class NotifyAcometidaConfirmacionUseCase {
  private readonly logger = new Logger(NotifyAcometidaConfirmacionUseCase.name);

  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(dto: {
    userId:           string;
    solicitudId:      string;
    nombre:           string;
    numeroSolicitud:  string;
    tipoAcometida?:   string;
    tipoPersona?:     string;
    direccion?:       string;
    claveCatastral?:  string;
    numDocumentos?:   number;
  }): Promise<string> {
    const portalUrl   = process.env.PORTAL_URL ?? 'https://portal.epaa.gob.ec';
    const fechaSolicitud = new Date().toLocaleDateString('es-EC', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    this.logger.log(
      `[ACOMETIDA CONFIRM] Enviando confirmación al usuario ${dto.userId} — solicitud #${dto.numeroSolicitud}`,
    );

    return this.sendNotificationUseCase.execute({
      userId:   dto.userId,
      title:    `✅ Solicitud #${dto.numeroSolicitud} recibida — EPAA`,
      body:
        `Tu solicitud de nueva acometida N° ${dto.numeroSolicitud} fue registrada correctamente. ` +
        `Un analista EPAA la revisará en los próximos días hábiles.`,
      channel:  'EMAIL,IN_APP',
      priority: 'NORMAL',
      entityType: 'acometidas.solicitud',
      entityId:   dto.solicitudId as any,
      metadata: {
        // ─ Template config ─
        templateId: 'solicitud-acometida-confirmacion',
        templateVars: {
          nombre:          dto.nombre,
          numeroSolicitud: dto.numeroSolicitud,
          tipoAcometida:   dto.tipoAcometida   ?? 'Nueva Acometida de Agua Potable',
          tipoPersona:     dto.tipoPersona     ?? 'No especificado',
          direccion:       dto.direccion       ?? 'No especificada',
          claveCatastral:  dto.claveCatastral  ?? 'No disponible',
          numDocumentos:   dto.numDocumentos   ?? 0,
          fechaSolicitud,
          portalUrl,
          urlSeguimiento:  `${portalUrl}/requests/nueva_acometida/tracking`,
        },
        // ─ Audit meta ─
        solicitudId:  dto.solicitudId,
        modulo:       'ACOMETIDAS',
        fase:         'CONFIRMACION_RECEPCION',
        accion:       'SOLICITUD_ENVIADA',
      },
    });
  }
}
