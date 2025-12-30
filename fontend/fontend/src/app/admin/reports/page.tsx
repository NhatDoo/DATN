"use client";
import { useEffect, useState } from "react";
import Navbar from "../../components/AdminNavbar";
import Footer from "../../components/Footer";
import Hero from "../../components/Herowrap";
import "../../globals.css";
import Script from "next/script";

interface Report {
    id: string;
    course: {
        title: string;
        instructor_id: string;
        slug: string;
    };
    user: {
        full_name: string;
        email: string;
    } | null;
    reason: string;
    description: string;
    status: string;
    created_at: string;
}

export default function AdminReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const fetchReports = async () => {
        try {
            const res = await fetch("http://localhost:3001/reports");
            const data = await res.json();
            setReports(data);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`http://localhost:3001/reports/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                if (newStatus === 'warning_sent') {
                    alert("Đã gửi cảnh báo đến giảng viên!");
                } else if (newStatus === 'hidden') {
                    alert("Đã ẩn khóa học!");
                } else {
                    alert("Đã cập nhật trạng thái!");
                }
                fetchReports();
            } else {
                alert("Cập nhật thất bại.");
            }
        } catch (error) {
            console.error("Update error:", error);
            alert("Lỗi khi cập nhật.");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="badge bg-warning text-dark">Chờ xử lý</span>;
            case 'resolved': return <span className="badge bg-success">Đã giải quyết</span>;
            case 'ignored': return <span className="badge bg-secondary">Đã bỏ qua</span>;
            case 'warning_sent': return <span className="badge bg-danger">Đã cảnh báo</span>;
            case 'hidden': return <span className="badge bg-dark">Đã ẩn khóa học</span>;
            default: return <span className="badge bg-light text-dark">{status}</span>;
        }
    }

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
            <Navbar />
            <div className="container py-5 min-vh-100">
                <h1 className="display-6 fw-bold mb-4 text-primary text-center">Quản lý Báo cáo Khóa học</h1>

                {loading ? (
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden"></span>
                        </div>
                    </div>
                ) : (
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Khóa học</th>
                                            <th>Người báo cáo</th>
                                            <th>Lý do</th>
                                            <th>Mô tả</th>
                                            <th>Trạng thái</th>
                                            <th>Thời gian</th>
                                            <th className="text-end">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map((report) => (
                                            <tr key={report.id}>
                                                <td className="fw-medium">
                                                    <div className="d-flex flex-column">
                                                        <span>{report.course?.title || "Unknown Course"}</span>
                                                        <a href={`/course/${report.course?.slug}`} target="_blank" className="small text-primary text-decoration-none">
                                                            Xem chi tiết ↗
                                                        </a>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <span className="fw-bold">{report.user?.full_name || "Unknown User"}</span>
                                                        <small className="text-muted">{report.user?.email}</small>
                                                    </div>
                                                </td>
                                                <td>{getReasonLabel(report.reason)}</td>
                                                <td>
                                                    <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }} title={report.description}>
                                                        {report.description}
                                                    </span>
                                                </td>
                                                <td>{getStatusBadge(report.status)}</td>
                                                <td>{new Date(report.created_at).toLocaleDateString('vi-VN')}</td>
                                                <td className="text-end">
                                                    <div className="dropdown position-relative">
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                            type="button"
                                                            onClick={() => setOpenDropdownId(openDropdownId === report.id ? null : report.id)}
                                                        >
                                                            Xử lý
                                                        </button>
                                                        {openDropdownId === report.id && (
                                                            <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 1000, display: 'block' }}>
                                                                <li><button className="dropdown-item text-danger" onClick={() => { handleUpdateStatus(report.id, 'warning_sent'); setOpenDropdownId(null); }}>⚠️ Gửi cảnh báo</button></li>
                                                                <li><button className="dropdown-item text-dark" onClick={() => { handleUpdateStatus(report.id, 'hidden'); setOpenDropdownId(null); }}>🚫 Ẩn khóa học</button></li>
                                                                <li><button className="dropdown-item text-success" onClick={() => { handleUpdateStatus(report.id, 'resolved'); setOpenDropdownId(null); }}>✅ Đã giải quyết</button></li>
                                                                <li><button className="dropdown-item text-secondary" onClick={() => { handleUpdateStatus(report.id, 'ignored'); setOpenDropdownId(null); }}>❌ Bỏ qua</button></li>
                                                            </ul>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {reports.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-4 text-muted">Chưa có báo cáo nào.</td>
                                            </tr>
                                        )}
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


