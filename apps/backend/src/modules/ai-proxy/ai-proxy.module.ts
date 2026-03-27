import { Module } from '@nestjs/common';
import { AiProxyController } from './ai-proxy.controller';
import { AiProxyService } from './ai-proxy.service';
import { AiApiClient } from './ai-api.client';
import { TenantResolverService } from './tenant-resolver.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AiProxyController],
  providers: [AiApiClient, TenantResolverService, AiProxyService],
  exports: [AiApiClient, TenantResolverService, AiProxyService],
})
export class AiProxyModule {}
