"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../components/Intructernavbar";
import Footer from "../../components/Footer";
import Metahead from "../../components/Head";
import Hero from "../../components/Herowrap";
import Loader from "@/app/components/Loader";
import LessonList from "./lessonlist";
import { useRouter } from "next/navigation";
import Head from "next/head";
import "../../globals.css";
import "./course-detail.css";
import { checkIsBanned } from '@/app/ultis/checkbanned';
// Import new CSS file for animations

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]); // 🆕 State for exams
  const router = useRouter();
  const handleAddToCart = async () => {

    router.push(`/intructor/intructor_lesson/${slug}`);
    router.refresh();
  }



  useEffect(() => {
    checkIsBanned();
    const checkRole = async () => {
      try {
        const res = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });

        // if (!res.ok) throw new Error("Không thể xác thực người dùng");

        const user = await res.json();

        // ⚙️ Kiểm tra role
        if (user.role !== "instructor") {
          alert("Bạn không có quyền truy cập trang này!");
          router.push("/login");
        }
      } catch (err) {
        console.error("❌ Lỗi xác thực:", err);
        router.push("/login");
        router.refresh();
      }
    };

    checkRole();
  }, []);




  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`http://localhost:3001/course/slug/${slug}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const result = Array.isArray(data) ? data[0] : data.data ?? data;
        setCourse(result);
      } catch (err) {
        console.error("❌ Lỗi khi fetch course:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchCourse();
  }, [slug]);

  // 🆕 Fetch exams when course is loaded
  useEffect(() => {
    if (!course?.id) return;
    const fetchExams = async () => {
      try {
        const res = await fetch(`http://localhost:3003/exams/course/${course.id}/list`);
        if (res.ok) {
          const data = await res.json();
          setExams(data);
        }
      } catch (err) {
        console.error("❌ Error fetching exams:", err);
      }
    };
    fetchExams();
  }, [course]);

  // 🆕 Handle Delete Exam
  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này không?")) return;

    try {
      const res = await fetch(`http://localhost:3003/exams/${examId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ Đã xóa bài kiểm tra!");
        setExams(exams.filter((ex) => ex.id !== examId));
      } else {
        alert("❌ Lỗi khi xóa bài kiểm tra");
      }
    } catch (err) {
      console.error("Lỗi xóa bài kiểm tra:", err);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      window.location.reload();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (loading) return <Loader />;
  if (!course) return <p className="text-center mt-5 text-danger">Không tìm thấy khóa học.</p>;

  const backgroundUrl = course.background
    ? course.background
    : "/image.png";

  return (
    <main>
      <Head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
          crossOrigin="anonymous"
        />
      </Head>
      <Metahead />
      <Navbar />
      <Hero background={backgroundUrl} />
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm float-up animate-fade-in">
                <img
                  src={backgroundUrl}
                  alt={course.title}
                  className="card-img-top animate-scale-hover"
                />
                <div className="card-body p-4">
                  <h2 className="card-title text-3xl font-bold mb-3 animate-slide-up">{course.title}</h2>
                  <p className="text-muted mb-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                    Giảng viên: <span className="fw-medium text-dark">{course.instructor?.full_name || "Đang tải..."}</span>
                  </p>
                  <p className="card-text text-secondary mb-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                    {course.description}
                  </p>
                  <div className="d-flex justify-content-between align-items-center border-top pt-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                    <span className="text-muted">
                      👥 <strong>{course.enrollment_count ?? 0}</strong> học viên
                    </span>
                    <span className="text-success fw-bold fs-5">
                      {course.price_bigint} VND
                    </span>
                  </div>
                  {course.price_bigint > 0 && (
                    <>
                      {/* Nút thêm bài học */}
                      <button
                        className="btn btn-enroll text-white mt-4 w-100 animate-pulse"
                        onClick={handleAddToCart}
                      >
                        Thêm bài học mới
                      </button>

                      {/* Nút tạo bài kiểm tra */}
                      <button
                        className="btn btn-secondary mt-3 w-100 animate-fade-in"
                        onClick={() => router.push(`/intructor/create-exam/${slug}`)}
                      >
                        📝 Tạo bài kiểm tra
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-5 bg-light">
        <div className="container">
          {/* phần thông tin khóa học */}

          {/* 🆕 Danh sách bài kiểm tra */}
          <div className="mt-5">
            <h3 className="mb-4">📋 Danh sách bài kiểm tra</h3>
            {exams.length === 0 ? (
              <p className="text-muted">Chưa có bài kiểm tra nào.</p>
            ) : (
              <div className="list-group">
                {exams.map((exam) => (
                  <div key={exam.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">{exam.title}</h5>
                      <small className="text-muted">
                        ⏳ Thời lượng: {exam.duration_minutes} phút | 🎯 Điểm đạt: {exam.passing_score}
                        | ❓ Số câu hỏi: {exam.questions?.length || 0}
                      </small>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteExam(exam.id)}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Thêm phần bài học */}
      <LessonList slug={slug as string} />
      <Footer />
    </main>
  );
}