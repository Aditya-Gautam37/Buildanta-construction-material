import { Module } from '@nestjs/common';
import { FulfilmentOperationsController } from './fulfilment-operations.controller';
import { FulfilmentOperationsService } from './fulfilment-operations.service';

@Module({ controllers: [FulfilmentOperationsController], providers: [FulfilmentOperationsService] })
export class FulfilmentOperationsModule {}
