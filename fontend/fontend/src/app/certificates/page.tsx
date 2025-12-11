"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import styles from "./Certificate.module.css";
import '../globals.css'
import axios from "axios";

interface Certificate {
    id: string;
    course_id: string;
    cert_number: string;
    issued_at: string;
    course_name: string;
    course_slug: string;
}

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Student");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get User Profile for Name (needed for PDF)
                // Try user/profile or similar. If fails, default to "Student"
                try {
                    const userRes = await axios.get("http://localhost:3000/users/profile", {
                        withCredentials: true
                    });
                    if (userRes.data && userRes.data.full_name) {
                        setUserName(userRes.data.full_name);
                    }
                } catch (e) {
                    console.log("Could not fetch user profile, using default name");
                }

                // 2. Get Certificates
                const res = await axios.get("http://localhost:3003/certificate/my-certificates", {
                    withCredentials: true,
                });

                if (res.data) {
                    setCertificates(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch certificates:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDownload = (cert: Certificate) => {
        const url = `http://localhost:3003/certificate/download/${cert.id}?userName=${encodeURIComponent(userName)}&courseName=${encodeURIComponent(cert.course_name)}`;
        window.open(url, "_blank");
    };

    return (
        <main>
            <Navbar />
            <div className={styles.pageContainer}>
                <div className="container">
                    <div className={styles.header}>
                        <h1 className={styles.title}>Chứng Chỉ Của Tôi</h1>
                        <p className={styles.subtitle}>
                            Ghi nhận những thành tựu học tập đáng tự hào của bạn
                        </p>
                    </div>

                    {loading ? (
                        <Loader />
                    ) : certificates.length === 0 ? (
                        <div className={styles.emptyState}>
                            <EmptyIcon className={styles.emptyIcon} />
                            <h3>Bạn chưa có chứng chỉ nào</h3>
                            <p>Hãy hoàn thành các khóa học để nhận chứng chỉ nhé!</p>
                            <a href="/course" className="btn btn-primary mt-3" style={{ borderRadius: '50px' }}>Khám phá khóa học</a>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {certificates.map((cert) => (
                                <div key={cert.id} className={styles.card}>
                                    <div className={styles.iconWrapper}>
                                        <TrophyIcon className={styles.icon} />
                                    </div>
                                    <h3 className={styles.courseTitle}>{cert.course_name}</h3>
                                    <div className={styles.certId}>ID: {cert.cert_number}</div>
                                    <div className={styles.date}>
                                        Cấp ngày: {new Date(cert.issued_at).toLocaleDateString("vi-VN")}
                                    </div>
                                    <button
                                        className={styles.downloadBtn}
                                        onClick={() => handleDownload(cert)}
                                    >
                                        <DownloadIcon /> Tải chứng chỉ
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </main>
    );
}

function TrophyIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15l-2 5l9-5l9 5l-2-5" />
            {/* Simplified generic trophy/medal shape */}
            <circle cx="12" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    );
}

function EmptyIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    )
}
