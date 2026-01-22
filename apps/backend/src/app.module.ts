import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { CaseModule } from './modules/case/case.module';
import { SessionModule } from './modules/session/session.module';
import { ChatModule } from './modules/chat/chat.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ServicesModule,
    AuthModule,
    CompanyModule,
    CaseModule,
    SessionModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
