import { Module } from '@nestjs/common';
import { NotificationPostgreSQLModule } from '../../modules/notifications/infrastructure/modules/postgresql/notification.postgresql.module';

@Module({
  imports: [NotificationPostgreSQLModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppNotificationsModulesUsingPostgreSQL {}
