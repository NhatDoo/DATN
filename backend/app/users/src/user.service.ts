// src/users/user.service.ts
import { Injectable, UnauthorizedException, BadRequestException} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './DTO/auth.dto';
import { GenericService } from '@shared/core/generic.service';
import { Prisma , users } from '.prisma/users-client';
import { loginSchema } from './validation/auth.validation';;
import * as crypto from 'crypto';
import { MailerService } from './mailer.service';

import * as nodemailer from 'nodemailer';


@Injectable()
export class UsersService extends GenericService<users, Prisma.usersDelegate> {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    
  ) 
  {
    super(prisma.users); // đúng model "users"
  }

  async sendVerificationCode(email: string) {
      // 1️⃣ Sinh mã 6 chữ số
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 2️⃣ Gửi email
      await this.mailerService.sendMail(
        email,
        'Xác nhận đăng ký tài khoản',
        `Mã xác minh của bạn là: ${code}\n\nMã sẽ hết hạn sau 5 phút.`,
      );

      // 3️⃣ Lưu hoặc cập nhật vào bảng email_verifications
      const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
      await this.prisma.email_verifications.upsert({
        where: { email },
        update: { code, expires_at },
        create: { email, code, expires_at },
      });

      return { message: 'Đã gửi mã xác minh đến email của bạn' };
  }

  async register(data: RegisterDto) {
    const record = await this.prisma.email_verifications.findUnique({
      where: { email: data.email },
    });

    if (!record || record.code !== data.code) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (record.expires_at < new Date()) {
      throw new BadRequestException('Verification code expired');
    }



    
  const hashedPassword = await bcrypt.hash(data.password, 10);
     await this.prisma.users.create({
      data: {
        email: data.email,
        password_hash: hashedPassword,
        full_name: data.full_name,
      },
    });
    // Xóa record xác minh sau khi dùng
    await this.prisma.email_verifications.delete({
      where: { email: data.email },
    });
    return { message: 'User registered successfully' };
  }

  async login(data: LoginDto & { rememberMe?: boolean }, res: Response) {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      throw new UnauthorizedException(parsed.error.issues.map(e => e.message).join(', '));
    }

    const user = await this.prisma.users.findUnique({
      where: { email: data.email },
    });
    if (!user?.password_hash) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };

    // ⏰ Thời gian hết hạn access token (15 phút)
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });

    // 🧠 Kiểm tra xem user có chọn Remember Me không
    const rememberMe = data.rememberMe === true;

    // ⏳ Nếu có Remember Me → refresh token 30 ngày, nếu không thì 1 ngày
    const refreshExpireDays = rememberMe ? 30 : 1;
    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: `${refreshExpireDays}d` });

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        refresh_token: refreshToken,
        refresh_expires: new Date(Date.now() + refreshExpireDays * 24 * 60 * 60 * 1000),
      },
    });

    // 🍪 Gửi cookie an toàn
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 phút
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: refreshExpireDays * 24 * 60 * 60 * 1000, // 1 hoặc 30 ngày
    });

    return res.json({
      message: 'Login successful',
      is_info_updated: user.is_info_updated,
      role: user.role,
      rememberMe, // 👈 Gửi để frontend biết user có chọn Remember Me
    });
  }

  async refreshAccessToken(req: any, res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.prisma.users.findUnique({ where: { id: payload.sub } });

      if (!user || user.refresh_token !== refreshToken)
        throw new UnauthorizedException('Invalid refresh token');

      // 🔁 Cấp token mới
      const newAccessToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        { expiresIn: '15m' }
      );

      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      });

      return { message: 'Access token refreshed' };
    } catch {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  async logout(req: any, res: Response) {
    const refreshToken = req.cookies['refresh_token'];

    // ✅ Nếu có refresh_token thì xóa trong DB
    if (refreshToken) {
      await this.prisma.users.updateMany({
        where: { refresh_token: refreshToken },
        data: { refresh_token: null, refresh_expires: null },
      });
    }

    // ✅ Xóa cookie ở phía client
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return res.json({ message: 'Đăng xuất thành công' });
  }

    async sendResetPasswordEmail(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Email không tồn tại');

    // Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 phút

    await this.prisma.users.update({
      where: { email },
      data: { reset_token: token, reset_expires: expires },
    });

    // Gửi email (dùng Gmail hoặc Mailtrap)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // dùng SSL
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // ⚠️ Bỏ qua lỗi self-signed certificate
      },
    });

    const resetLink = `http://localhost:4000/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Support" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Đặt lại mật khẩu',
      html: `
        <p>Chào bạn,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào link dưới đây để đổi mật khẩu:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Link có hiệu lực trong 15 phút.</p>
      `,
    });

    return { message: 'Đã gửi email đặt lại mật khẩu' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.users.findFirst({
      where: {
        reset_token: token,
        reset_expires: { gt: new Date() },
      },
    });

    if (!user) throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_expires: null,
      },
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }


  async create(data: any) {
    // ⚙️ Nếu client gửi password thì hash trước khi lưu
    if (data.password) {
      data.password_hash = await bcrypt.hash(data.password, 10);
      delete data.password; // tránh lưu plaintext password
    }

    // ⚙️ Nếu chưa có role thì set mặc định
    if (!data.role) {
      data.role = 'admin';
    }

    return super.create(data);
  }
  

}
