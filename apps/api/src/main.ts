import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  // Explicitly listen on 0.0.0.0 so devices on the local garage Wi-Fi/LAN can connect
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`🚀 GarageClock Application is live and listening on port 3000 across local network!`);
}
bootstrap();
