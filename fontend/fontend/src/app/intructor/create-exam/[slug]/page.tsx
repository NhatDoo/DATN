"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Intructernavbar";
import Footer from "../../../components/Footer";
import Metahead from "../../../components/Head";
import Hero from "../../../components/Herowrap";
import Loader from "@/app/components/Loader";
import "../../../globals.css";
import { checkIsBanned } from '@/app/ultis/checkbanned';

export default function CreateExamPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(50);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState<any[]>([]);

  // New question fields
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qAnswer, setQAnswer] = useState("");


  // 🧠 Fetch course
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

  // ➕ Thêm câu hỏi tạm
  // ➕ Thêm câu hỏi tạm
  const handleAddQuestion = () => {
    if (!qText.trim()) return alert("Nhập nội dung câu hỏi");
    if (qOptions.some((opt) => !opt.trim()))
      return alert("Nhập đầy đủ 4 đáp án A, B, C, D");
    if (!qAnswer) return alert("Chọn đáp án đúng");

    const newQuestionNumber = questions.length + 1;

    setQuestions([
      ...questions,
      {
        question_text: `Câu ${newQuestionNumber}: ${qText}`,
        options: qOptions,
        correct_answer: qAnswer,
      },
    ]);

    // Reset form
    setQText("");
    setQOptions(["", "", "", ""]);
    setQAnswer("");
  };

  // 📥 Tải file mẫu & Upload
  const handleDownloadSample = () => {
    window.open("http://localhost:3003/exams/sample-excel", "_blank");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:3003/exams/parse-excel", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to parse excel");

      const parsedQuestions = await res.json();
      if (Array.isArray(parsedQuestions)) {
        setQuestions((prev) => [...prev, ...parsedQuestions]);
        alert(`✅ Đã thêm ${parsedQuestions.length} câu hỏi từ Excel`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi đọc file Excel");
    }
  };

  // 🚀 Gửi request tạo bài kiểm tra
  const handleSubmit = async () => {
    if (!title.trim()) return alert("Nhập tiêu đề bài kiểm tra");
    if (questions.length === 0) return alert("Thêm ít nhất 1 câu hỏi");

    try {
      const res = await fetch("http://localhost:3003/exams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: course.id,
          title,
          description,
          passing_score: passingScore,
          duration_minutes: durationMinutes,
          questions,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Tạo bài kiểm tra thành công!");
        router.push(`/intructor/course-detail/${slug}`);
      } else {
        alert("❌ Lỗi: " + (data.message || "Không thể tạo bài kiểm tra"));
      }
    } catch (err) {
      console.error("Lỗi khi tạo bài kiểm tra:", err);
    }
  };

  if (loading) return <Loader />;
  if (!course) return <p className="text-center mt-5 text-danger">Không tìm thấy khóa học.</p>;

  return (
    <main>
      <Metahead />
      <Navbar />
      <Hero background={course.background || "/image.png"} />
      <section className="container py-5">
        <h2 className="mb-4">🧩 Tạo bài kiểm tra cho khóa học: {course.title}</h2>

        <div className="card p-4 shadow-sm mb-4">
          <h5 className="mb-3">Thông tin bài kiểm tra</h5>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="form-control mb-2"
            placeholder="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="row">
            <div className="col-md-6">
              <h6>Điểm tối đa</h6>
              <input
                type="number"
                className="form-control mb-2"
                placeholder="Điểm đạt (50)"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
            </div>
            <div className="col-md-6">
              <h6>Thời lượng (phút)</h6>
              <input
                type="number"
                className="form-control mb-2"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
          </div>
        </div>



        <div className="card p-4 shadow-sm mb-4">
          <h5 className="mb-3">📄 Nhập từ Excel (Tùy chọn)</h5>
          <div className="d-flex gap-3 align-items-center">
            <button
              className="btn btn-outline-primary"
              onClick={handleDownloadSample}
            >
              ⬇️ Tải file mẫu
            </button>
            <div>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="form-control"
                onChange={handleFileUpload}
              />
            </div>
          </div>
          <small className="text-muted mt-2">
            Tải file mẫu, điền câu hỏi và upload để thêm nhanh.
          </small>
        </div>

        <div className="card p-4 shadow-sm mb-4">
          <h5 className="mb-3">✏️ Câu hỏi</h5>

          <input
            type="text"
            className="form-control mb-3"
            placeholder="Nội dung câu hỏi"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
          />

          {/* 4 lựa chọn A-D */}
          {["A", "B", "C", "D"].map((label, idx) => (
            <div key={label} className="input-group mb-2">
              <span className="input-group-text w-25">Đáp án {label}</span>
              <input
                type="text"
                className="form-control"
                placeholder={`Nhập đáp án ${label}`}
                value={qOptions[idx] || ""}
                onChange={(e) => {
                  const updated = [...qOptions];
                  updated[idx] = e.target.value;
                  setQOptions(updated);
                }}
              />
            </div>
          ))}

          {/* Chọn đáp án đúng */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Chọn đáp án đúng:</label>
            <div className="d-flex gap-3">
              {["A", "B", "C", "D"].map((opt) => (
                <div key={opt} className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="correctAnswer"
                    value={opt}
                    checked={qAnswer === opt}
                    onChange={(e) => setQAnswer(e.target.value)}
                  />
                  <label className="form-check-label">{opt}</label>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-secondary" onClick={handleAddQuestion}>
            ➕ Thêm câu hỏi
          </button>

          {questions.length > 0 && (
            <ul className="list-group mt-3">
              {questions.map((q, i) => (
                <li key={i} className="list-group-item">
                  <b>Câu {i + 1}:</b> {q.question_text}
                  <ul>
                    {q.options.map((opt: string, j: number) => (
                      <li
                        key={j}
                        style={{
                          color:
                            q.correct_answer === ["A", "B", "C", "D"][j]
                              ? "green"
                              : "black",
                        }}
                      >
                        {["A", "B", "C", "D"][j]}. {opt}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>


        <div className="d-flex justify-content-end gap-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => router.push(`/intructor/course-detail/${slug}`)}
          >
            ⬅️ Quay lại
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            🚀 Lưu bài kiểm tra
          </button>
        </div>
      </section>
      <Footer />
    </main >
  );
}
