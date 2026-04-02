import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [ServicesModule],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
