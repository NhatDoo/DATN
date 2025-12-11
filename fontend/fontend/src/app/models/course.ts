import { User } from "./users"

export interface Course {
  id: string;
  title: string;
  instructor_id: string;
  instructor?: User; // sẽ gán sau khi fetch
}
