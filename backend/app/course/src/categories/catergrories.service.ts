import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma , categories} from '.prisma/course-client'; // Import Prisma namespace
import { GenericService } from '@shared/core/generic.service';
import { generateUniqueSlug } from '@shared/ultis/slug.ultis';

@Injectable()
export class CategoriesService extends GenericService<categories, Prisma.categoriesDelegate> {
  constructor(private prisma: PrismaService) {
     super(prisma.categories, {
        create: async (data) => {
                if (data.title) {
                  data.slug = await generateUniqueSlug(prisma.courses, data);
                }
              },
        }); 
  }
}