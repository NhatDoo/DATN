'use client';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Metahead from "../../../components/Head";
import Hero from "../../../components/Herowrap_cart";
import Footer from "../../../components/Footer";
import "../../../globals.css";
import { checkIsBanned } from '@/app/ultis/checkbanned';
import Hls from 'hls.js';

interface LessonData {
  id: string;
  title: string;
  description: string;
  streamUrl: string;
  courseId: string;
}

interface Review {
  id: string;
  user_id: string;
  title: string;
  rating: number;
  content: string;
}

export default function WatchLessonPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { slug } = useParams();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);

  // ✅ Sử dụng useRef để track milestone đã gửi
  const lastSentMilestone = useRef<number>(-1);

  const handleSubmitReview = async () => {
    try {
      setSubmitting(true);
      const courseRes = await fetch(`http://localhost:3001/course/slug/${slug}`);
      if (!courseRes.ok) throw new Error("Không thể lấy thông tin khóa học");
      const courseData = await courseRes.json();
      const courseId = courseData.id;

      const res = await fetch(`http://localhost:3001/reviews/addreviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          course_id: courseId,
          rating: newReview.rating,
          title: newReview.title,
          content: newReview.content,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể gửi đánh giá");

      alert("🎉 Đã gửi đánh giá thành công!");
      setNewReview({ rating: 5, title: "", content: "" });
      setReviews((prev) => [data, ...prev]);
    } catch (err: any) {
      alert("❌ Lỗi gửi đánh giá: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    checkIsBanned();
    if (typeof window !== "undefined") {
      const id = sessionStorage.getItem("lesson_id");
      setLessonId(id);
      console.log("📌 Lesson ID from sessionStorage:", id);
    }
  }, []);

  useEffect(() => {
    if (!lesson || !lessonId) {
      console.log("⚠️ Chưa có lesson hoặc lessonId:", { lesson: !!lesson, lessonId });
      return;
    }

    const video = document.getElementById("video") as HTMLVideoElement;
    if (!video) {
      console.log("⚠️ Không tìm thấy video element");
      return;
    }

    const handleProgress = async () => {
      if (!video.duration || isNaN(video.duration)) return;

      const currentProgress = (video.currentTime / video.duration) * 100;
      setProgress(currentProgress);

      // Tính milestone hiện tại (10, 20, 30, ...)
      const currentMilestone = Math.floor(currentProgress / 10) * 10;

      // ✅ Chỉ gửi khi đạt milestone mới và chưa gửi milestone này
      if (currentMilestone > 0 && currentMilestone !== lastSentMilestone.current && currentMilestone % 10 === 0) {
        lastSentMilestone.current = currentMilestone;

        try {
          const response = await fetch(`http://localhost:3001/lessonprogress/update-progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              lessonId: lessonId,
              progress: Math.floor(currentProgress), // ✅ Gửi integer
            }),
          });

          const result = await response.json();
          console.log(`✅ Đã cập nhật tiến độ: ${currentMilestone}%`, result);
        } catch (err) {
          console.error("❌ Không thể cập nhật tiến độ:", err);
        }
      }

      // Đánh dấu hoàn thành khi > 90%
      if (currentProgress > 90 && !isComplete) {
        try {
          const response = await fetch(`http://localhost:3001/lessonprogress/mark-complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              lessonId: lessonId,
              courseId: lesson.courseId,
            }),
          });

          const result = await response.json();
          setIsComplete(true);
          console.log("✅ Đã đánh dấu bài học hoàn thành", result);
        } catch (err) {
          console.error("❌ Không thể đánh dấu hoàn thành:", err);
        }
      }
    };

    video.addEventListener("timeupdate", handleProgress);
    return () => {
      video.removeEventListener("timeupdate", handleProgress);
      // Reset milestone khi unmount
      lastSentMilestone.current = -1;
    };
  }, [lesson, isComplete, lessonId]);


  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const courseRes = await fetch(`http://localhost:3001/course/slug/${slug}`);
        if (!courseRes.ok) throw new Error("Không thể lấy thông tin khóa học");
        const courseData = await courseRes.json();
        const courseId = courseData.id;

        const progressRes = await fetch(`http://localhost:3001/lessonprogress/progress/${courseId}`, {
          credentials: "include",
        });
        if (!progressRes.ok) {
          // If request fails (e.g. admin has no progress), just ignore
          setProgress(0);
          setIsComplete(false);
          return;
        }
        const data = await progressRes.json();

        setProgress(data.progress || 0);
        setIsComplete(data.isComplete || false);
      } catch (err: any) {
        console.warn("Could not fetch progress:", err.message);
      }
    };

    if (slug) fetchProgress();
  }, [slug]);

  // Lấy bài học
  useEffect(() => {
    const token = sessionStorage.getItem("lesson_token");
    if (!token) {
      setError('Không có token truy cập.');
      return;
    }

    const fetchLesson = async () => {
      try {
        const res = await fetch(`http://localhost:3001/lessions/secure?token=${token}`, {
          credentials: "include"
        });
        if (!res.ok) throw new Error('Không thể tải bài học.');
        const data = await res.json();
        setLesson(data);
        console.log("📚 Lesson loaded:", data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchLesson();
  }, [token]);

  // Lấy reviews
  useEffect(() => {
    if (!slug) return;
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await fetch(`http://localhost:3001/reviews/by-course/${slug}`);
        if (!res.ok) throw new Error('Không thể tải đánh giá.');
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err: any) {
        console.error('Lỗi tải reviews:', err);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [slug]);

  // Khởi tạo HLS
  useEffect(() => {
    if (lesson && lesson.streamUrl) {
      const video = document.getElementById('video') as HTMLVideoElement;
      if (video) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(lesson.streamUrl);
          hls.attachMedia(video);
          return () => hls.destroy();
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = lesson.streamUrl;
        }
      }
    }
  }, [lesson]);

  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>;
  if (!lesson) return <div className="text-center mt-10">Đang tải bài học...</div>;

  return (
    <main>
      <Metahead />
      <Hero background="/images/bg_2.jpg" />
      <Navbar />
      <div className="container-fluid bg-light py-4">
        <div className="container">
          <div className="row">
            {/* VIDEO */}
            <div className="col-lg-8 col-md-12 mb-4">
              <h1 className="h4 fw-bold mb-3">{lesson.title}</h1>

              <div className="bg-dark rounded shadow-sm mb-3 position-relative">
                <video
                  id="video"
                  controls
                  className="w-100 rounded"
                  style={{ maxHeight: "70vh" }}
                />

                {/* Thanh tiến độ */}
                <div
                  className="progress position-absolute bottom-0 start-0 w-100"
                  style={{ height: "6px" }}
                >
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${progress}%` }}
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted fs-5 mb-0">{lesson.description}</p>
                <p className="text-end small text-muted mb-0">
                  Tiến độ: {progress.toFixed(1)}%{" "}
                  {isComplete && <span className="text-success">✅ Hoàn thành</span>}
                </p>
              </div>
            </div>

            {/* REVIEW */}
            <div className="col-lg-4 col-md-12">
              <div
                className="bg-white rounded shadow p-4 sticky-top"
                style={{ top: "1rem" }}
              >
                <h2 className="h5 fw-semibold mb-3">Đánh giá khóa học</h2>

                {loadingReviews ? (
                  <p className="text-secondary">Đang tải đánh giá...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-secondary">Chưa có đánh giá nào.</p>
                ) : (
                  <div className="overflow-auto mb-4" style={{ maxHeight: "400px" }}>
                    {reviews.map((review) => (
                      <div key={review.id} className="border-bottom pb-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-medium">{review.user_id}</span>
                          <div className="text-warning">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>
                                {i < review.rating ? "★" : "☆"}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="small text-muted mb-1">{review.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* FORM REVIEW */}
                <div className="border-top pt-3">
                  <h3 className="h6 fw-semibold mb-3">Viết đánh giá của bạn</h3>

                  <div className="mb-3">
                    <label className="form-label">Tiêu đề</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newReview.title}
                      onChange={(e) =>
                        setNewReview({ ...newReview, title: e.target.value })
                      }
                      placeholder="Nhập tiêu đề..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nội dung</label>
                    <textarea
                      className="form-control"
                      value={newReview.content}
                      onChange={(e) =>
                        setNewReview({ ...newReview, content: e.target.value })
                      }
                      rows={3}
                      placeholder="Viết cảm nhận của bạn..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Đánh giá</label>
                    <div>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() =>
                            setNewReview({ ...newReview, rating: star })
                          }
                          className={`fs-4 me-1 ${star <= newReview.rating
                            ? "text-warning"
                            : "text-secondary"
                            }`}
                          style={{ cursor: "pointer" }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    className={`btn w-100 ${submitting ? "btn-secondary" : "btn-primary"
                      }`}
                    disabled={submitting}
                    onClick={handleSubmitReview}
                  >
                    {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}