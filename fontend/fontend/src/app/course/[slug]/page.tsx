"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Metahead from "../../components/Head";
import Hero from "../../components/Herowrap";
import Loader from "@/app/components/Loader";
import LessonList from "./lessonlist";
import Head from "next/head";
import "../../globals.css";
import "./course-detail.css";
import { checkIsBanned } from '@/app/ultis/checkbanned';
import StarRating from "../../components/StarRating";
import ReportModal from "../../components/ReportModal";
import InstructorStudentProgress from "./InstructorStudentProgress";

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [checkingEnroll, setCheckingEnroll] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);

  // 🟢 Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    try {
      const orderRes = await fetch("http://localhost:3002/orders/current", {
        credentials: "include",
      });
      const order = await orderRes.json();

      if (!order?.id) {
        alert("Không thể xác định giỏ hàng.");
        return;
      }

      const addRes = await fetch("http://localhost:3002/order-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          order_id: order.id,
          course_id: course.id,
          price_bigint: course.price_bigint,
        }),
      });

      const result = await addRes.json();

      if (addRes.ok) {
        alert(`Đã thêm khóa học "${course.title}" vào giỏ hàng!`);
        window.location.href = "/cart";
      } else {
        alert(result.message || "Thêm vào giỏ hàng thất bại.");
      }
    } catch (error) {
      console.error("❌ Lỗi thêm vào giỏ hàng:", error);
      alert("Đã xảy ra lỗi khi thêm vào giỏ hàng.");
    }
  };

  // 💸 Refund
  const handleRefund = async () => {
    if (!course?.id) {
      alert("Không tìm thấy khóa học.");
      return;
    }

    if (!confirm(`Bạn có chắc muốn hoàn tiền cho khóa học "${course.title}"?`))
      return;

    try {
      // 1️⃣ Lấy order item dựa vào courseId
      const orderItemRes = await fetch("http://localhost:3002/order-items/user-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId: course.id }),
      });

      if (!orderItemRes.ok) {
        const err = await orderItemRes.json();
        throw new Error(err.message || "Không tìm thấy đơn hàng phù hợp.");
      }

      const orderItems = await orderItemRes.json();
      if (!orderItems.length) throw new Error("Không tìm thấy order item.");

      const orderItem = orderItems[0]; // ✅ Lấy phần tử đầu tiên
      console.log("Order Item for refund:", orderItem.order_id, orderItem.course_id);

      // 2️⃣ Refund
      const refundRes = await fetch("http://localhost:3002/vnpay-payments/refund-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: orderItem.order_id,
          courseIds: [orderItem.course_id],
        }),
      });

      const result = await refundRes.json();

      if (refundRes.ok) {
        alert("✅ Hoàn tiền thành công!");
        setIsEnrolled(false); // cập nhật lại trạng thái
      } else {
        alert(`❌ Hoàn tiền thất bại: ${result.message || "Lỗi không xác định"}`);
      }
    } catch (error) {
      console.error("❌ Lỗi hoàn tiền:", error);
      alert("Đã xảy ra lỗi khi hoàn tiền.");
    }
  };

  // 🚀 Kích hoạt khóa học (Ghi danh)
  const handleActivate = async () => {
    if (!currentUserId || !course?.id) return;
    try {
      const res = await fetch("http://localhost:3003/enrollments/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include", // If needed, but API is likely public or handles it? Backend didn't specify credentials requirement but controller is simple.
        // Actually usually we need credentials.
        body: JSON.stringify({ userId: currentUserId, courseId: course.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Ghi danh khóa học thành công! Thời gian hoàn tiền bắt đầu tính từ bây giờ.");
        setEnrollmentStatus("active");
      } else {
        alert(data.message || "Ghi danh thất bại.");
      }
    } catch (e) {
      console.error("Activate error:", e);
      alert("Lỗi khi ghi danh.");
    }
  };

  const handleReportSubmit = async (reason: string, description: string) => {
    if (!currentUserId) {
      alert("Vui lòng đăng nhập để báo cáo.");
      return;
    }
    try {
      const res = await fetch("http://localhost:3001/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: course.id,
          user_id: currentUserId,
          reason,
          description,
        }),
      });
      if (res.ok) {
        alert("Báo cáo đã được gửi thành công.");
      } else {
        alert("Gửi báo cáo thất bại.");
      }
    } catch (error) {
      console.error("Report error:", error);
      alert("Có lỗi xảy ra.");
    }
  };


  // 🧩 Lấy dữ liệu khóa học
  useEffect(() => {
    checkIsBanned();
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

  // 🔍 Kiểm tra người dùng đã đăng ký khóa học chưa
  useEffect(() => {
    const checkEnroll = async () => {
      if (!course?.id) return;
      try {
        const userRes = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });
        if (!userRes.ok) throw new Error("Không thể lấy thông tin người dùng.");
        const user = await userRes.json();
        setCurrentUserId(user.id);

        const enrollRes = await fetch(
          `http://localhost:3003/enrollments/verify?userId=${user.id}&courseId=${course.id}`,
          { credentials: "include" }
        );

        const enrollData = await enrollRes.json();
        setIsEnrolled(enrollData.isEnrolled || false);
        setEnrollmentStatus(enrollData.status || null);
      } catch (err) {
        console.error("❌ Lỗi khi kiểm tra enroll:", err);
      } finally {
        setCheckingEnroll(false);
      }
    };

    checkEnroll();
  }, [course]);

  // 🌟 Lấy đánh giá khóa học
  useEffect(() => {
    const fetchReviews = async () => {
      if (!slug) return;
      try {
        const res = await fetch(`http://localhost:3001/reviews/by-course/${slug}`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error("❌ Lỗi khi fetch reviews:", err);
      }
    };

    fetchReviews();
  }, [slug]);

  if (loading || checkingEnroll) return <Loader />;
  if (!course)
    return <p className="text-center mt-5 text-danger">Không tìm thấy khóa học.</p>;

  const backgroundUrl = course.background || "/image.png";
  console.log(course.id);

  // Calculate rating
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
      : 0;

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
              <div className="card border-0 shadow-sm">
                <img
                  src={backgroundUrl}
                  alt={course.title}
                  className="card-img-top animate-scale-hover"
                />
                <div className="card-body p-4">
                  <h2 className="card-title text-3xl font-bold mb-3">
                    {course.title}
                  </h2>
                  <div className="mb-3">
                    <StarRating rating={averageRating} totalReviews={totalReviews} />
                  </div>
                  <p className="text-muted mb-2">
                    Giảng viên:{" "}
                    <span className="fw-medium text-dark">
                      {course.instructor?.full_name || "Đang tải..."}
                    </span>
                  </p>
                  <p className="card-text text-secondary mb-4">
                    {course.description}
                  </p>

                  <div className="d-flex justify-content-between align-items-center border-top pt-3">
                    <span className="text-muted">
                      👥 <strong>{course.enrollment_count ?? 0}</strong> học viên
                    </span>
                    <span className="text-success fw-bold fs-5">
                      {course.price_bigint} VND
                    </span>
                  </div>

                  {/* 🔁 Nút linh hoạt theo trạng thái */}
                  {course.price_bigint > 0 && (
                    <>
                      {!enrollmentStatus && (
                        <button
                          className="btn mt-4 w-100 text-white btn-enroll"
                          onClick={handleAddToCart}
                        >
                          🛒 Thêm vào giỏ hàng
                        </button>
                      )}

                      {enrollmentStatus === 'pending' && (
                        <button
                          className="btn mt-4 w-100 text-white btn-success"
                          onClick={handleActivate}
                          style={{ backgroundColor: '#28a745' }}
                        >
                          🚀 Ghi danh khóa học (Bắt đầu tính giờ hoàn tiền)
                        </button>
                      )}

                      {enrollmentStatus === 'active' && (
                        <button
                          className="btn mt-4 w-100 text-white btn-danger"
                          onClick={handleRefund}
                        >
                          💸 Hoàn tiền khóa học
                        </button>
                      )}
                    </>
                  )}

                  {/* 📝 Nút làm bài kiểm tra - Chỉ hiện khi đã enroll và active */}
                  {isEnrolled && enrollmentStatus === 'active' && (
                    <button
                      className="btn mt-3 w-100 btn-primary text-white"
                      onClick={() => window.location.href = `/course/${slug}/exam`}
                    >
                      📝 Làm bài kiểm tra
                    </button>
                  )}

                  <button
                    className="btn mt-3 w-100 btn-outline-secondary"
                    onClick={() => setShowReportModal(true)}
                  >
                    🚩 Báo cáo khóa học
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructor Progress Section */}
      {currentUserId && course.instructor_id === currentUserId && (
        <section className="py-4 container">
          <InstructorStudentProgress courseId={course.id} />
        </section>
      )}

      {/* Đánh giá khóa học */}
      <section className="py-5">
        <div className="container">
          <h3 className="mb-4 font-bold text-2xl">Đánh giá từ học viên</h3>
          <div className="row">
            <div className="col-lg-8">
              {reviews.length > 0 ? (
                <div className="list-group">
                  {reviews.map((review) => (
                    <div key={review.id} className="list-group-item border-0 border-bottom py-4">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="mb-1 font-bold">{review.user?.full_name || "Người dùng ẩn danh"}</h5>
                          <div className="mb-2">
                            <StarRating rating={review.rating} showCount={false} />
                          </div>
                          {review.title && <h6 className="fw-bold">{review.title}</h6>}
                          <p className="text-muted mb-0">{review.content}</p>
                        </div>
                        <small className="text-muted">
                          {(() => {
                            try {
                              if (!review.created_at) return "";
                              let dateStr = String(review.created_at);

                              // Fix 1: Replace space with T
                              dateStr = dateStr.replace(" ", "T");

                              // Fix 2: Handle timezone +07 -> +07:00
                              // Regex to find +XX or -XX at the end and append :00
                              if (/[+-]\d{2}$/.test(dateStr)) {
                                dateStr += ":00";
                              }

                              const date = new Date(dateStr);
                              if (isNaN(date.getTime())) {
                                // Fallback: just take the YYYY-MM-DD part
                                const simpleDate = String(review.created_at).split(" ")[0];
                                return simpleDate.split("-").reverse().join("/");
                              }

                              return date.toLocaleDateString("vi-VN");
                            } catch (e) {
                              return String(review.created_at).split(" ")[0]; // Ultimate fallback
                            }
                          })()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Chưa có đánh giá nào cho khóa học này.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Danh sách bài học */}
      <LessonList slug={slug as string} />
      <Footer />
      <ReportModal
        show={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
      />
    </main>
  );
}
