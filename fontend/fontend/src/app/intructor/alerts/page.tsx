"use client";
import React, { useEffect, useState } from "react";
import Intructernavbar from "../../components/Intructernavbar";
import Footer from "../../components/Footer";
import Hero from "../../components/Herowrap";
import "../../globals.css";

interface Report {
    id: string;
    course: {
        title: string;
        slug: string;
    };
    reason: string;
    description: string;
    status: string;
    created_at: string;
}

export default function InstructorAlerts() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const userRes = await fetch("http://localhost:3000/users/profile", {
                    credentials: "include",
                });
                if (!userRes.ok) throw new Error("Không thể lấy thông tin người dùng.");
                const user = await userRes.json();

                const res = await fetch(`http://localhost:3001/reports/instructor/${user.id}`);
                const data = await res.json();
                setReports(data || []);
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const getReasonLabel = (reason: string) => {
        switch (reason) {
            case 'spam': return 'Spam';
            case 'inappropriate_content': return 'Nội dung không phù hợp';
            case 'scam': return 'Lừa đảo';
            case 'copyright': return 'Vi phạm bản quyền';
            case 'other': return 'Khác';
            default: return reason;
        }
    };

    return (
        <main>
            <Hero background="/image.png" />
            <Intructernavbar />
            <div className="container py-5 min-vh-100">
                <h1 className="display-6 fw-bold mb-4 text-danger text-center">⚠️ Cảnh báo & Vi phạm</h1>

                {loading ? (
                    <div className="text-center">
                        <div className="spinner-border text-danger" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="alert alert-success text-center">
                        🎉 Bạn không có cảnh báo nào. Hãy tiếp tục duy trì chất lượng khóa học nhé!
                    </div>
                ) : (
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Khóa học</th>
                                            <th>Lý do vi phạm</th>
                                            <th>Chi tiết cảnh báo</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày cảnh báo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map((report) => (
                                            <tr key={report.id}>
                                                <td className="fw-medium text-danger">{report.course?.title}</td>
                                                <td>{getReasonLabel(report.reason)}</td>
                                                <td>{report.description || "Không có mô tả"}</td>
                                                <td>
                                                    {report.status === 'hidden' ? (
                                                        <span className="badge bg-dark">🚫 Khóa học đã bị ẩn</span>
                                                    ) : (
                                                        <span className="badge bg-danger">⚠️ Cảnh báo</span>
                                                    )}
                                                </td>
                                                <td>{new Date(report.created_at).toLocaleDateString('vi-VN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </main>
    );
}
