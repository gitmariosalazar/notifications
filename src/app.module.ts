import { Module } from '@nestjs/common';
import { AppController } from './app/controller/app.controller';
import { AppService } from './app/service/app.service';
import { HomeModule } from './app/module/home.module';
import { DatabasePersistenceModule } from './shared/connections/database/database-persistence.module';
import { environments } from './settings/environments/environments';
import { AppNotificationsModulesUsingMySQL } from './factory/mysql/modules-using-mysql.module';
import { AppNotificationsModulesUsingPostgreSQL } from './factory/postgresql/modules-using-postgresql.module';

const notificationsModules =
  environments.DATABASE_TYPE === 'mysql'
    ? AppNotificationsModulesUsingMySQL
    : AppNotificationsModulesUsingPostgreSQL;

@Module({
  imports: [HomeModule, notificationsModules, DatabasePersistenceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
