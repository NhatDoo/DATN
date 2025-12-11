import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { CategoriesService} from './catergrories.service';
import { GenericController } from '@shared/core/generic.controller';
import { categories} from '.prisma/course-client';

@Controller('categories')
export class CategorieController extends GenericController<categories, CategoriesService> {
  constructor(protected readonly service: CategoriesService) {
    super(service); 
  }
}