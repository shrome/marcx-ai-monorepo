import { Module, Global } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [FileStorageService, EmailService],
  exports: [FileStorageService, EmailService],
})
export class ServicesModule {}
