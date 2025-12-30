import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Optional: Listen on a port if you want health checks, etc.
    await app.listen(3000);
}
bootstrap();
