// src/users/dto/user.dto.ts
export class UserDto {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  role: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}
