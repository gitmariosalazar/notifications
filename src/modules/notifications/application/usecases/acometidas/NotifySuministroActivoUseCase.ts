import { Injectable } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';
import { SendAcometidaNotificationDto } from '../../dto/request/send-notification.dto';

/**
 * BPMN Punto 3 — Notificación de suministro activo (estado final).
 * Se dispara desde: cadastral.register_and_activate.
 * Destinatario: el CLIENTE — cierra el proceso BPMN desde su perspectiva.
 * 
 * Enfoque SOLID:
 *  - Delega en SendNotificationUseCase para aprovechar despacho físico por EMAIL
 *    y WebSockets unificados con registro automático de logs.
 */
@Injectable()
export class NotifySuministroActivoUseCase {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(
    dto: SendAcometidaNotificationDto & { numeroCuenta: string; numeroMedidor: string },
  ): Promise<string> {
    return await this.sendNotificationUseCase.execute({
      userId: dto.userId,
      title: '✅ ¡Suministro de Agua Activado!',
      body: `Su nueva acometida ha sido instalada y activada exitosamente. ` +
        `Número de cuenta: ${dto.numeroCuenta} — Número de medidor: ${dto.numeroMedidor}. Bienvenido a los servicios de EPAA-AA.`,
      channel: 'EMAIL', // Correo electrónico oficial del cliente
      priority: 'URGENT',
      entityType: 'acometidas.solicitud',
      entityId: dto.solicitudId as unknown as any,
      metadata: {
        solicitudId: dto.solicitudId,
        numeroCuenta: dto.numeroCuenta,
        numeroMedidor: dto.numeroMedidor,
        modulo: 'ACOMETIDAS',
        fase: 'REGISTRO_CATASTRAL',
        accion: 'SUMINISTRO_ACTIVO',
        ...dto.metadata,
      },
    });
  }
}
