import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntInterceptor } from '@shared/interceptor/bigint.interceptor';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { RmqService } from '@shared/rmq/rmq.service';
import { Transport } from '@nestjs/microservices';
import fastifyCookie from '@fastify/cookie';
import cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.register(fastifyCookie);

  app.enableCors({
    origin: 'http://localhost:4000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalInterceptors(new BigIntInterceptor());

  // ✅ Kích hoạt microservice để lắng nghe sự kiện từ RabbitMQ
  // const rmqService = app.get(RmqService);
  app.connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'course_queue', 
        queueOptions: { durable: true },
      },
    });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3001);

}
bootstrap();
