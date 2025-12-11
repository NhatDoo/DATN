export interface Course {
  id: string;
  title: string;
  price_bigint: number;
  category_id: string;
  instructor_id: string;
}

export class CourseAPI {
  private baseUrl = 'http://localhost:3001/course';

  async getAll(): Promise<Course[]> {
    const res = await fetch(this.baseUrl);
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
  }

  async getById(id: string): Promise<Course> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch course');
    return res.json();
  }

  async create(course: Omit<Course, 'id'>): Promise<Course> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    if (!res.ok) throw new Error('Failed to create course');
    return res.json();
  }

  async update(id: string, course: Partial<Course>): Promise<Course> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    if (!res.ok) throw new Error('Failed to update course');
    return res.json();
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete course');
  }
}

// export instance để dùng ngay
export const courseAPI = new CourseAPI();
