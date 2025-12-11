import { z } from "zod";
import { PrismaService } from "../prisma.service";

const prisma = new PrismaService();



const userSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  full_name: z.string().min(3, "Tên quá ngắn"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  rememberMe: z.boolean().optional(),
});

export const usersValidate = {
  create: async (data: any) => {
    const parsed = userSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map(e => e.message).join(", "));
    }

    const existing = await prisma.users.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new Error("Email đã tồn tại");
  },

  update: async (data: any) => {
    if (data.password && data.password.length < 6) {
      throw new Error("Mật khẩu tối thiểu 6 ký tự");
    }
  },
};
