import { useEffect, useState } from "react";
import { courseAPI, Course } from "../gateway/course/course.gateway";


export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load danh sách khoá học khi mount
  useEffect(() => {
    courseAPI.getAll()
      .then(setCourses)
      .catch(err => setError(err.message));
  }, []);

  // Xử lý xoá
  const handleDelete = async (id: string) => {
    try {
      await courseAPI.delete(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Tạo mới
  const handleCreate = async (course: Omit<Course, 'id'>) => {
    try {
      const newCourse = await courseAPI.create(course);
      setCourses(prev => [...prev, newCourse]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Cập nhật
  const handleUpdate = async (id: string, updates: Partial<Course>) => {
    try {
      const updated = await courseAPI.update(id, updates);
      setCourses(prev =>
        prev.map(c => (c.id === id ? updated : c))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  return {
    courses,
    error,
    handleDelete,
    handleCreate,
    handleUpdate,
  };
}
