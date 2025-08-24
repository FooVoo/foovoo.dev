import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { P2pSignalingModule } from './p2p-signaling/p2p-signaling.module';

@Module({
  imports: [P2pSignalingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
