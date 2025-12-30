"use client";
import React, { useEffect, useState, useMemo } from 'react';

interface StudentProgress {
    user_id: string;
    completed_lessons: number;
    total_lessons: number;
    progress_percentage: number;
    last_watched_at: string;
    user: {
        id: string;
        full_name: string;
        email: string;
    } | null;
}

export default function InstructorStudentProgress({ courseId }: { courseId: string }) {
    const [students, setStudents] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await fetch(`http://localhost:3001/lessonprogress/instructor/course/${courseId}`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, [courseId]);

    const stats = useMemo(() => {
        const total = students.length;
        const completed = students.filter(s => s.progress_percentage >= 100).length;
        const inProgress = total - completed;
        const rate = total > 0 ? (completed / total) * 100 : 0;
        return { total, completed, inProgress, rate };
    }, [students]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (filter === 'completed') return s.progress_percentage >= 100;
            if (filter === 'in_progress') return s.progress_percentage < 100;
            return true;
        });
    }, [students, filter]);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center p-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    return (
        <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold m-0"><i className="bi bi-people-fill me-2 text-primary"></i>Theo dõi tiến độ học viên</h4>
                <div className="btn-group">
                    <button
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setFilter('all')}
                    >
                        Tất cả
                    </button>
                    <button
                        className={`btn ${filter === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => setFilter('completed')}
                    >
                        Đã hoàn thành
                    </button>
                    <button
                        className={`btn ${filter === 'in_progress' ? 'btn-warning' : 'btn-outline-warning'}`}
                        onClick={() => setFilter('in_progress')}
                    >
                        Đang học
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 bg-primary text-white bg-gradient">
                        <div className="card-body">
                            <h6 className="card-title opacity-75">Tổng học viên đang học</h6>
                            <h2 className="display-6 fw-bold mb-0">{stats.total}</h2>
                            <small>Học viên đã bắt đầu bài học</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 bg-success text-white bg-gradient">
                        <div className="card-body">
                            <h6 className="card-title opacity-75">Đã hoàn thành</h6>
                            <div className="d-flex align-items-baseline">
                                <h2 className="display-6 fw-bold mb-0">{stats.completed}</h2>
                                <span className="ms-2">({Math.round(stats.rate)}%)</span>
                            </div>
                            <small>Học viên hoàn thành 100% khóa học</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100 bg-warning text-dark bg-gradient">
                        <div className="card-body">
                            <h6 className="card-title opacity-75">Đang học</h6>
                            <h2 className="display-6 fw-bold mb-0">{stats.inProgress}</h2>
                            <small>Tiến độ dưới 100%</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                <div className="card-body p-0">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
                            <p>Không tìm thấy dữ liệu phù hợp.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light text-secondary">
                                    <tr>
                                        <th className="ps-4">Học viên</th>
                                        <th style={{ width: '35%' }}>Tiến độ chi tiết</th>
                                        <th className="text-center">Trạng thái</th>
                                        <th>Hoạt động gần nhất</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(s => (
                                        <tr key={s.user_id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center">
                                                    <div className="avg-avatar rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center me-3" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                                                        {s.user?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{s.user?.full_name || 'Người dùng ẩn danh'}</div>
                                                        <small className="text-muted">{s.user?.email || 'N/A'}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center mb-1">
                                                    <span className="fw-bold me-2 text-dark">{Math.round(s.progress_percentage)}%</span>
                                                    <small className="text-muted">({s.completed_lessons}/{s.total_lessons} bài)</small>
                                                </div>
                                                <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                                                    <div
                                                        className={`progress-bar ${s.progress_percentage >= 100 ? 'bg-success' : 'bg-primary'}`}
                                                        style={{ width: `${s.progress_percentage}%`, borderRadius: '4px' }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {s.progress_percentage >= 100 ? (
                                                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">
                                                        <i className="bi bi-check-circle-fill me-1"></i> Hoàn thành
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-3">
                                                        <i className="bi bi-hourglass-split me-1"></i> Đang học
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-muted">
                                                <i className="bi bi-clock me-1"></i>
                                                {new Date(s.last_watched_at).toLocaleDateString('vi-VN', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
