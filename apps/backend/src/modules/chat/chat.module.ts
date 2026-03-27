import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AuthModule } from '../auth/auth.module';
import { AiProxyModule } from '../ai-proxy/ai-proxy.module';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [AuthModule, AiProxyModule, ServicesModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

