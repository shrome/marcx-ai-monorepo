import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { CaseModule } from './modules/case/case.module';
import { SessionModule } from './modules/session/session.module';
import { ChatModule } from './modules/chat/chat.module';
import { UserModule } from './modules/user/user.module';
import { ServicesModule } from './services/services.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { BillingModule } from './modules/billing/billing.module';
import { CompanyMemberModule } from './modules/company-member/company-member.module';
import { DocumentModule } from './modules/document/document.module';
import { AiProxyModule } from './modules/ai-proxy/ai-proxy.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { LedgerModule } from './modules/ledger/ledger.module';

@Module({
  imports: [
    ServicesModule,
    AuthModule,
    UserModule,
    CompanyModule,
    CaseModule,
    SessionModule,
    ChatModule,
    ActivityLogModule,
    BillingModule,
    CompanyMemberModule,
    DocumentModule,
    AiProxyModule,
    InvitationModule,
    LedgerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


