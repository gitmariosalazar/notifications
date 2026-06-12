import { Module } from '@nestjs/common';
import { NotificationController } from '../../controllers/notification.controller';
import { NotificationPostgreSQLPersistence } from '../../repositories/postgresql/notification.postgresql.persistence';
import { DatabasePersistenceModule } from '../../../../../shared/connections/database/database-persistence.module';
// Use Cases — Genéricos
import { SendNotificationUseCase } from '../../../application/usecases/SendNotificationUseCase';
import { GetUnreadNotificationsUseCase } from '../../../application/usecases/GetUnreadNotificationsUseCase';
import { GetAllNotificationsUseCase } from '../../../application/usecases/GetAllNotificationsUseCase';
import { MarkAsReadUseCase } from '../../../application/usecases/MarkAsReadUseCase';
import { MarkAllAsReadUseCase } from '../../../application/usecases/MarkAllAsReadUseCase';
import { GetUnreadCountUseCase } from '../../../application/usecases/GetUnreadCountUseCase';
// Use Cases — Especializados Acometidas (BPMN)
import { NotifyDocumentosRechazadosUseCase } from '../../../application/usecases/acometidas/NotifyDocumentosRechazadosUseCase';
import { NotifyInformeRechazadoUseCase } from '../../../application/usecases/acometidas/NotifyInformeRechazadoUseCase';
import { NotifySuministroActivoUseCase } from '../../../application/usecases/acometidas/NotifySuministroActivoUseCase';
import { NotifyDocsSubmittedUseCase } from '../../../application/usecases/acometidas/NotifyDocsSubmittedUseCase';
import { NotifyInspeccionAsignadaUseCase } from '../../../application/usecases/acometidas/NotifyInspeccionAsignadaUseCase';
import { NotifyOtInstalacionEmitidaUseCase } from '../../../application/usecases/acometidas/NotifyOtInstalacionEmitidaUseCase';
import { NotifyInformeSubidoUseCase } from '../../../application/usecases/acometidas/NotifyInformeSubidoUseCase';
import { NotifyInformeAprobadoUseCase } from '../../../application/usecases/acometidas/NotifyInformeAprobadoUseCase';

// Proveedores Físicos y Estrategias de Despacho (Strategy Pattern)
import { EmailSenderProvider } from '../../services/email/email-sender.provider';
import { EmailChannelSender } from '../../services/channels/email-channel.sender';
import { SmsChannelSender } from '../../services/channels/sms-channel.sender';
import { PushChannelSender } from '../../services/channels/push-channel.sender';
import { WhatsappChannelSender } from '../../services/channels/whatsapp-channel.sender';
// Template engine
import { HtmlTemplateService } from '../../services/template/html-template.service';
// Use Cases — Auth
import { NotifyVerificationCodeUseCase } from '../../../application/usecases/auth/NotifyVerificationCodeUseCase';
// Use Cases — Acometidas (confirmación)
import { NotifyAcometidaConfirmacionUseCase } from '../../../application/usecases/acometidas/NotifyAcometidaConfirmacionUseCase';

@Module({
  imports: [DatabasePersistenceModule],
  controllers: [NotificationController],
  providers: [
    // Inversión de dependencias: la aplicación depende de la abstracción
    {
      provide: 'INotificationRepository',
      useClass: NotificationPostgreSQLPersistence,
    },
    // Use Cases genéricos
    SendNotificationUseCase,
    GetUnreadNotificationsUseCase,
    GetAllNotificationsUseCase,
    MarkAsReadUseCase,
    MarkAllAsReadUseCase,
    GetUnreadCountUseCase,
    // Use Cases BPMN — Acometidas
    NotifyDocumentosRechazadosUseCase,
    NotifyInformeRechazadoUseCase,
    NotifySuministroActivoUseCase,
    NotifyDocsSubmittedUseCase,
    NotifyInspeccionAsignadaUseCase,
    NotifyOtInstalacionEmitidaUseCase,
    NotifyInformeSubidoUseCase,
    NotifyInformeAprobadoUseCase,
    NotifyAcometidaConfirmacionUseCase,
    // Use Cases — Auth
    NotifyVerificationCodeUseCase,
    // Template engine (DIP: callers inject ITemplateService, not the concrete class)
    HtmlTemplateService,
    {
      provide: 'ITemplateService',
      useClass: HtmlTemplateService,
    },
    // Proveedores Multicanal
    EmailSenderProvider,

    // Registrar clases concretas para inyección
    EmailChannelSender,
    SmsChannelSender,
    PushChannelSender,
    WhatsappChannelSender,

    // Proveedor Factory que junta todas las estrategias en un arreglo (Evita sobreescritura de NestJS)
    {
      provide: 'INotificationChannelSender',
      useFactory: (
        email: EmailChannelSender,
        sms: SmsChannelSender,
        push: PushChannelSender,
        whatsapp: WhatsappChannelSender,
      ) => [email, sms, push, whatsapp],
      inject: [
        EmailChannelSender,
        SmsChannelSender,
        PushChannelSender,
        WhatsappChannelSender,
      ],
    },
  ],
  exports: [],
})
export class NotificationPostgreSQLModule {}
