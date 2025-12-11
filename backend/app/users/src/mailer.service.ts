// src/mailer/mailer.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string) {
    try {
      await this.transporter.sendMail({
        from: `"Support" <${process.env.MAIL_USER}>`,
        to,
        subject,
        text,
      });
      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw new InternalServerErrorException('Không thể gửi email xác minh');
    }
  }
}
