import { Injectable } from '@nestjs/common';
import { RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService {
  // 🧩 Trả về option cho từng microservice
  getOptions(queue: string, noAck = false): RmqOptions {
    return {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'], // địa chỉ RabbitMQ
        queue,
        queueOptions: {
          durable: true,
        },
        noAck,
      },
    };
  }
}
