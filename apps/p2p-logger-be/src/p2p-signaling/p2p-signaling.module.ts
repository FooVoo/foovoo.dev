import { Module } from '@nestjs/common';
import { P2pController } from './p2p.controller';
import { P2pService } from './p2p.service';
import { P2pGateway } from './p2p.gateway';

@Module({
  imports: [],
  controllers: [P2pController],
  providers: [P2pService, P2pGateway],
  exports: [P2pService],
})
export class P2pSignalingModule {}
