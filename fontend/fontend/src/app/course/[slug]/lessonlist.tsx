"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkIsBanned } from '@/app/ultis/checkbanned';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
}

interface LessonListProps {
  slug: string;
}

interface User {
  id: string;
  full_name?: string;
  email?: string;
}

export default function LessonList({ slug }: LessonListProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isFreeCourse, setIsFreeCourse] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);

  // Progress State
  const [progress, setProgress] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    const id = sessionStorage.getItem("lesson_id");
    if (id) setLessonId(id);
  }, []);

  useEffect(() => {
    checkIsBanned();
    const fetchLessons = async () => {
      try {
        // 🔹 Lấy thông tin khóa học theo slug
        const resCourse = await fetch(`http://localhost:3001/course/slug/${slug}`, {
          credentials: "include",
        });

        const courseData = await resCourse.json();
        const course = Array.isArray(courseData)
          ? courseData[0]
          : courseData.data ?? courseData;
        const courseId = course.id;

        // ✅ Kiểm tra miễn phí
        if (Number(course.price_bigint) === 0) {
          console.log("🟢 Đây là khóa học miễn phí!");
          setIsFreeCourse(true);
          setIsEnrolled(true);

          // Lấy danh sách bài học
          const resLesson = await fetch(`http://localhost:3001/lessions/course/${courseId}`, {
            credentials: "include",
          });
          const lessonData = await resLesson.json();

          let lessonsArray: Lesson[] = [];
          if (Array.isArray(lessonData)) lessonsArray = lessonData;
          else if (Array.isArray(lessonData.data)) lessonsArray = lessonData.data;
          else if (lessonData.data?.lessons && Array.isArray(lessonData.data.lessons))
            lessonsArray = lessonData.data.lessons;

          setLessons(lessonsArray);

          // Get progress for free course (if user is logged in, they might have progress)
          try {
            const resProgress = await fetch(`http://localhost:3001/lessonprogress/progress/${courseId}`, {
              credentials: "include"
            });
            if (resProgress.ok) {
              const progressData = await resProgress.json();
              setCompletedLessonIds(progressData.completedLessonIds || []);
              setProgress((progressData.progress || 0) * 100);
            }
          } catch (e) { console.warn("Could not fetch progress for free course", e); }

          return;
        }

        // 🔹 Nếu KHÔNG miễn phí, phải xác thực người dùng
        const resUser = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });
        if (!resUser.ok) throw new Error("Không thể lấy thông tin người dùng");
        const user: any = await resUser.json();

        // Check if user is admin
        if (user.role === 'admin') {
          setIsEnrolled(true);
          const resLesson = await fetch(`http://localhost:3001/lessions/course/${courseId}`, {
            credentials: "include",
          });
          const lessonData = await resLesson.json();

          let lessonsArray: Lesson[] = [];
          if (Array.isArray(lessonData)) lessonsArray = lessonData;
          else if (Array.isArray(lessonData.data)) lessonsArray = lessonData.data;
          else if (lessonData.data?.lessons && Array.isArray(lessonData.data.lessons))
            lessonsArray = lessonData.data.lessons;

          setLessons(lessonsArray);
          return;
        }

        // 🔹 Kiểm tra enroll
        const resEnroll = await fetch(
          `http://localhost:3003/enrollments/verify?userId=${user.id}&courseId=${courseId}`,
          { credentials: "include" }
        );
        const enrollData = await resEnroll.json();

        console.log("🔍 DEBUG Enrollment:", { enrollData, isEnrolled: !!enrollData.isEnrolled, userId: user.id, courseId });

        setIsEnrolled(!!enrollData.isEnrolled);

        // 🔹 Lấy danh sách bài học (Luôn lấy, kể cả chưa enroll)
        const resLesson = await fetch(`http://localhost:3001/lessions/course/${courseId}`, {
          credentials: "include",
        });
        const lessonData = await resLesson.json();

        let lessonsArray: Lesson[] = [];
        if (Array.isArray(lessonData)) lessonsArray = lessonData;
        else if (Array.isArray(lessonData.data)) lessonsArray = lessonData.data;
        else if (lessonData.data?.lessons && Array.isArray(lessonData.data.lessons))
          lessonsArray = lessonData.data.lessons;

        setLessons(lessonsArray);

        // 🔹 Get Progress (Chỉ lấy nếu đã enroll)
        if (enrollData.isEnrolled) {
          try {
            const resProgress = await fetch(`http://localhost:3001/lessonprogress/progress/${courseId}`, {
              credentials: "include"
            });
            if (resProgress.ok) {
              const progressData = await resProgress.json();
              setCompletedLessonIds(progressData.completedLessonIds || []);
              setProgress((progressData.progress || 0) * 100);
            }
          } catch (e) { console.error("Error fetching progress", e); }
        }
      } catch (err) {
        console.error("❌ Lỗi khi fetch lessons:", err);
        setMessage("Đã xảy ra lỗi khi tải bài học.");
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [slug]);

  const handleWatch = async (lessonId: string) => {
    // Kiểm tra nếu chưa ghi danh (và không phải khóa học miễn phí)
    if (!isEnrolled && !isFreeCourse) {
      alert("⚠️ Bạn cần ghi danh khóa học để xem video bài học này.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/lessions/access/${lessonId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Không thể truy cập bài học.");
      }

      const data = await res.json();

      sessionStorage.setItem("lesson_token", data.token);
      sessionStorage.setItem("lesson_id", lessonId);

      if (isFreeCourse) {
        router.push(`/course/${slug}/watch`);
        return;
      }

      if (!data.token) throw new Error("Không thể tạo token xem bài học.");
      router.push(`/course/${slug}/watch?token=${data.token}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Không thể xem bài học này.");
    }
  };

  if (loading) return <p className="text-center mt-5">Đang tải dữ liệu...</p>;

  return (
    <section className="py-4">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Danh sách bài học</h3>
          {isEnrolled && (
            <div className="text-end" style={{ minWidth: '200px' }}>
              <span className="text-muted small">Tiến độ: {Math.round(progress)}%</span>
              <div className="progress mt-1" style={{ height: '8px' }}>
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
          )}
        </div>

        {!isEnrolled && !isFreeCourse && (
          <div className="alert alert-warning mb-3">
            <strong>🔒 Nội dung bị khóa:</strong> Bạn cần ghi danh khóa học để xem video bài học.
          </div>
        )}

        {lessons.length === 0 ? (
          <p>Hiện chưa có bài học nào.</p>
        ) : (
          <ul className="list-group">
            {lessons.map((lesson) => {
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isLocked = !isEnrolled && !isFreeCourse;
              return (
                <li
                  key={lesson.id}
                  className={`list-group-item d-flex justify-content-between align-items-center ${isLocked ? 'text-muted' : 'list-group-item-action'}`}
                  style={{ cursor: isLocked ? "not-allowed" : "pointer", opacity: isLocked ? 0.7 : 1 }}
                  onClick={() => {
                    console.log("🔍 DEBUG Click:", { isLocked, isEnrolled, isFreeCourse, lessonId: lesson.id });
                    if (!isLocked) handleWatch(lesson.id);
                  }}
                >
                  <div className="d-flex align-items-center">
                    {isLocked && <span className="me-2" title="Cần ghi danh để xem">🔒</span>}
                    <div>
                      <h5 className="mb-1">{lesson.title}</h5>
                      {lesson.description && <p className="text-muted mb-0 small">{lesson.description}</p>}
                    </div>
                  </div>
                  <div>
                    {isCompleted && (
                      <span className="badge bg-success rounded-pill">Completed ✓</span>
                    )}
                    {isLocked && (
                      <span className="badge bg-secondary rounded-pill">Chưa ghi danh</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
