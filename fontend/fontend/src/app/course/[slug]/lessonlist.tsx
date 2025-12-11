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
          return; // ❗ Không cần kiểm tra enrollment nữa
        }

        // 🔹 Nếu KHÔNG miễn phí, phải xác thực người dùng
        const resUser = await fetch("http://localhost:3000/users/profile", {
          credentials: "include",
        });
        if (!resUser.ok) throw new Error("Không thể lấy thông tin người dùng");
        const user: User = await resUser.json();

        // 🔹 Kiểm tra enroll
        const resEnroll = await fetch(
          `http://localhost:3003/enrollments/verify?userId=${user.id}&courseId=${courseId}`,
          { credentials: "include" }
        );
        const enrollData = await resEnroll.json();

        if (!enrollData.isEnrolled) {
          setMessage("Bạn chưa đăng ký khóa học này.");
          setIsEnrolled(false);
        } else {
          setIsEnrolled(true);

          // 🔹 Lấy danh sách bài học
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
  try {
    const res = await fetch(`http://localhost:3001/lessions/access/${lessonId}`, {
      credentials: "include",
    });
    const data = await res.json();

    // Lưu token và lessonId
    sessionStorage.setItem("lesson_token", data.token);
    sessionStorage.setItem("lesson_id", lessonId);

    if (isFreeCourse) {
      router.push(`/course/${slug}/watch`);
      return;
    }

    if (!data.token) throw new Error("Không thể tạo token xem bài học.");
    router.push(`/course/${slug}/watch?token=${data.token}`);
  } catch (err) {
    console.error(err);
    alert("Không thể xem bài học này.");
  }
};

  if (loading) return <p className="text-center mt-5">Đang tải dữ liệu...</p>;
  if (!isEnrolled) return <p className="text-center text-danger mt-5">{message}</p>;

  return (
    <section className="py-4">
      <div className="container">
        <h3 className="mb-4">Danh sách bài học</h3>
        {lessons.length === 0 ? (
          <p>Hiện chưa có bài học nào.</p>
        ) : (
          <ul className="list-group">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="list-group-item list-group-item-action"
                style={{ cursor: "pointer" }}
                onClick={() => handleWatch(lesson.id)}
              >
                <h5>{lesson.title}</h5>
                {lesson.description && <p className="text-muted">{lesson.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
