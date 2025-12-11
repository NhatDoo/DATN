import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GenericService } from '@shared/core/generic.service';
import { Prisma, certificates } from '.prisma/enrollments_client';
import { PrismaService } from '../prisma.service';
import PDFDocument from 'pdfkit';
import { Response } from 'express';


@Injectable()
export class CertificateService extends GenericService<certificates, Prisma.certificatesDelegate> {
    constructor(private prisma: PrismaService) {
        super(prisma.certificates);
    }

    /**
     * Kiểm tra điều kiện cấp chứng chỉ
     * - Đã hoàn thành khóa học
     * - Đã vượt qua bài kiểm tra (nếu có)
     */
    async checkEligibility(userId: string, courseId: string): Promise<boolean> {
        // 1. Kiểm tra enrollment (bất kể status)
        let enrollment = await this.prisma.enrollments.findFirst({
            where: {
                user_id: userId,
                course_id: courseId,
            },
        });

        if (!enrollment) {
            return false;
        }

        // 2. Nếu chưa completed, kiểm tra tiến độ thực tế từ Course Service
        if (enrollment.status !== 'completed') {
            try {
                const response = await fetch('http://localhost:3001/lessonprogress/internal/check-progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, courseId }),
                });

                if (response.ok) {
                    const data = await response.json();

                    // Nếu tiến độ >= 100% (hoặc gần đúng 1.0)
                    if (data.progress >= 0.99) {
                        // Cập nhật status thành completed
                        enrollment = await this.prisma.enrollments.update({
                            where: { id: enrollment.id },
                            data: {
                                status: 'completed',
                                completed_at: new Date()
                            }
                        });
                    } else {
                        // Nếu chưa 100% thì chưa đủ điều kiện (trừ khi có logic khác)
                        // Tuy nhiên, nếu đã pass Exam thì sao?
                        // Thường thì làm xong exam (cuối khóa) + progress > X% mới được.
                        // Ở đây ta cứ strict 100% progress hoặc...
                        // Nhưng user nói user đã 100%.
                    }
                }
            } catch (error) {
                console.error('Error verifying progress with Course Service:', error);

            }
        }



        if (enrollment.status !== 'completed') {

            return false;
        }

        // 3. Kiểm tra exam (nếu có)
        const exam = await this.prisma.exams.findFirst({
            where: { course_id: courseId },
        });

        if (exam) {
            const passedAttempt = await this.prisma.exam_attempts.findFirst({
                where: {
                    user_id: userId,
                    exam_id: exam.id,
                    passed: true,
                },
            });

            if (!passedAttempt) {
                return false;
            }
        }

