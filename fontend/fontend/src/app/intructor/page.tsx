"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Intructernavbar";
import Hero from "../components/Herowrap";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import Head from "next/head";
import "../globals.css";
import { checkIsBanned } from '@/app/ultis/checkbanned';

interface Course {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  background: string;
  price_bigint: number;
  enrollment_count: number;
  is_published: boolean;
  created_at: string;
  categories?: { id: string; name: string }[];
}

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    publishedCourses: 0,
  });
  const router = useRouter();

  useEffect(() => {
    checkIsBanned();
    const checkRole = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });

        if (!res.ok) {
          window.location.href = "/login";
          return;
        }

        const user = await res.json();

        if (user.role !== "instructor") {
          alert("Bạn không có quyền truy cập trang này!");
          window.location.href = "/login";
          return;
        }

        await fetchCourses();
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
        window.location.href = "/login";
      }
    };

    checkRole();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/course/user", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Không thể tải khóa học");

      const data = await res.json();
      setCourses(data);

      const totalStudents = data.reduce((sum: number, course: Course) => sum + (course.enrollment_count || 0), 0);
      const publishedCourses = data.filter((course: Course) => course.is_published).length;

      setStats({
        totalCourses: data.length,
        totalStudents,
        publishedCourses,
      });
    } catch (err) {
      console.error("❌ Lỗi tải khóa học:", err);
      alert("Không thể tải danh sách khóa học!");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    window.location.href = "/intructor/intructor_course";
  };

  const handleEditCourse = (slug: string) => {
    window.location.href = `/intructor/${slug}`;
  };

  const handleDeleteCourse = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm(`Bạn có chắc muốn xóa khóa học "${title}"?`)) return;

    try {
      const res = await fetch(`http://localhost:3001/course/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Không thể xóa khóa học");

      alert("✅ Đã xóa khóa học thành công!");
      await fetchCourses();
    } catch (err) {
      console.error("❌ Lỗi xóa khóa học:", err);
      alert("Không thể xóa khóa học!");
    }
  };

  return (
    <>
      <Head>
        <title>Quản Lý Khóa Học - StudyLab Instructor</title>
        <meta name="description" content="Quản lý các khóa học của bạn trên StudyLab" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .stat-card {
          animation: fadeInUp 0.6s ease-out;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
        }

        .course-card {
          animation: fadeInUp 0.6s ease-out;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .course-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.2) !important;
        }

        .course-card img {
          transition: transform 0.5s ease;
        }

        .course-card:hover img {
          transform: scale(1.1);
        }

        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          transition: all 0.3s ease;
        }

        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
        }

        .badge-custom {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <main role="main">
        <Navbar />
        <Hero background="/images/bg_2.jpg" />

        <section className="container py-5">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Dashboard Giảng Viên
            </h1>
            <p className="lead text-muted">Quản lý và theo dõi các khóa học của bạn</p>
          </div>

          <div className="row mb-5 g-4">
            <div className="col-md-4">
              <div
                className="stat-card card border-0 shadow h-100"
                style={{
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  animationDelay: '0.1s'
                }}
              >
                <div className="card-body text-white text-center py-5">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>📚</div>
                  <h2 className="display-3 fw-bold mb-2">{stats.totalCourses}</h2>
                  <p className="mb-0 text-white-50 text-uppercase" style={{ letterSpacing: '2px', fontSize: '0.875rem' }}>
                    Tổng Khóa Học
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className="stat-card card border-0 shadow h-100"
                style={{
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  animationDelay: '0.2s'
                }}
              >
                <div className="card-body text-white text-center py-5">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>👥</div>
                  <h2 className="display-3 fw-bold mb-2">{stats.totalStudents}</h2>
                  <p className="mb-0 text-white-50 text-uppercase" style={{ letterSpacing: '2px', fontSize: '0.875rem' }}>
                    Tổng Học Viên
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div
                className="stat-card card border-0 shadow h-100"
                style={{
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  animationDelay: '0.3s'
                }}
              >
                <div className="card-body text-white text-center py-5">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>✓</div>
                  <h2 className="display-3 fw-bold mb-2">{stats.publishedCourses}</h2>
                  <p className="mb-0 text-white-50 text-uppercase" style={{ letterSpacing: '2px', fontSize: '0.875rem' }}>
                    Đã Xuất Bản
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div>
              <h2 className="mb-1 fw-bold">Khóa Học Của Tôi</h2>
              <p className="text-muted mb-0">Quản lý và chỉnh sửa nội dung khóa học</p>
            </div>
            <button
              onClick={handleCreateCourse}
              className="btn btn-gradient btn-lg text-white fw-bold px-4"
              style={{
                borderRadius: '15px',
                padding: '14px 32px',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                fontSize: '1rem'
              }}
            >
              <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>+</span>
              Tạo Khóa Học Mới
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="text-muted">Đang tải khóa học...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4" style={{ fontSize: '5rem', animation: 'pulse 2s infinite' }}>📚</div>
              <h3 className="mb-3">Chưa có khóa học nào</h3>
              <p className="text-muted mb-4">Bắt đầu chia sẻ kiến thức của bạn với hàng ngàn học viên!</p>
              <button
                onClick={handleCreateCourse}
                className="btn btn-gradient btn-lg text-white fw-bold px-5"
                style={{ borderRadius: '15px' }}
              >
                Tạo Khóa Học Đầu Tiên
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {courses.map((course, index) => (
                <div key={course.id} className="col-md-6 col-lg-4" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div
                    className="course-card card h-100 border-0 shadow"
                    style={{ borderRadius: '20px', overflow: 'hidden' }}
                    onClick={() => handleEditCourse(course.slug)}
                  >
                    <div
                      className="position-relative"
                      style={{ height: '220px', overflow: 'hidden', background: '#f0f0f0' }}
                    >
                      <img
                        src={course.background || '/image.png'}
                        alt={course.title}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="position-absolute top-0 end-0 m-3">
                        <span
                          className={`badge ${course.is_published ? 'bg-success' : 'bg-warning text-dark'} badge-custom`}
                          style={{
                            fontSize: '0.75rem',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            fontWeight: '600'
                          }}
                        >
                          {course.is_published ? '✓ Xuất bản' : '⏳ Nháp'}
                        </span>
                      </div>
                      <div
                        className="position-absolute bottom-0 start-0 end-0 p-3"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'
                        }}
                      >
                        <div className="d-flex gap-2 flex-wrap">
                          {course.categories?.slice(0, 2).map((cat) => (
                            <span
                              key={cat.id}
                              className="badge bg-white text-dark"
                              style={{
                                fontSize: '0.7rem',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontWeight: '500'
                              }}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="card-body p-4">
                      <h5 className="card-title fw-bold mb-3" style={{
                        minHeight: '50px',
                        fontSize: '1.1rem',
                        lineHeight: '1.4'
                      }}>
                        {course.title}
                      </h5>
                      <p className="card-text text-muted small mb-3" style={{
                        minHeight: '45px',
                        lineHeight: '1.6'
                      }}>
                        {course.short_description?.substring(0, 80) || 'Chưa có mô tả'}
                        {course.short_description?.length > 80 && '...'}
                      </p>

                      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: '1.2rem' }}>👥</span>
                          <span className="text-muted small">{course.enrollment_count || 0} học viên</span>
                        </div>
                        <div className="fw-bold" style={{
                          color: '#667eea',
                          fontSize: '1.1rem'
                        }}>
                          {course.price_bigint.toLocaleString()} ₫
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCourse(course.slug);
                          }}
                          className="btn btn-outline-primary flex-fill"
                          style={{
                            borderRadius: '10px',
                            fontWeight: '600',
                            padding: '10px'
                          }}
                        >
                          ✏️ Chỉnh sửa
                        </button>
                        <button
                          onClick={(e) => handleDeleteCourse(e, course.id, course.title)}
                          className="btn btn-outline-danger"
                          style={{
                            borderRadius: '10px',
                            fontWeight: '600',
                            padding: '10px 20px'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Footer />
        <Loader />
      </main>
    </>
  );
}
