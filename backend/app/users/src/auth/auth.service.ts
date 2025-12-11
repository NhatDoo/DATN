import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import is from 'zod/v4/locales/is.js';
import id from 'zod/v4/locales/id.js';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService , private jwtService: JwtService,) {}

  generateJwt(user: any): string {
    const payload = {
      sub: user.id,         // subject (user ID)
      email: user.email,    // email
      provider: user.provider || 'local', // nếu đăng nhập bằng Google
    };
    return this.jwtService.sign(payload);
  }

async validate(payload: any) {
  return { id: payload.id, email: payload.email }; // ✅ giữ id
}


async validateOAuthLogin(user: any) {
  let existingUser = await this.prisma.users.findUnique({
    where: { email: user.email },
  });

  if (!existingUser) {
    existingUser = await this.prisma.users.create({
      data: {
        email: user.email,
        full_name: user.name,
        password_hash: 'OAUTH_USER',
        metadata: {
          provider: user.provider,
          providerId: user.providerId,
        },
        is_info_updated: false,
      },
    });
  }
  const payload = { sub: existingUser.id, email: user.email };
  const token = await this.jwtService.signAsync(payload);
  return { access_token: token, is_info_updated: existingUser.is_info_updated  ,role :existingUser.role , is_banned: existingUser.is_banned};

}}
