import { Inject, Injectable, Logger } from '@nestjs/common';
import { SendNotificationUseCase } from '../SendNotificationUseCase';

/**
 * NotifyVerificationCodeUseCase
 *
 * Envía el código de verificación de registro al correo del nuevo usuario.
 * Utiliza el template HTML `verification-code.html`.
 *
 * Se dispara desde: MS-Authentication → cuando se crea un nuevo usuario
 * Destinatario: el propio usuario recién registrado
 *
 * SOLID:
 *  SRP  — solo construye el payload del email de verificación
 *  OCP  — cambiar el template no requiere tocar este use case
 *  DIP  — delega en SendNotificationUseCase (abstracción)
 */
@Injectable()
export class NotifyVerificationCodeUseCase {
  private readonly logger = new Logger(NotifyVerificationCodeUseCase.name);

  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  async execute(dto: {
    userId:             string;
    nombre:             string;
    email:              string;
    codigo:             string;
    expiracionMinutos?: number;
  }): Promise<string> {
    const expiracionMinutos = dto.expiracionMinutos ?? 10;

    this.logger.log(
      `[VERIFICATION CODE] Enviando código a usuario ${dto.userId} — email: ${dto.email}`,
    );

    return this.sendNotificationUseCase.execute({
      userId:   dto.userId,
      title:    '🔐 Tu código de verificación — EPAA',
      body:     `Tu código de verificación es: ${dto.codigo}. Expira en ${expiracionMinutos} minutos.`,
      channel:  'EMAIL,IN_APP',
      priority: 'HIGH',
      entityType: 'auth.verification',
      entityId:   dto.userId as any,
      metadata: {
        // ─ Template config ─
        templateId: 'verification-code',
        templateVars: {
          nombre:             dto.nombre,
          codigo:             dto.codigo,
          expiracionMinutos,
          portalUrl:          process.env.PORTAL_URL ?? 'https://portal.epaa.gob.ec',
        },
        // ─ Audit meta ─
        modulo: 'AUTHENTICATION',
        accion: 'VERIFICATION_CODE',
        email:  dto.email,
      },
    });
  }
}
