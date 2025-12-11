import { Controller, Post, Get, Param, Res, Query, UseGuards } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { GenericController } from '@shared/core/generic.controller';
import { certificates } from '.prisma/enrollments_client';
import type { Response } from 'express';
import { JwtAuthGuard } from '@shared/guard/jwt.guard';
import { User } from '@shared/decorator/user.decorator';

@Controller('certificate')
export class CertificateController extends GenericController<certificates, CertificateService> {
  constructor(private readonly certificateService: CertificateService) {
    super(certificateService);
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate/:courseId')
  async generateCertificate(
    @Param('courseId') courseId: string,
    @User() user: any
  ) {
    return this.certificateService.generateCertificate(user.id, courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('check/:courseId')
  async checkEligibility(
    @Param('courseId') courseId: string,
    @User() user: any
  ) {
    const eligible = await this.certificateService.checkEligibility(user.id, courseId);
    return { eligible };
  }

  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  async getCertificate(
    @Param('courseId') courseId: string,
    @User() user: any
  ) {
    return this.certificateService.getCertificate(user.id, courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-certificates')
  async getMyCertificates(@User() user: any) {
    return this.certificateService.getMyCertificates(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('download/:certificateId')
  async downloadPDF(
    @Param('certificateId') certificateId: string,
    @Query('userName') userName: string,
    @Query('courseName') courseName: string,
    @Res() res: Response
  ) {
    return this.certificateService.generatePDF(certificateId, userName, courseName, res);
  }
}
