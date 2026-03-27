import { Module } from '@nestjs/common';
import { CompanyMemberController } from './company-member.controller';
import { CompanyMemberService } from './company-member.service';
import { AuthModule } from '../auth/auth.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [AuthModule, ActivityLogModule],
  controllers: [CompanyMemberController],
  providers: [CompanyMemberService],
  exports: [CompanyMemberService],
})
export class CompanyMemberModule {}
