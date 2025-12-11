// src/core/generic.controller.ts
import { Get, Post, Put, Delete, Param, Body } from '@nestjs/common';

export class GenericController<TModel, TService> {
  constructor(protected readonly service: any) {}

  @Post()
  create(@Body() data: any): Promise<TModel> {
    return this.service.create(data);
  }

  @Get()
  findAll(): Promise<TModel[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<TModel> {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any): Promise<TModel> {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<TModel> {
    return this.service.delete(id);
  }
}
