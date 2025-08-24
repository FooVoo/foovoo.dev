import { Module } from '@nestjs/common';
import { P2pController } from './p2p.controller';
import { P2pService } from './p2p.service';
import { P2pGateway } from './p2p.gateway';
import { P2pServerAdapter } from './p2p-server.adapter';

@Module({
  imports: [],
  controllers: [P2pController],
  providers: [P2pService, P2pGateway, P2pServerAdapter],
  exports: [P2pService],
})
export class P2pSignalingModule {}
