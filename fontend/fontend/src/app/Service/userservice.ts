import { User } from "../models/users";

export async function getUserById(id: string): Promise<User> {
  const res = await fetch(`http://localhost:3000/user/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch user ${id}`);
  return res.json();
}
