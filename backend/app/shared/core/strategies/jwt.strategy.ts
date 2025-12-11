import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 🟢 Ưu tiên lấy từ cookie trước
        
        (req: Request) => {
          // console.log('Cookies:', req.cookies);
          if (req?.cookies?.access_token) {
            return req.cookies.access_token;
          }
          // 🟡 fallback: vẫn cho phép lấy từ header Bearer token nếu có
          return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        '59efedfdabdd1cfb6321d61887a52e73b65db593e961a35cbc6e8db80972631237dda83d0f9d88cb9db094f066e6f8d98351a86c6d813fd6d60d61a1e2f06317',
    });
  }

  async validate(payload: any) {
    const id = payload.sub || payload.id;

    if (!id) {
      throw new Error('JWT payload is missing user id');
    }

    return {
      id,
      email: payload.email,
      role: payload.role ?? 'user',
    };
  }
}
