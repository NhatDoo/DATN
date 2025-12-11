import { Controller, Post, Body, UseGuards, Get , Req ,Res, BadRequestException } from '@nestjs/common';
import { UsersService } from './user.service';
import type { Response , Request } from 'express';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { GenericController } from '@shared/core/generic.controller';
import { users } from '.prisma/users-client';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto , RegisterDto } from './DTO/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from '@shared/decorator/user.decorator';


@Controller('users')
export class UsersController extends GenericController<users, UsersService>{
  constructor(private readonly usersService: UsersService) {
    super(usersService); // nạp service vào generic
  }

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.usersService.register(body);
  }
  
  // @Post('login')
  // login(@Body() { email, password }: LoginDto) {
  //   return this.usersService.login({ email, password });
  // }
  @Post('login')
  async login(
    @Body() { email, password }: LoginDto,
    @Res() res: Response
  ) {
    return this.usersService.login({ email, password }, res);
  }

// @UseGuards(JwtAuthGuard)
// @Get('profile')
// async getProfile(@Req() req) {
//   const userId = req.user.id; // ✅ Giờ chỉ dùng id
//   if (!userId) throw new BadRequestException('Không tìm thấy id trong token');
  
//   const user = await this.usersService.findOne(userId);
//   return user;
// }
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@User() user :any) {
    return this.usersService.findOne(user.id);
  }


  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    return this.usersService.logout(req, res);
  }


  @Post('refresh-token')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.usersService.refreshAccessToken(req, res);
  }



  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.usersService.sendResetPasswordEmail(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.resetPassword(token, newPassword);
  }

  
@Post('send-code')
async sendCode(@Body('email') email: string) {
  return this.usersService.sendVerificationCode(email);
}

@MessagePattern('get_user_by_id') // 👈 lắng nghe message
  async handleGetUserById(@Payload() id: string) {
    const user = await this.usersService.findOne(id);
    return {
      full_name: user?.full_name,
      email: user?.email,
      avatar_url: user?.avatar_url,
    };
  }
}
