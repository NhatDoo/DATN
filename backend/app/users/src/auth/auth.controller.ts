import { Controller, Get, Req, Res , UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { access } from 'fs';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // redirect tới Google login
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const user = await this.authService.validateOAuthLogin(req.user);

    res.cookie('access_token', user.access_token, {
      httpOnly: false, 
      sameSite: 'lax',
      secure: false, 
      path: '/',
    });

  if(user.is_banned === true){
    return res.redirect('http://localhost:4000/banned');
  }
  else
  { 
    if (user.is_info_updated === false) {
    return res.redirect('http://localhost:4000/update-info');
  }
  if (user.role == 'student') {
    return res.redirect('http://localhost:4000/course');
  }
  else if(user.role == 'instructor'){
    return res.redirect('http://localhost:4000/intructor');
  }
  }

 
}

}
