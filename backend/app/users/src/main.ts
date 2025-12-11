import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from "@nestjs/common";
import { UsersModule } from './user.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(UsersModule);
  app.use(cookieParser());
  app.enableCors({
  origin: ["http://localhost:4000" ,"http://localhost:3001","http://localhost:3002" , "http://localhost:3003","http://localhost:3004","http://localhost:3005"  ],
  credentials: true,
  });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'user_queue',
      queueOptions: { durable: false },
    },
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // loại bỏ field thừa
    forbidNonWhitelisted: true, // báo lỗi nếu có field không khai báo trong DTO
    transform: true, // tự động chuyển kiểu dữ liệu
  }));
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
