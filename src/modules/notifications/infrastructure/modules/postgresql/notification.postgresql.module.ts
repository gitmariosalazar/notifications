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

// Proveedores Físicos y Estrategias de Despacho (Strategy Pattern)
import { EmailSenderProvider } from '../../services/email/email-sender.provider';
import { EmailChannelSender } from '../../services/channels/email-channel.sender';
import { SmsChannelSender } from '../../services/channels/sms-channel.sender';
import { PushChannelSender } from '../../services/channels/push-channel.sender';

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
    // Proveedores Multicanal
    EmailSenderProvider,

    // Estrategias de canales registradas bajo el mismo Token (Multi-providers)
    {
      provide: 'INotificationChannelSender',
      useClass: EmailChannelSender,
    },
    {
      provide: 'INotificationChannelSender',
      useClass: SmsChannelSender,
    },
    {
      provide: 'INotificationChannelSender',
      useClass: PushChannelSender,
    },
  ],
  exports: [],
})
export class NotificationPostgreSQLModule {}
