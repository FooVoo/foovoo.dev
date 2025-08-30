import { NestFactory } from '@nestjs/core';
import { P2pSignalingModule } from './p2p-signaling.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(P2pSignalingModule);
}
bootstrap();