        return true;
    }

    /**
     * Tạo chứng chỉ cho user
     */
    async generateCertificate(userId: string, courseId: string): Promise<certificates> {
        // Kiểm tra điều kiện
        const eligible = await this.checkEligibility(userId, courseId);
        if (!eligible) {
            throw new BadRequestException('User is not eligible for certificate');
        }

        // Kiểm tra đã có chứng chỉ chưa
        const existing = await this.prisma.certificates.findFirst({
            where: {
                user_id: userId,
                course_id: courseId,
            },
        });

        if (existing) {
            return existing;
        }

        // Tạo cert_number unique
        const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

        // Tạo chứng chỉ mới
        return this.prisma.certificates.create({
            data: {
                user_id: userId,
                course_id: courseId,
                cert_number: certNumber,
                issued_at: new Date(),
                metadata: {},
            },
        });
    }

    /**
     * Lấy chứng chỉ của user cho course
     */
    async getCertificate(userId: string, courseId: string): Promise<certificates | null> {
        return this.prisma.certificates.findFirst({
            where: {
                user_id: userId,
                course_id: courseId,
            },
        });
    }

    async getMyCertificates(userId: string) {
        const certs = await this.prisma.certificates.findMany({
            where: { user_id: userId },
            orderBy: { issued_at: 'desc' },
        });

        // Enrich with course info
        const enriched = await Promise.all(certs.map(async (cert) => {
            try {
                // Fetch course info from Course Service (port 3001)
                const response = await fetch(`http://localhost:3001/course/${cert.course_id}`);
                const course = response.ok ? await response.json() : null;
                return {
                    ...cert,
                    course_name: course ? course.title : 'Unknown Course',
                    course_slug: course ? course.slug : '',
                };
            } catch (e) {
                console.error(`Error fetching course ${cert.course_id}:`, e);
                return { ...cert, course_name: 'Unknown Course', course_slug: '' };
            }
        }));

        return enriched;
    }

    /**
     * Tạo PDF chứng chỉ
     */
    async generatePDF(
        certificateId: string,
        userNameQuery: string,
        courseName: string,
        res: Response
    ): Promise<void> {
        const certificate = await this.prisma.certificates.findUnique({
            where: { id: certificateId },
        });

        if (!certificate) {
            throw new NotFoundException('Certificate not found');
        }

        let finalUserName = userNameQuery;

        // Fetch User Full Name from User Service
        try {
            const userRes = await fetch(`http://localhost:3000/users/${certificate.user_id}`);
            if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.full_name) {
                    finalUserName = userData.full_name;
                }
            }
        } catch (error) {
            console.error('Error fetching user info for certificate:', error);
        }

        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 50, bottom: 50, left: 72, right: 72 },
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=certificate-${certificate.cert_number}.pdf`
        );

        // Pipe PDF to response
        doc.pipe(res);

        // Background gradient (simulated with rectangles)
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0f4f8');

        // Border
        doc
            .lineWidth(10)
            .strokeColor('#667eea')
            .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
            .stroke();

        doc
            .lineWidth(3)
            .strokeColor('#764ba2')
            .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
            .stroke();

        // Title
        doc
            .fontSize(48)
            .fillColor('#2d3748')
            .font('Helvetica-Bold')
            .text('CERTIFICATE', 0, 100, {
                align: 'center',
            });

        doc
            .fontSize(24)
            .fillColor('#4a5568')
            .font('Helvetica')
            .text('OF COMPLETION', 0, 160, {
                align: 'center',
            });

        // Decorative line
        doc
            .moveTo(doc.page.width / 2 - 100, 200)
            .lineTo(doc.page.width / 2 + 100, 200)
            .strokeColor('#667eea')
            .lineWidth(2)
            .stroke();

        // "This is to certify that"
        doc
            .fontSize(16)
            .fillColor('#718096')
            .font('Helvetica')
            .text('This is to certify that', 0, 240, {
                align: 'center',
            });

        // User name
        doc
            .fontSize(36)
            .fillColor('#667eea')
            .font('Helvetica-Bold')
            .text(finalUserName, 0, 280, {
                align: 'center',
            });

        // "has successfully completed"
        doc
            .fontSize(16)
            .fillColor('#718096')
            .font('Helvetica')
            .text('has successfully completed the course', 0, 340, {
                align: 'center',
            });

        // Course name
        doc
            .fontSize(28)
            .fillColor('#2d3748')
            .font('Helvetica-Bold')
            .text(courseName, 0, 380, {
                align: 'center',
            });

        // Date
        const issuedDate = new Date(certificate.issued_at).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        doc
            .fontSize(14)
            .fillColor('#4a5568')
            .font('Helvetica')
            .text(`Issued on ${issuedDate}`, 0, 460, {
                align: 'center',
            });

        // Certificate number
        doc
            .fontSize(12)
            .fillColor('#a0aec0')
            .font('Helvetica')
            .text(`Certificate No: ${certificate.cert_number}`, 0, 500, {
                align: 'center',
            });

        // Signature line (left)
        const signatureY = doc.page.height - 120;
        doc
            .moveTo(100, signatureY)
            .lineTo(250, signatureY)
            .strokeColor('#cbd5e0')
            .lineWidth(1)
            .stroke();

        doc
            .fontSize(12)
            .fillColor('#4a5568')
            .font('Helvetica-Bold')
            .text('Instructor Signature', 100, signatureY + 10, {
                width: 150,
                align: 'center',
            });

        // Signature line (right)
        doc
            .moveTo(doc.page.width - 250, signatureY)
            .lineTo(doc.page.width - 100, signatureY)
            .strokeColor('#cbd5e0')
            .lineWidth(1)
            .stroke();

        doc
            .fontSize(12)
            .fillColor('#4a5568')
            .font('Helvetica-Bold')
            .text('Director Signature', doc.page.width - 250, signatureY + 10, {
                width: 150,
                align: 'center',
            });

        // Finalize PDF
        doc.end();
    }
}
