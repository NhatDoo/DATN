import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { BigIntInterceptor } from '@shared/interceptor/bigint.interceptor';
import cookieParser from 'cookie-parser';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:4000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'], // thay bằng URL RabbitMQ của bạn
        queue: 'enrollment_queue',
        queueOptions: {
          durable: false,
        },
      },
    },
  );
  await app.startAllMicroservices();
  app.useGlobalInterceptors(new BigIntInterceptor());
  await app.listen(process.env.PORT ?? 3003);
}
bootstrap();
