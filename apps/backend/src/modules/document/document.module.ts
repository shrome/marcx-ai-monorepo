import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { AuthModule } from '../auth/auth.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [
    AuthModule,
    ActivityLogModule,
    ServicesModule,
    MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } }), // 50 MB
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
