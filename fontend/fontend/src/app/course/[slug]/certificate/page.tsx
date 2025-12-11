'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import './certificate.css';

interface Certificate {
    id: string;
    cert_number: string;
    issued_at: string;
    user_id: string;
    course_id: string;
}

export default function CertificatePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [eligible, setEligible] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [userName, setUserName] = useState('');
    const [courseName, setCourseName] = useState('');

    useEffect(() => {
        fetchCertificateData();
    }, [slug]);

    const fetchCertificateData = async () => {
        try {
            // Lấy thông tin user và course
            const [userRes, courseRes] = await Promise.all([
                fetch('http://localhost:3001/user/me', { credentials: 'include' }),
                fetch(`http://localhost:3003/courses/slug/${slug}`, { credentials: 'include' }),
            ]);

            if (userRes.ok && courseRes.ok) {
                const userData = await userRes.json();
                const courseData = await courseRes.json();

                setUserName(userData.name || userData.email);
                setCourseName(courseData.title);

                // Kiểm tra điều kiện nhận chứng chỉ
                const eligibilityRes = await fetch(
                    `http://localhost:3002/certificate/check/${courseData.id}`,
                    { credentials: 'include' }
                );

                if (eligibilityRes.ok) {
                    const eligibilityData = await eligibilityRes.json();
                    setEligible(eligibilityData.eligible);

                    // Nếu đủ điều kiện, kiểm tra đã có chứng chỉ chưa
                    if (eligibilityData.eligible) {
                        const certRes = await fetch(
                            `http://localhost:3002/certificate/course/${courseData.id}`,
                            { credentials: 'include' }
                        );

                        if (certRes.ok) {
                            const certData = await certRes.json();
                            setCertificate(certData);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching certificate data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCertificate = async () => {
        setGenerating(true);
        try {
            const courseRes = await fetch(`http://localhost:3003/courses/slug/${slug}`, {
                credentials: 'include',
            });

            if (courseRes.ok) {
                const courseData = await courseRes.json();
                const response = await fetch(
                    `http://localhost:3002/certificate/generate/${courseData.id}`,
                    {
                        method: 'POST',
                        credentials: 'include',
                    }
                );

                if (response.ok) {
                    const newCert = await response.json();
                    setCertificate(newCert);
                }
            }
        } catch (error) {
            console.error('Error generating certificate:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!certificate) return;

        const url = `http://localhost:3002/certificate/download/${certificate.id}?userName=${encodeURIComponent(userName)}&courseName=${encodeURIComponent(courseName)}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="certificate-container">
                <div className="loading">Đang tải...</div>
            </div>
        );
    }

    if (!eligible) {
        return (
            <div className="certificate-container">
                <div className="not-eligible">
                    <div className="icon">🔒</div>
                    <h1>Chưa đủ điều kiện nhận chứng chỉ</h1>
                    <p>Bạn cần hoàn thành các yêu cầu sau để nhận chứng chỉ:</p>
                    <ul>
                        <li>✅ Hoàn thành tất cả bài học trong khóa học</li>
                        <li>✅ Vượt qua bài kiểm tra cuối khóa (nếu có)</li>
                    </ul>
                    <button onClick={() => router.push(`/course/${slug}`)} className="btn-back">
                        Quay lại khóa học
                    </button>
                </div>
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="certificate-container">
                <div className="generate-section">
                    <div className="icon">🎓</div>
                    <h1>Chúc mừng!</h1>
                    <p>Bạn đã hoàn thành khóa học <strong>{courseName}</strong></p>
                    <p className="subtitle">Nhấn nút bên dưới để nhận chứng chỉ của bạn</p>

                    <button
                        onClick={handleGenerateCertificate}
                        disabled={generating}
                        className="btn-generate"
                    >
                        {generating ? 'Đang tạo chứng chỉ...' : '🎉 Nhận chứng chỉ'}
                    </button>
                </div>
            </div>
        );
    }

    const issuedDate = new Date(certificate.issued_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="certificate-container">
            <div className="certificate-display">
                <div className="certificate-preview">
                    <div className="cert-border">
                        <div className="cert-content">
                            <h1 className="cert-title">CERTIFICATE</h1>
                            <h2 className="cert-subtitle">OF COMPLETION</h2>

                            <div className="cert-divider"></div>

                            <p className="cert-text">This is to certify that</p>
                            <h3 className="cert-name">{userName}</h3>
                            <p className="cert-text">has successfully completed the course</p>
                            <h4 className="cert-course">{courseName}</h4>

                            <p className="cert-date">Issued on {issuedDate}</p>
                            <p className="cert-number">Certificate No: {certificate.cert_number}</p>

                            <div className="cert-signatures">
                                <div className="signature">
                                    <div className="signature-line"></div>
                                    <p>Instructor Signature</p>
                                </div>
                                <div className="signature">
                                    <div className="signature-line"></div>
                                    <p>Director Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="certificate-actions">
                    <button onClick={handleDownloadPDF} className="btn-download">
                        📥 Tải xuống PDF
                    </button>
                    <button onClick={() => router.push(`/course/${slug}`)} className="btn-back-course">
                        ← Quay lại khóa học
                    </button>
                </div>

                <div className="certificate-info">
                    <div className="info-card">
                        <span className="info-icon">🎓</span>
                        <div>
                            <strong>Khóa học</strong>
                            <p>{courseName}</p>
                        </div>
                    </div>
                    <div className="info-card">
                        <span className="info-icon">📅</span>
                        <div>
                            <strong>Ngày cấp</strong>
                            <p>{issuedDate}</p>
                        </div>
                    </div>
                    <div className="info-card">
                        <span className="info-icon">🔢</span>
                        <div>
                            <strong>Mã chứng chỉ</strong>
                            <p>{certificate.cert_number}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
