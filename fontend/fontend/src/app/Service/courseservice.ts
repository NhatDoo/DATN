import { Course } from "../models/course";

export async function getCourses(): Promise<Course[]> {
  const res = await fetch("http://localhost:3000/course");
  if (!res.ok) throw new Error("Failed to fetch courses");
  return res.json();
}
