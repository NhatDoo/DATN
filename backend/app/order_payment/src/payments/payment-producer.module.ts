import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentProducerService } from './payments-producer.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ENROLLMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'enrollment_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  providers: [PaymentProducerService , PrismaService],
  exports: [PaymentProducerService],
})
export class PaymentProducerModule {}
