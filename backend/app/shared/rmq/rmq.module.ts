import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RmqService } from './rmq.service';

@Module({
  providers: [RmqService],
  exports: [RmqService],
})
export class RmqModule {
  static register({ name, queue, queueOptions }): DynamicModule {
    return {
      module: RmqModule,
      imports: [
        ClientsModule.register([
          {
            name,
            transport: Transport.RMQ,
            options: {
              urls: ['amqp://localhost:5672'],
              queue,
              queueOptions,
            },
          },
        ]),
      ],
      providers: [RmqService],
      exports: [ClientsModule, RmqService],
    };
  }
}
