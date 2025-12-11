export class GenericService<
  TModel,
  TDelegate extends {
    create: (args: any) => Promise<TModel>;
    findUnique: (args: any) => Promise<TModel | null>;
    findMany: (args?: any) => Promise<TModel[]>;
    update: (args: any) => Promise<TModel>;
    delete: (args: any) => Promise<TModel>;
  }
> {
  constructor(
    protected readonly model: TDelegate,
    protected readonly validate?: {
      create?: (data: any) => Promise<void> | void;
      update?: (data: any) => Promise<void> | void;
      delete?: (id: string) => Promise<void> | void;
    },
    protected readonly hooks?: {
      afterCreate?: (item: TModel) => Promise<void> | void;
      afterUpdate?: (item: TModel) => Promise<void> | void;
      afterDelete?: (item: TModel) => Promise<void> | void;
    }
  ) { }

  async create(data: any): Promise<TModel> {
    if (this.validate?.create) await this.validate.create(data);

    // Lấy tất cả field có dạng relation (nếu client muốn connect)
    const relations: Record<string, string | string[]> = {};

    // Ví dụ: nếu data.category_id, data.lessonIds, data.reviewIds
    for (const key of Object.keys(data)) {
      // Skip instructor_id because it is a scalar field in the courses model, not a relation
      if (key === 'instructor_id') continue;

      if (key.endsWith("_id")) {
        let relName = key.replace(/_id$/, "s"); // default: something_id -> somethings

        // Handle special cases for pluralization
        if (key === 'category_id') {
          relName = 'categories';
        }

        relations[relName] = data[key];
        delete data[key];
      }
      if (key.endsWith("_ids") && Array.isArray(data[key])) {
        const relName = key.replace(/_ids$/, "s"); // lesson_ids -> lessons
        relations[relName] = data[key];
        delete data[key];
      }
    }

    // Chuyển các relation thành connect
    for (const [rel, val] of Object.entries(relations)) {
      if (val) {
        data[rel] = {
          connect: Array.isArray(val)
            ? val.map((id) => ({ id }))
            : [{ id: val }],
        };
      }
    }

    const newItem = await this.model.create({ data });
    if (this.hooks?.afterCreate) await this.hooks.afterCreate(newItem);
    return newItem;
  }

  async findOne(id: string): Promise<TModel | null> {
    return this.model.findUnique({ where: { id } });
  }

  async update(id: string, data: any): Promise<TModel> {
    if (this.validate?.update) await this.validate.update(data);
    const updated = await this.model.update({ where: { id }, data });
    if (this.hooks?.afterUpdate) await this.hooks.afterUpdate(updated);
    return updated;
  }

  async delete(id: string): Promise<TModel> {
    if (this.validate?.delete) await this.validate.delete(id);
    const deleted = await this.model.delete({ where: { id } });
    if (this.hooks?.afterDelete) await this.hooks.afterDelete(deleted);
    return deleted;
  }

  async findAll(): Promise<TModel[]> {
    return this.model.findMany();
  }
}
